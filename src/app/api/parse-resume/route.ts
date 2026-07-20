import { NextRequest, NextResponse } from "next/server";
import { parsePdf, parseDocx } from "@/lib/parser";
import { extractSkills } from "@/lib/skills-extractor";
import { analyzeResume } from "@/lib/resume-intelligence";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let currentStep = "file_validation";
  let userId: string | null = null;
  let fileName = "unknown";

  try {
    const body = await req.json();
    userId = body.userId;

    if (!userId) {
      return NextResponse.json({ success: false, step: "file_validation", error: "userId is required" }, { status: 400 });
    }

    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json({ success: false, step: "authentication", error: "Unauthorized" }, { status: 401 });
    }
    if (userId !== mongoUser._id.toString()) {
      return NextResponse.json({ success: false, step: "authorization", error: "Forbidden" }, { status: 403 });
    }

    // Fetch profile from Postgres
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
      try {
        const response = await fetch(pgProfile.resumeUrl);
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        extractedText = extension === "pdf" ? await parsePdf(buffer) : await parseDocx(buffer);
        
        // Save the extracted text in Postgres
        await prisma.profile.update({
          where: { id: pgProfile.id },
          data: { resumeText: extractedText }
        });
      } catch (dlErr: any) {
        throw dlErr;
      }
    }

    currentStep = "skills_extraction";
    const newSkills = extractSkills(extractedText);

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
    
    // Replace skills in Postgres
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
    } 
    // Merge skills in Postgres
    else {
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

    // Update profile metadata in Postgres
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

    // Create success log in Postgres
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
    // Log failure in Postgres and MongoDB
    try {
      if (userId) {
        // Postgres Failure log
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

        // Postgres Notify Admin
        await prisma.adminNotification.create({
          data: {
            type: "parsing_failed",
            title: "Resume Parsing Failed",
            message: `Failed parsing resume during step '${currentStep}' for user: ${userId}. Error: ${errorMessage}`,
            metadata: { userId, step: currentStep, error: errorMessage }
          }
        });
      }
    } catch (logErr) {
      console.error("[Parse Resume Logger] Failed to record resume parsing failure log:", logErr);
    }

    return NextResponse.json({ success: false, step: currentStep, error: errorMessage }, { status: 500 });
  }
}
