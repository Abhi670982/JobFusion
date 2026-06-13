import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import Profile from "@/models/Profile";
import { extractProfileDetails } from "@/lib/profile-extractor";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    if (userId !== mongoUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only extract details from your own profile" },
        { status: 403 }
      );
    }

    const profile = await Profile.findOne({ userId: mongoUser._id });
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    if (!profile.resumeUrl) {
      return NextResponse.json(
        { success: false, error: "No uploaded resume found for this user. Please upload a resume first." },
        { status: 400 }
      );
    }

    let extractedText = profile.resumeText || "";
    
    // Fallback: If resumeText is not cached in db but resumeUrl exists, we should try to extract it first.
    if (!extractedText && profile.resumeUrl) {
      console.log(`[Extract Details] resumeText is empty. We need to parse first.`);
      // We can call the internal parse route or read/download the file. Let's do a fast file read or download.
      const extension = profile.resumeName?.split(".").pop()?.toLowerCase() || 
                        (profile.resumeUrl.toLowerCase().includes(".docx") ? "docx" : "pdf");
      const { parsePdf, parseDocx } = await import("@/lib/parser");
      const fs = await import("fs");
      const path = await import("path");

      let buffer: Buffer;
      if (profile.resumeUrl.startsWith("/")) {
        const filePath = path.join(process.cwd(), "public", profile.resumeUrl);
        if (fs.existsSync(filePath)) {
          buffer = fs.readFileSync(filePath);
        } else {
          return NextResponse.json({ success: false, error: "Local resume file not found." }, { status: 404 });
        }
      } else {
        const response = await fetch(profile.resumeUrl);
        if (!response.ok) {
          return NextResponse.json({ success: false, error: "Failed to download resume file from Cloudinary." }, { status: 500 });
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }

      if (extension === "pdf") {
        extractedText = await parsePdf(buffer);
      } else if (extension === "docx") {
        extractedText = await parseDocx(buffer);
      }
      
      if (extractedText) {
        profile.resumeText = extractedText;
        await profile.save();
      }
    }

    if (!extractedText) {
      return NextResponse.json(
        { success: false, error: "Could not extract text from the resume file." },
        { status: 400 }
      );
    }

    console.log(`[Extract Details] Extracting details for user: ${userId}`);
    const details = await extractProfileDetails(extractedText);
    console.log(`[Extract Details] Extraction result:`, details);

    // Save details if currently empty or set to placeholder/default
    let updated = false;

    // Treat +91 98765 43210 as default/empty
    const isDefaultPhone = !profile.phone || profile.phone === "+91 98765 43210";
    if (details.phone && isDefaultPhone) {
      profile.phone = details.phone;
      updated = true;
    }

    if (details.location && !profile.location) {
      profile.location = details.location;
      updated = true;
    }

    if (details.portfolioUrl && !profile.portfolioUrl) {
      profile.portfolioUrl = details.portfolioUrl;
      updated = true;
    }

    if (details.linkedinUrl && !profile.linkedinUrl) {
      profile.linkedinUrl = details.linkedinUrl;
      updated = true;
    }

    if (details.githubUrl && !profile.githubUrl) {
      profile.githubUrl = details.githubUrl;
      updated = true;
    }

    if (updated) {
      await profile.save();
      console.log(`[Extract Details] Updated profile document with extracted fields.`);
    }

    return NextResponse.json({
      success: true,
      data: {
        phone: profile.phone,
        location: profile.location,
        portfolioUrl: profile.portfolioUrl,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        extracted: details
      }
    });
  } catch (error: any) {
    console.error("Error in POST /api/profile/extract-details:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to extract details from resume" },
      { status: 500 }
    );
  }
}
