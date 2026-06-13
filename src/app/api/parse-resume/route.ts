import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import { parsePdf, parseDocx } from "@/lib/parser";
import { extractSkills } from "@/lib/skills-extractor";
import { analyzeResume } from "@/lib/resume-intelligence";
import { getOrCreateMongoUser } from "@/lib/auth-sync";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let currentStep = "file_validation";
  try {
    try {
      await connectDB();
    } catch (dbErr: any) {
      return NextResponse.json({ success: false, step: "mongodb_connection", error: dbErr.message }, { status: 500 });
    }

    const body   = await req.json();
    const { userId } = body;

    if (!userId) return NextResponse.json({ success: false, step: "file_validation", error: "userId is required" }, { status: 400 });

    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) return NextResponse.json({ success: false, step: "authentication", error: "Unauthorized" }, { status: 401 });
    if (userId !== mongoUser._id.toString()) return NextResponse.json({ success: false, step: "authorization", error: "Forbidden" }, { status: 403 });

    const profile = await Profile.findOne({ userId });
    if (!profile?.resumeUrl) {
      return NextResponse.json({ success: false, step: "file_validation", error: "No uploaded resume found. Please upload a resume first." }, { status: 404 });
    }

    const fileName  = profile.resumeName || "unknown";
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
        return NextResponse.json({ success: false, step: "cloudinary_download", error: dlErr.message }, { status: 500 });
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
      return NextResponse.json({ success: false, step: "mongodb_update", error: dbErr.message }, { status: 500 });
    }

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
    return NextResponse.json({ success: false, step: currentStep, error: err.message || "Unexpected error" }, { status: 500 });
  }
}
