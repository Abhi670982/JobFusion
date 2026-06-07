import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import { parsePdf, parseDocx } from "@/lib/parser";
import { extractSkills } from "@/lib/skills-extractor";
import { getOrCreateMongoUser } from "@/lib/auth-sync";

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
      const buffer = Buffer.from(arrayBuffer);
      console.log(`[Resume Parse] Downloaded resume buffer (${buffer.byteLength} bytes). Starting text extraction...`);

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
    console.log("[Resume Parse] Running skills extraction pattern matching...");
    const newSkills = extractSkills(extractedText);
    console.log(`[Resume Parse] Skills extraction complete. Extracted ${newSkills.length} skills.`);

    // 4. Merge skills with existing ones (avoiding duplicates)
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

    console.log(`[Resume Parse] Merged skills count: ${mergedSkills.length} (Previous count: ${existingSkills.length})`);

    // 5. Update Profile
    profile.skills = mergedSkills;
    await profile.save();
    console.log("[Resume Parse] MongoDB profile document successfully updated!");

    return NextResponse.json({
      success: true,
      data: {
        skillsExtractedCount: newSkills.length,
        skillsExtracted: newSkills,
        skills: profile.skills
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
