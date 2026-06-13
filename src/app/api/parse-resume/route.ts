import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import { parsePdf, parseDocx } from "@/lib/parser";
import { extractSkillsWithGemini } from "@/lib/skills-extractor";
import { extractProfileDetails } from "@/lib/profile-extractor";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      console.warn("[Resume Parse] Missing userId in request body");
      return NextResponse.json(
        { success: false, error: "userId is required to parse resume" },
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
        { success: false, error: "Forbidden: You can only parse your own resume" },
        { status: 403 }
      );
    }

    console.log(`[Resume Parse] Received manual parsing request for userId: ${userId}`);

    const profile = await Profile.findOne({ userId });
    if (!profile || !profile.resumeUrl) {
      console.warn(`[Resume Parse] No profile or resumeUrl found in MongoDB for userId: ${userId}`);
      return NextResponse.json(
        { success: false, error: "No uploaded resume found for this user. Please upload a resume first." },
        { status: 404 }
      );
    }

    const fileName = profile.resumeName || "unknown_resume";
    const extension = fileName.split(".").pop()?.toLowerCase() || 
                      (profile.resumeUrl.toLowerCase().includes(".docx") ? "docx" : "pdf");

    console.log(`[Resume Parse] Target resume file: ${fileName}, Type: ${extension}`);

    let extractedText = profile.resumeText || "";
    
    if (!extractedText) {
      let buffer: Buffer;
      if (profile.resumeUrl.startsWith("/")) {
        const filePath = path.join(process.cwd(), "public", profile.resumeUrl);
        console.log(`[Resume Parse] Local file path resolved: ${filePath}`);
        if (!fs.existsSync(filePath)) {
          console.error(`[Resume Parse] Local resume file not found at path: ${filePath}`);
          return NextResponse.json(
            { success: false, error: "Resume file not found in local storage." },
            { status: 404 }
          );
        }
        buffer = fs.readFileSync(filePath);
        console.log(`[Resume Parse] Read local resume file buffer (${buffer.byteLength} bytes). Starting text extraction...`);
      } else {
        console.log(`[Resume Parse] resumeText not found in profile DB. Downloading from Cloudinary: ${profile.resumeUrl}`);
        // 1. Download Resume File
        const response = await fetch(profile.resumeUrl);
        if (!response.ok) {
          console.error(`[Resume Parse] Cloudinary download failed for URL: ${profile.resumeUrl}, Status: ${response.status}`);
          return NextResponse.json(
            { success: false, error: `Failed to download resume from Cloudinary storage (Status: ${response.status})` },
            { status: 500 }
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        console.log(`[Resume Parse] Downloaded resume buffer (${buffer.byteLength} bytes). Starting text extraction...`);
      }

      // 2. Extract Text
      if (extension === "pdf") {
        extractedText = await parsePdf(buffer);
      } else if (extension === "docx") {
        extractedText = await parseDocx(buffer);
      } else {
        console.warn(`[Resume Parse] Unsupported format encountered: ${extension}`);
        return NextResponse.json(
          { success: false, error: "Unsupported resume format in storage. PDF or DOCX only." },
          { status: 400 }
        );
      }
      
      // Cache the text to database for future fast parses
      profile.resumeText = extractedText;
      console.log(`[Resume Parse] Text extraction complete (${extractedText.length} chars). Cached in database.`);
    } else {
      console.log(`[Resume Parse] Using cached resumeText from Mongoose Profile (${extractedText.length} chars).`);
    }

    // 3. Parse Skills
    console.log("[Resume Parse] Running skills extraction using Gemini AI...");
    const { skillsSectionContent, skillsList: newSkills } = await extractSkillsWithGemini(extractedText);
    console.log(`[Resume Parse] Skills extraction complete. Extracted ${newSkills.length} skills.`);

    // 4. Extract contact details and career intelligence
    console.log("[Resume Parse] Extracting contact details and career intelligence using Gemini...");
    const details = await extractProfileDetails(extractedText);

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

    // 5. Overwrite or merge skills based on preferred mode
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

    // Update AI intelligence fields
    profile.extractedSkillsText = skillsSectionContent;
    profile.resumeCategory = details.resumeCategory || "";
    profile.resumeSummary = details.resumeSummary || "";
    profile.suggestedRoles = details.suggestedRoles || [];
    profile.resumeInsights = details.resumeInsights || { found: [], missing: [], tips: [] };

    await profile.save();
    console.log("[Resume Parse] MongoDB profile document successfully updated!");

    // 6. Trigger background scraper sync for the newly extracted skills
    const newSkillNames = newSkills.map((s: any) => s.name.toLowerCase());
    if (newSkillNames.length > 0) {
      console.log(`[Resume Parse] Triggering background scraper sync for new skills:`, newSkillNames);
      
      // Run sequentially in background to not block response
      Promise.resolve().then(async () => {
        const { runSourceSync } = require("@/lib/pipeline");
        const sources = ["linkedin", "indeed", "wellfound", "internshala"];
        
        for (const source of sources) {
          try {
            console.log(`[Resume Parse Background] Syncing ${source} for skills:`, newSkillNames);
            await runSourceSync(source, newSkillNames);
          } catch (err: any) {
            console.error(`[Resume Parse Background] Sync failed for ${source}:`, err.message);
          }
        }
        console.log("[Resume Parse Background] Sync complete.");
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        skillsExtractedCount: newSkills.length,
        skillsExtracted: newSkills,
        skills: profile.skills,
        extractedSkillsText: profile.extractedSkillsText
      }
    });
  } catch (error: any) {
    console.error("Resume parse API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to parse stored resume" },
      { status: 500 }
    );
  }
}
