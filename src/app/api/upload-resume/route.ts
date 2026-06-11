import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";
import { parsePdf, parseDocx } from "@/lib/parser";
import { extractSkills } from "@/lib/skills-extractor";
import { getOrCreateMongoUser } from "@/lib/auth-sync";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let currentStep = "file_validation";
  try {
    console.log("[Resume Upload Step] Upload request received");

    // 1. Database Connection and Authentication
    try {
      await connectDB();
    } catch (dbErr: any) {
      console.error("[Resume Upload] DB connection error:", dbErr);
      return NextResponse.json(
        { success: false, step: "mongodb_connection", error: dbErr.message || "Database connection failed" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      console.warn("[Resume Upload] File missing in request body");
      return NextResponse.json(
        { success: false, step: "file_validation", error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!userId) {
      console.warn("[Resume Upload] userId missing in request body");
      return NextResponse.json(
        { success: false, step: "file_validation", error: "userId is required to associate resume" },
        { status: 400 }
      );
    }

    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      console.warn("[Resume Upload] Unauthorized access attempt");
      return NextResponse.json(
        { success: false, step: "authentication", error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (userId !== mongoUser._id.toString()) {
      console.warn(`[Resume Upload] Forbidden: UserId mismatch (Request: ${userId}, Session: ${mongoUser._id})`);
      return NextResponse.json(
        { success: false, step: "authorization", error: "Forbidden: You can only upload your own resume" },
        { status: 403 }
      );
    }

    // Verify user profile exists or create it
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      const userExists = await User.findById(userId);
      if (!userExists) {
        console.error(`[Resume Upload] User record not found in DB: ${userId}`);
        return NextResponse.json(
          { success: false, step: "file_validation", error: "User not found in database" },
          { status: 404 }
        );
      }
      profile = await Profile.create({
        userId,
        skills: [],
        experiences: [],
        education: [],
        certifications: [],
        projects: [],
      });
    }

    const fileName = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase();
    const mimeType = file.type;
    const fileSize = file.size;

    const allowedExtensions = ["pdf", "docx"];
    if (!extension || !allowedExtensions.includes(extension)) {
      console.warn(`[Resume Upload] Blocked upload for invalid extension: ${extension}`);
      return NextResponse.json(
        { success: false, step: "file_validation", error: "Only PDF and DOCX files are allowed." },
        { status: 400 }
      );
    }

    console.log(`[Resume Upload] Received file: ${fileName} (${fileSize} bytes), Type: ${mimeType}, Extension: ${extension}`);
    console.log("[Resume Upload Step] File validation passed");

    // 2. Cloudinary Upload
    currentStep = "cloudinary_upload";
    console.log("[Resume Upload Step] Cloudinary upload started");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let cloudinaryResult: any;
    try {
      cloudinaryResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "raw",
              folder: "jobfusion-resumes",
              public_id: `${userId}_resume_${Date.now()}.${extension}`,
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          )
          .end(buffer);
      });
    } catch (cloudErr: any) {
      console.error("[Resume Upload] Cloudinary SDK error:", cloudErr);
      return NextResponse.json(
        { success: false, step: "cloudinary_upload", error: cloudErr.message || "Failed to upload to Cloudinary storage" },
        { status: 500 }
      );
    }

    const resumeUrl = cloudinaryResult.secure_url;
    console.log(`[Resume Upload] Cloudinary URL: ${resumeUrl}`);
    console.log("[Resume Upload Step] Cloudinary upload success");

    // 3. Text Extraction
    currentStep = "parser";
    console.log("[Resume Upload Step] Parser started");
    let extractedText = "";
    try {
      if (extension === "pdf") {
        extractedText = await parsePdf(buffer);
      } else {
        extractedText = await parseDocx(buffer);
      }
    } catch (parseErr: any) {
      console.error("[Resume Upload] Parser failed:", parseErr);
      return NextResponse.json(
        { success: false, step: "parser", error: parseErr.message || "Failed to extract text from resume document" },
        { status: 500 }
      );
    }
    console.log(`[Resume Upload] Extracted text length: ${extractedText.length} characters`);
    console.log("[Resume Upload Step] Parser success");

    // 4. Skills Extraction
    currentStep = "skills_extraction";
    console.log("[Resume Upload Step] Skills extraction started");
    let newSkills: { name: string; level: number }[] = [];
    try {
      newSkills = extractSkills(extractedText);
    } catch (skillsErr: any) {
      console.error("[Resume Upload] Skills extraction failed:", skillsErr);
      return NextResponse.json(
        { success: false, step: "skills_extraction", error: skillsErr.message || "Failed to parse skills from resume text" },
        { status: 500 }
      );
    }
    console.log(`[Resume Upload] Skills extracted: ${newSkills.length} matches`);
    console.log("[Resume Upload Step] Skills extraction success");

    // 5. MongoDB Update
    currentStep = "mongodb_update";
    console.log("[Resume Upload Step] MongoDB update started");
    try {
      // Determine skills resolution mode (replace or merge)
      const skillMode = profile.resumeSkillMode || "merge";
      let finalSkills = [];

      if (skillMode === "replace") {
        console.log("[Resume Upload] Overwriting old skills with extracted ones (replace mode)");
        finalSkills = newSkills;
      } else {
        console.log("[Resume Upload] Merging extracted skills into profile (merge mode)");
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

      // Populate metadata and trigger hook recalculations
      profile.resumeUrl = resumeUrl;
      profile.resumeName = fileName;
      profile.resumeUpdatedAt = new Date();
      profile.resumeText = extractedText;
      profile.skills = finalSkills;

      // Note: Calling profile.save() triggers our pre-save hook,
      // which automatically recalculates the ATS score, adds it to the
      // history, updates weaknesses/strengths/missing sections, and updates lastAnalyzedAt!
      await profile.save();
    } catch (dbUpdateErr: any) {
      console.error("[Resume Upload] MongoDB save error:", dbUpdateErr);
      return NextResponse.json(
        { success: false, step: "mongodb_update", error: dbUpdateErr.message || "Failed to update profile document in MongoDB" },
        { status: 500 }
      );
    }
    console.log("[Resume Upload Step] MongoDB update success");

    return NextResponse.json({
      success: true,
      data: {
        resumeUrl,
        resumeName: fileName,
        resumeUpdatedAt: profile.resumeUpdatedAt,
        skillsExtracted: newSkills.length,
        skills: profile.skills,
        atsScore: profile.atsScore,
        atsDetails: profile.atsDetails,
        lastAnalyzedAt: profile.lastAnalyzedAt,
        atsHistory: profile.atsHistory,
      }
    });
  } catch (err: any) {
    console.error("[Resume Upload] Unhandled error:", err);
    return NextResponse.json(
      { success: false, step: currentStep, error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}