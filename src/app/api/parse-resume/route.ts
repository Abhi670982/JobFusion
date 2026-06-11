import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import { parsePdf, parseDocx } from "@/lib/parser";
import { extractSkills } from "@/lib/skills-extractor";
import { getOrCreateMongoUser } from "@/lib/auth-sync";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let currentStep = "file_validation";
  try {
    console.log("[Resume Parse Step] Request received");

    try {
      await connectDB();
    } catch (dbErr: any) {
      console.error("[Resume Parse] DB connection error:", dbErr);
      return NextResponse.json(
        { success: false, step: "mongodb_connection", error: dbErr.message || "Database connection failed" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      console.warn("[Resume Parse] Missing userId in request body");
      return NextResponse.json(
        { success: false, step: "file_validation", error: "userId is required to parse resume" },
        { status: 400 }
      );
    }

    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, step: "authentication", error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (userId !== mongoUser._id.toString()) {
      return NextResponse.json(
        { success: false, step: "authorization", error: "Forbidden: You can only parse your own resume" },
        { status: 403 }
      );
    }

    const profile = await Profile.findOne({ userId });
    if (!profile || !profile.resumeUrl) {
      console.warn(`[Resume Parse] No profile or resumeUrl found in MongoDB for userId: ${userId}`);
      return NextResponse.json(
        { success: false, step: "file_validation", error: "No uploaded resume found for this user. Please upload a resume first." },
        { status: 404 }
      );
    }

    const fileName = profile.resumeName || "unknown_resume";
    const extension = fileName.split(".").pop()?.toLowerCase() || 
                      (profile.resumeUrl.toLowerCase().includes(".docx") ? "docx" : "pdf");

    console.log(`[Resume Parse] Target resume file: ${fileName}, Type: ${extension}`);
    console.log("[Resume Parse Step] File verification passed");

    let extractedText = profile.resumeText || "";
    
    if (!extractedText) {
      currentStep = "cloudinary_download";
      console.log("[Resume Parse Step] Download started");
      let buffer: Buffer;
      try {
        const response = await fetch(profile.resumeUrl);
        if (!response.ok) {
          throw new Error(`Failed to download resume from Cloudinary storage (Status: ${response.status})`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } catch (dlErr: any) {
        console.error("[Resume Parse] Download failed:", dlErr);
        return NextResponse.json(
          { success: false, step: "cloudinary_download", error: dlErr.message || "Failed to download resume from storage provider" },
          { status: 500 }
        );
      }
      console.log("[Resume Parse Step] Download success");

      currentStep = "parser";
      console.log("[Resume Parse Step] Parser started");
      try {
        if (extension === "pdf") {
          extractedText = await parsePdf(buffer);
        } else if (extension === "docx") {
          extractedText = await parseDocx(buffer);
        } else {
          throw new Error("Unsupported resume format in storage. PDF or DOCX only.");
        }
        profile.resumeText = extractedText;
      } catch (parseErr: any) {
        console.error("[Resume Parse] Parser failed:", parseErr);
        return NextResponse.json(
          { success: false, step: "parser", error: parseErr.message || "Failed to extract text from resume document" },
          { status: 500 }
        );
      }
      console.log("[Resume Parse Step] Parser success");
    } else {
      console.log("[Resume Parse] Using cached resumeText from Mongoose Profile");
      console.log("[Resume Parse Step] Download skipped (using cached text)");
      console.log("[Resume Parse Step] Parser skipped (using cached text)");
    }

    currentStep = "skills_extraction";
    console.log("[Resume Parse Step] Skills extraction started");
    let newSkills: { name: string; level: number }[] = [];
    try {
      newSkills = extractSkills(extractedText);
    } catch (skillsErr: any) {
      console.error("[Resume Parse] Skills extraction failed:", skillsErr);
      return NextResponse.json(
        { success: false, step: "skills_extraction", error: skillsErr.message || "Failed to parse skills from resume text" },
        { status: 500 }
      );
    }
    console.log("[Resume Parse Step] Skills extraction success");

    currentStep = "mongodb_update";
    console.log("[Resume Parse Step] MongoDB update started");
    try {
      const skillMode = profile.resumeSkillMode || "merge";
      let finalSkills = [];

      if (skillMode === "replace") {
        console.log("[Resume Parse] Overwriting skills (replace mode)");
        finalSkills = newSkills;
      } else {
        console.log("[Resume Parse] Merging skills (merge mode)");
        const existingSkills = profile.skills || [];
        finalSkills = [...existingSkills];

        for (const newSkill of newSkills) {
          const exists = finalSkills.some(
            (s: any) => s.name.toLowerCase() === newSkill.name.toLowerCase()
          );
          if (!exists) {
            finalSkills.push(newSkill);
          }
        }
      }

      profile.skills = finalSkills;
      
      // Save profile. Calling save() will trigger Mongoose pre-save hooks (and calculate dynamic ATS score)
      await profile.save();
    } catch (dbUpdateErr: any) {
      console.error("[Resume Parse] MongoDB update failed:", dbUpdateErr);
      return NextResponse.json(
        { success: false, step: "mongodb_update", error: dbUpdateErr.message || "Failed to update profile document in MongoDB" },
        { status: 500 }
      );
    }
    console.log("[Resume Parse Step] MongoDB update success");

    return NextResponse.json({
      success: true,
      data: {
        skillsExtractedCount: newSkills.length,
        skillsExtracted: newSkills,
        skills: profile.skills,
        atsScore: profile.atsScore,
        atsDetails: profile.atsDetails,
        lastAnalyzedAt: profile.lastAnalyzedAt,
        atsHistory: profile.atsHistory,
      }
    });
  } catch (err: any) {
    console.error("[Resume Parse] Unhandled error:", err);
    return NextResponse.json(
      { success: false, step: currentStep, error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
