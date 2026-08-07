import { NextRequest, NextResponse } from "next/server";
import { parsePdf, parseDocx } from "@/lib/parser";
import { extractSkillsWithAI } from "@/lib/skills-extractor";
import { analyzeResume } from "@/lib/resume-intelligence";
import { prisma } from "@/lib/prisma";
import { withAIProviderCheck } from "@/lib/middleware/ai-usage";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let currentStep = "file_validation";
  let userId: string | null = null;
  let fileName = "unknown";

  try {
    const { user: authUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    userId = authUser.id;

    // Rate limit: 10 parsing requests per 15 minutes per user
    const rateLimitError = checkRateLimit(req, { limit: 10, windowMs: 15 * 60 * 1000, identifier: userId });
    if (rateLimitError) return rateLimitError;

    // Check AI usage limits and resolve AI provider/key for resume-review feature
    const aiCheck = await withAIProviderCheck(req, 'resume-review');
    if (!aiCheck.allowed || !aiCheck.config) {
      return aiCheck.response || NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }
    const aiConfig = aiCheck.config;

    // Fetch profile belonging exclusively to authenticated user
    const pgProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { skills: true }
    });

    if (!pgProfile || !pgProfile.resumeUrl) {
      return NextResponse.json({ success: false, step: "file_validation", error: "No uploaded resume found. Please upload a resume first." }, { status: 404 });
    }

    fileName = pgProfile.resumeName || "unknown";
    const extension = fileName.split(".").pop()?.toLowerCase() || (pgProfile.resumeUrl.includes(".docx") ? "docx" : "pdf");

    let extractedText = pgProfile.resumeText || "";

    if (!extractedText) {
      currentStep = "cloudinary_download";
      const response = await fetch(pgProfile.resumeUrl);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      extractedText = extension === "pdf" ? await parsePdf(buffer) : await parseDocx(buffer);
      
      await prisma.profile.update({
        where: { id: pgProfile.id },
        data: { resumeText: extractedText }
      });
    }

    currentStep = "skills_extraction";
    const newSkills = await extractSkillsWithAI(extractedText, aiConfig);

    currentStep = "intelligence";
    let intelligence;
    try {
      intelligence = analyzeResume(extractedText, newSkills.map(s => s.name));
    } catch {
      intelligence = { 
        category: "General Professional", 
        suggestedRoles: [], 
        resumeSummary: "", 
        insights: { found: [], missing: [], tips: [] } 
      };
    }

    currentStep = "postgres_update";
    const skillMode = pgProfile.resumeSkillMode || "merge";
    
    if (skillMode === "replace") {
      await prisma.profileSkill.deleteMany({ where: { profileId: pgProfile.id } });
      if (newSkills.length > 0) {
        await prisma.profileSkill.createMany({
          data: newSkills.map(s => ({
            profileId: pgProfile.id,
            name: s.name,
            level: s.level ?? 80
          }))
        });
      }
    } else {
      const newUniqueSkills = newSkills.filter(
        ns => !pgProfile.skills.some(es => es.name.toLowerCase() === ns.name.toLowerCase())
      );
      if (newUniqueSkills.length > 0) {
        await prisma.profileSkill.createMany({
          data: newUniqueSkills.map(s => ({
            profileId: pgProfile.id,
            name: s.name,
            level: s.level ?? 80
          }))
        });
      }
    }

    const updatedPgProfile = await prisma.profile.update({
      where: { id: pgProfile.id },
      data: {
        lastAnalyzedAt: new Date(),
        resumeCategory: intelligence.category,
        resumeSummary: intelligence.resumeSummary,
        suggestedRoles: intelligence.suggestedRoles,
        insightsFound: intelligence.insights.found,
        insightsMissing: intelligence.insights.missing,
        insightsTips: intelligence.insights.tips
      },
      include: { skills: true }
    });

    try {
      await prisma.resumeParsingLog.create({
        data: {
          userId,
          status: "success",
          step: "complete",
          fileName,
          parsingTimeMs: Date.now() - startTime,
          skillsExtractedCount: newSkills.length,
        }
      });
    } catch (pgErr) {
      console.error("[Postgres Parsing Log Error]", pgErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        skillsExtractedCount: newSkills.length,
        skillsExtracted: newSkills,
        skills: updatedPgProfile.skills.map(s => ({ _id: s.id, name: s.name, level: s.level })),
        resumeCategory: updatedPgProfile.resumeCategory,
        resumeSummary: updatedPgProfile.resumeSummary,
        suggestedRoles: updatedPgProfile.suggestedRoles,
        resumeInsights: {
          found: updatedPgProfile.insightsFound,
          missing: updatedPgProfile.insightsMissing,
          tips: updatedPgProfile.insightsTips
        },
        lastAnalyzedAt: updatedPgProfile.lastAnalyzedAt,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unexpected error";
    try {
      if (userId) {
        await prisma.resumeParsingLog.create({
          data: {
            userId,
            status: "failed",
            step: currentStep,
            errorMsg: errorMessage,
            fileName,
            parsingTimeMs: Date.now() - startTime,
          }
        });

        await prisma.adminNotification.create({
          data: {
            type: "parsing_failed",
            title: "Resume Parsing Failed",
            message: `Failed parsing resume during step '${currentStep}' for user: ${userId}.`,
            metadata: { userId, step: currentStep }
          }
        });
      }
    } catch (logErr) {
      console.error("[Parse Resume Logger] Failed to record failure log:", logErr);
    }

    return safeErrorResponse(err, "Failed to parse resume");
  }
}
