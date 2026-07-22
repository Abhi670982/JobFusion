import { NextRequest, NextResponse } from "next/server";
import { extractProfileDetails } from "@/lib/profile-extractor";
import { prisma } from "@/lib/prisma";
import { withAIProviderCheck, validateUserAccess } from "@/lib/middleware/ai-usage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Check AI usage limits and resolve AI provider for profile-extraction feature
    const aiCheck = await withAIProviderCheck(req, 'profile-extraction');
    if (!aiCheck.allowed || !aiCheck.config) {
      return aiCheck.response || NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }
    const aiConfig = aiCheck.config;

    // Validate user access
    const accessCheck = await validateUserAccess(req);
    if (!accessCheck.allowed) {
      return accessCheck.response;
    }

    const userId = accessCheck.userId;

    // Fetch profile from Postgres
    const pgProfile = await prisma.profile.findUnique({
      where: { userId: userId || "" }
    });

    if (!pgProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    if (!pgProfile.resumeUrl) {
      return NextResponse.json(
        { success: false, error: "No uploaded resume found for this user. Please upload a resume first." },
        { status: 400 }
      );
    }

    let extractedText = pgProfile.resumeText || "";
    
    // Fallback: If resumeText is empty but resumeUrl exists, we should try to extract it first.
    if (!extractedText && pgProfile.resumeUrl) {
      console.log(`[Extract Details] resumeText is empty. We need to parse first.`);
      const extension = pgProfile.resumeName?.split(".").pop()?.toLowerCase() || 
                        (pgProfile.resumeUrl.toLowerCase().includes(".docx") ? "docx" : "pdf");
      const { parsePdf, parseDocx } = await import("@/lib/parser");
      const fs = await import("fs");
      const path = await import("path");

      let buffer: Buffer;
      if (pgProfile.resumeUrl.startsWith("/")) {
        const filePath = path.join(process.cwd(), "public", pgProfile.resumeUrl);
        if (fs.existsSync(filePath)) {
          buffer = fs.readFileSync(filePath);
        } else {
          return NextResponse.json({ success: false, error: "Local resume file not found." }, { status: 404 });
        }
      } else {
        const response = await fetch(pgProfile.resumeUrl);
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
        // Save to PostgreSQL
        await prisma.profile.update({
          where: { id: pgProfile.id },
          data: { resumeText: extractedText }
        });
      }
    }

    if (!extractedText) {
      return NextResponse.json(
        { success: false, error: "Could not extract text from the resume file." },
        { status: 400 }
      );
    }

    console.log(`[Extract Details] Extracting details for user: ${userId}`);
    const details = await extractProfileDetails(extractedText, aiConfig);
    console.log(`[Extract Details] Extraction result:`, details);

    // Save details if currently empty or set to placeholder/default
    const updateFields: any = {};

    // Treat +91 98765 43210 as default/empty
    const isDefaultPhone = !pgProfile.phone || pgProfile.phone === "+91 98765 43210";
    if (details.phone && isDefaultPhone) {
      updateFields.phone = details.phone;
    }

    if (details.location && !pgProfile.location) {
      updateFields.location = details.location;
    }

    if (details.portfolioUrl && !pgProfile.portfolioUrl) {
      updateFields.portfolioUrl = details.portfolioUrl;
    }

    if (details.linkedinUrl && !pgProfile.linkedinUrl) {
      updateFields.linkedinUrl = details.linkedinUrl;
    }

    if (details.githubUrl && !pgProfile.githubUrl) {
      updateFields.githubUrl = details.githubUrl;
    }

    if (Object.keys(updateFields).length > 0) {
      // Save to PostgreSQL
      await prisma.profile.update({
        where: { id: pgProfile.id },
        data: updateFields
      });
      
      console.log(`[Extract Details] Updated profile document with extracted fields.`);
    }

    const currentPhone = updateFields.phone || pgProfile.phone;
    const currentLocation = updateFields.location || pgProfile.location;
    const currentPortfolio = updateFields.portfolioUrl || pgProfile.portfolioUrl;
    const currentLinkedin = updateFields.linkedinUrl || pgProfile.linkedinUrl;
    const currentGithub = updateFields.githubUrl || pgProfile.githubUrl;

    return NextResponse.json({
      success: true,
      data: {
        phone: currentPhone,
        location: currentLocation,
        portfolioUrl: currentPortfolio,
        linkedinUrl: currentLinkedin,
        githubUrl: currentGithub,
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
