import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import { parsePdf, parseDocx } from "@/lib/parser";
import { extractSkills } from "@/lib/skills-extractor";
import { analyzeResume } from "@/lib/resume-intelligence";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import ResumeParsingLog from "@/models/ResumeParsingLog";
import AdminNotification from "@/models/AdminNotification";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let currentStep = "file_validation";
  let userId: string | null = null;
  let fileName = "unknown";

  try {
    try {
      await connectDB();
    } catch (dbErr: any) {
      return NextResponse.json({ success: false, step: "mongodb_connection", error: dbErr.message }, { status: 500 });
    }

    const body = await req.json();
    userId = body.userId;

    if (!userId) return NextResponse.json({ success: false, step: "file_validation", error: "userId is required" }, { status: 400 });

    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) return NextResponse.json({ success: false, step: "authentication", error: "Unauthorized" }, { status: 401 });
    if (userId !== mongoUser._id.toString()) return NextResponse.json({ success: false, step: "authorization", error: "Forbidden" }, { status: 403 });

    const profile = await Profile.findOne({ userId });
    if (!profile?.resumeUrl) {
      return NextResponse.json({ success: false, step: "file_validation", error: "No uploaded resume found. Please upload a resume first." }, { status: 404 });
    }

    fileName = profile.resumeName || "unknown";
    const extension = fileName.split(".").pop()?.toLowerCase() || (profile.resumeUrl.includes(".docx") ? "docx" : "pdf");

    let extractedText = profile.resumeText || "";

    if (!extractedText) {
      currentStep = "cloudinary_download";
      try {
        const response = await fetch(profile.resumeUrl);
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        const buffer   = Buffer.from(await response.arrayBuffer());
        extractedText  = extension === "pdf" ? await parsePdf(buffer) : await parseDocx(buffer);
        profile.resumeText = extractedText;
      } catch (dlErr: any) {
        // Log custom error
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
      intelligence = { category: "General Professional", suggestedRoles: [], resumeSummary: "", insights: { found: [], missing: [], tips: [] } };
    }

    currentStep = "mongodb_update";
    try {
      const skillMode = profile.resumeSkillMode || "merge";
      if (skillMode === "replace") {
        profile.skills = newSkills;
      } else {
        const existing = profile.skills || [];
        const merged   = [...existing];
        for (const s of newSkills) {
          if (!merged.some((e: any) => e.name.toLowerCase() === s.name.toLowerCase())) merged.push(s);
        }
        profile.skills = merged;
      }

      profile.lastAnalyzedAt = new Date();
      profile.resumeCategory = intelligence.category;
      profile.resumeSummary  = intelligence.resumeSummary;
      profile.suggestedRoles = intelligence.suggestedRoles;
      profile.resumeInsights = intelligence.insights;

      await profile.save();
    } catch (dbErr: any) {
      throw dbErr;
    }

    // Success log
    await ResumeParsingLog.create({
      userId,
      status: "success",
      step: "complete",
      fileName,
      parsingTimeMs: Date.now() - startTime,
      skillsExtractedCount: newSkills.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        skillsExtractedCount: newSkills.length,
        skillsExtracted:      newSkills,
        skills:               profile.skills,
        resumeCategory:       profile.resumeCategory,
        resumeSummary:        profile.resumeSummary,
        suggestedRoles:       profile.suggestedRoles,
        resumeInsights:       profile.resumeInsights,
        lastAnalyzedAt:       profile.lastAnalyzedAt,
      },
    });
  } catch (err: any) {
    // Log failure in DB
    try {
      if (userId) {
        await ResumeParsingLog.create({
          userId,
          status: "failed",
          step: currentStep,
          errorMsg: err.message || "Unexpected error",
          fileName,
          parsingTimeMs: Date.now() - startTime,
        });

        // Notify Admin
        await AdminNotification.create({
          type: "parsing_failed",
          title: "Resume Parsing Failed",
          message: `Failed parsing resume during step '${currentStep}' for user: ${userId}. Error: ${err.message || "Unknown error"}`,
          metadata: { userId, step: currentStep, error: err.message },
        });
      }
    } catch (logErr) {
      console.error("[Parse Resume Logger] Failed to record resume parsing failure log:", logErr);
    }

    return NextResponse.json({ success: false, step: currentStep, error: err.message || "Unexpected error" }, { status: 500 });
  }
}
