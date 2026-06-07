import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";
import { parsePdf, parseDocx } from "@/lib/parser";
import { extractSkills } from "@/lib/skills-extractor";
import { getOrCreateMongoUser } from "@/lib/auth-sync";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    // 1. Validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required to associate resume" },
        { status: 400 }
      );
    }

    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (userId !== mongoUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only upload your own resume" },
        { status: 403 }
      );
    }

    // Verify user profile exists
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      // Create empty profile if it doesn't exist
      const userExists = await User.findById(userId);
      if (!userExists) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }
      profile = await Profile.create({
        userId,
        skills: [],
        experiences: [],
        education: [],
        certifications: [],
        projects: []
      });
    }

    const fileName = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase();
    const mimeType = file.type;
    const fileSize = file.size;

    console.log(`[Resume Upload] Received file: ${fileName} (${fileSize} bytes), Type: ${mimeType}, Extension: ${extension}`);

    const allowedExtensions = ["pdf", "docx"];
    const allowedMimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!extension || !allowedExtensions.includes(extension)) {
      console.warn(`[Resume Upload] Blocked upload for invalid extension: ${extension}`);
      return NextResponse.json(
        { success: false, error: "Only PDF and DOCX files are allowed." },
        { status: 400 }
      );
    }

    // 2. Cloudinary Upload
    console.log("[Resume Upload] Starting Cloudinary streaming upload...");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cloudinaryResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "raw",
            folder: "jobfusion-resumes",
            public_id: `${userId}_resume_${Date.now()}.${extension}`,
          },
          (error, result) => {
            if (error) {
              console.error("[Resume Upload] Cloudinary upload error:", error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    const resumeUrl = cloudinaryResult.secure_url;
    console.log(`[Resume Upload] Cloudinary upload successful. URL: ${resumeUrl}`);

    // 3. Text Extraction & Skill Parsing
    console.log(`[Resume Upload] Starting text extraction parsing for ${extension}...`);
    let extractedText = "";
    if (extension === "pdf") {
      extractedText = await parsePdf(buffer);
    } else {
      extractedText = await parseDocx(buffer);
    }
    console.log(`[Resume Upload] Text extraction complete. Extracted text length: ${extractedText.length} characters.`);

    console.log("[Resume Upload] Starting skills extraction pattern matching...");
    const newSkills = extractSkills(extractedText);
    console.log(`[Resume Upload] Skills extraction complete. Found ${newSkills.length} matching skills.`);

    // Merge skills with existing ones (avoiding duplicates, matching case-insensitively)
    const existingSkills = profile.skills || [];
    const mergedSkills = [...existingSkills];

    for (const newSkill of newSkills) {
      const exists = mergedSkills.some(
        (s: any) => s.name.toLowerCase() === newSkill.name.toLowerCase()
      );
      if (!exists) {
        mergedSkills.push(newSkill);
      }
    }

    // 4. Update Profile
    console.log("[Resume Upload] Updating user profile document in MongoDB...");
    profile.resumeUrl = resumeUrl;
    profile.resumeName = fileName;
    profile.resumeUpdatedAt = new Date();
    profile.resumeText = extractedText;
    profile.skills = mergedSkills;
    await profile.save();
    console.log("[Resume Upload] MongoDB Profile document updated successfully!");

    return NextResponse.json({
      success: true,
      data: {
        resumeUrl,
        resumeName: fileName,
        resumeUpdatedAt: profile.resumeUpdatedAt,
        skillsExtracted: newSkills.length,
        skills: profile.skills
      }
    });
  } catch (error: any) {
    console.error("Resume upload/parse error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process resume upload",
      },
      {
        status: 500,
      }
    );
  }
}