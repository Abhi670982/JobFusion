import { NextRequest, NextResponse, after } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";
import { parsePdf, parseDocx } from "@/lib/parser";
import { extractSkillsWithGemini } from "@/lib/skills-extractor";
import { extractProfileDetails } from "@/lib/profile-extractor";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { runSourceSync } from "@/lib/pipeline";
import { JobSource } from "@/lib/adapters/types";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";


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

    // 2. Upload/Save File (Try Cloudinary first, fallback to Local Storage)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let resumeUrl = "";

    try {
      console.log("[Resume Upload] Attempting Cloudinary upload...");
      const cloudinaryResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "raw",
              folder: "jobfusion-resumes",
              public_id: `${userId}_resume_${Date.now()}.${extension}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });
      resumeUrl = cloudinaryResult.secure_url;
      console.log(`[Resume Upload] Cloudinary upload successful. URL: ${resumeUrl}`);
    } catch (cldError: any) {
      console.warn("[Resume Upload] Cloudinary upload failed.", cldError);

      const isServerless = process.env.VERCEL || process.env.NEXT_RUNTIME === "edge" || process.env.NODE_ENV === "production";
      if (isServerless) {
        console.error("[Resume Upload] Cloudinary is not configured or failed to respond in a production/serverless environment. Local filesystem saving fallback is disabled to prevent crashes.");
        return NextResponse.json(
          { 
            success: false, 
            error: "Production file uploads require Cloudinary. Cloudinary upload failed and local storage fallback is disabled on serverless hosting. Please verify your environment variables." 
          },
          { status: 500 }
        );
      }
      
      console.warn("[Resume Upload] Falling back to local storage saving.");
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const safeFileName = `${userId}_resume_${Date.now()}.${extension}`;
      const filePath = path.join(uploadsDir, safeFileName);
      fs.writeFileSync(filePath, buffer);
      
      resumeUrl = `/uploads/${safeFileName}`;
      console.log(`[Resume Upload] Saved file locally. URL: ${resumeUrl}`);
    }

    // 3. Text Extraction & Skill Parsing
    console.log(`[Resume Upload] Starting text extraction parsing for ${extension}...`);
    let extractedText = "";
    if (extension === "pdf") {
      extractedText = await parsePdf(buffer);
    } else {
      extractedText = await parseDocx(buffer);
    }
    console.log(`[Resume Upload] Text extraction complete. Extracted text length: ${extractedText.length} characters.`);

    console.log("[Resume Upload] Starting skills extraction using Gemini AI...");
    const { skillsSectionContent, skillsList: newSkills } = await extractSkillsWithGemini(extractedText);
    console.log(`[Resume Upload] Skills extraction complete. Found ${newSkills.length} matching skills.`);

    // 4. Extract Contact Details
    console.log("[Resume Upload] Extracting contact details using Gemini/Regex...");
    const details = await extractProfileDetails(extractedText);
    console.log("[Resume Upload] Contact details extracted:", details);

    // Update profile contact fields if currently empty/default
    const isDefaultPhone = !profile.phone || profile.phone === "+91 98765 43210";
    if (details.phone && isDefaultPhone) {
      profile.phone = details.phone;
    }
    if (details.location && !profile.location) {
      profile.location = details.location;
    }
    if (details.portfolioUrl && !profile.portfolioUrl) {
      profile.portfolioUrl = details.portfolioUrl;
    }
    if (details.linkedinUrl && !profile.linkedinUrl) {
      profile.linkedinUrl = details.linkedinUrl;
    }
    if (details.githubUrl && !profile.githubUrl) {
      profile.githubUrl = details.githubUrl;
    }

    // 5. Update Profile
    console.log("[Resume Upload] Updating user profile document in MongoDB...");
    profile.resumeUrl = resumeUrl;
    profile.resumeName = fileName;
    profile.resumeUpdatedAt = new Date();
    profile.resumeText = extractedText;
    profile.extractedSkillsText = skillsSectionContent;
    
    // Overwrite or merge skills based on preferred mode
    if (profile.resumeSkillMode === "merge") {
      const existingSkillNames = new Set(profile.skills.map((s: any) => s.name.toLowerCase()));
      const mergedSkills = [...profile.skills];
      for (const skill of newSkills) {
        if (!existingSkillNames.has(skill.name.toLowerCase())) {
          mergedSkills.push(skill);
        }
      }
      profile.skills = mergedSkills;
    } else {
      profile.skills = newSkills;
    }

    // Save AI intelligence fields
    profile.resumeCategory = details.resumeCategory || "";
    profile.resumeSummary = details.resumeSummary || "";
    profile.suggestedRoles = details.suggestedRoles || [];
    profile.resumeInsights = details.resumeInsights || { found: [], missing: [], tips: [] };

    await profile.save();
    console.log("[Resume Upload] MongoDB Profile document updated successfully!");

    // 6. Trigger background scraper sync for the newly extracted skills
    const newSkillNames = newSkills.map((s: any) => s.name.toLowerCase());
    if (newSkillNames.length > 0) {
      console.log(`[Resume Upload] Triggering background scraper sync for new skills:`, newSkillNames);
      
      // Use Next.js 15+ after() API to run background tasks after the response has finished sending
      const sources: JobSource[] = ["linkedin", "indeed", "wellfound", "internshala"];
      after(async () => {
        for (const source of sources) {
          try {
            console.log(`[Resume Upload Background] Syncing ${source} for skills:`, newSkillNames);
            await runSourceSync(source, newSkillNames);
          } catch (err: any) {
            console.error(`[Resume Upload Background] Sync failed for ${source}:`, err.message);
          }
        }
        console.log("[Resume Upload Background] Sync complete.");
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        resumeUrl,
        resumeName: fileName,
        resumeUpdatedAt: profile.resumeUpdatedAt,
        skillsExtracted: newSkills.length,
        skills: profile.skills,
        phone: profile.phone,
        location: profile.location,
        portfolioUrl: profile.portfolioUrl,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl
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