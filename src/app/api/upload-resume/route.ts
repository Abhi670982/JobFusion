import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { parsePdf, parseDocx } from "@/lib/parser";
import { extractSkillsWithAI } from "@/lib/skills-extractor";
import { analyzeResume } from "@/lib/resume-intelligence";
import { extractProfileDetails } from "@/lib/profile-extractor";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const userId = mongoUser.id;

    // Rate limit: 10 uploads per 15 minutes per user
    const rateLimitError = checkRateLimit(req, { limit: 10, windowMs: 15 * 60 * 1000, identifier: userId });
    if (rateLimitError) return rateLimitError;

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ success: false, step: "file_validation", error: "No file uploaded" }, { status: 400 });

    let pgProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { skills: true }
    });

    if (!pgProfile) {
      pgProfile = await prisma.profile.create({
        data: {
          user: { connect: { id: userId } },
          resumeText: "",
          resumeSkillMode: "merge",
          resumeCategory: "",
          resumeSummary: "",
        },
        include: { skills: true }
      });
    }

    const fileName = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "docx"].includes(extension)) {
      return NextResponse.json({ success: false, step: "file_validation", error: "Only PDF and DOCX files are allowed." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let cloudinaryResult: any;
    try {
      cloudinaryResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { resource_type: "raw", folder: "jobfusion-resumes", public_id: `${userId}_resume_${Date.now()}.${extension}` },
            (error, result) => { if (error) reject(error); else resolve(result); }
          )
          .end(buffer);
      });
    } catch (cloudErr: any) {
      console.error("[Resume Upload] Cloudinary error:", cloudErr);
      return NextResponse.json({ success: false, step: "cloudinary_upload", error: "Cloudinary upload failed" }, { status: 500 });
    }
    const resumeUrl = cloudinaryResult.secure_url;

    let extractedText = "";
    try {
      extractedText = extension === "pdf" ? await parsePdf(buffer) : await parseDocx(buffer);
    } catch (parseErr: any) {
      console.error("[Resume Upload] Parser error:", parseErr);
      return NextResponse.json({ success: false, step: "parser", error: "Failed to extract text from resume" }, { status: 500 });
    }

    let newSkills: { name: string; level: number }[] = [];
    try {
      newSkills = await extractSkillsWithAI(extractedText);
    } catch (skillsErr: any) {
      console.error("[Resume Upload] Skills error:", skillsErr);
      newSkills = [];
    }

    let intelligence;
    try {
      intelligence = analyzeResume(extractedText, newSkills.map(s => s.name));
    } catch (intErr: any) {
      console.error("[Resume Upload] Intelligence error:", intErr);
      intelligence = {
        category: "General Professional",
        suggestedRoles: [],
        resumeSummary: "",
        insights: { found: [], missing: [], tips: [] },
      };
    }

    const skillMode = pgProfile.resumeSkillMode || "merge";
    
    if (skillMode === "replace") {
      await prisma.profileSkill.deleteMany({ where: { profileId: pgProfile.id } });
      if (newSkills.length > 0) {
        await prisma.profileSkill.createMany({
          data: newSkills.map(s => ({
            profileId: pgProfile.id,
            name: s.name,
            level: s.level ?? 80
          }))
        });
      }
    } else {
      const newUniqueSkills = newSkills.filter(
        ns => !pgProfile!.skills.some(es => es.name.toLowerCase() === ns.name.toLowerCase())
      );
      if (newUniqueSkills.length > 0) {
        await prisma.profileSkill.createMany({
          data: newUniqueSkills.map(s => ({
            profileId: pgProfile.id,
            name: s.name,
            level: s.level ?? 80
          }))
        });
      }
    }

    const profileUpdate: any = {
      resumeUrl,
      resumeName: fileName,
      resumeUpdatedAt: new Date(),
      resumeText: extractedText,
      lastAnalyzedAt: new Date(),
      resumeCategory: intelligence.category,
      resumeSummary: intelligence.resumeSummary,
      suggestedRoles: intelligence.suggestedRoles,
      insightsFound: intelligence.insights.found,
      insightsMissing: intelligence.insights.missing,
      insightsTips: intelligence.insights.tips
    };

    try {
      const details = await extractProfileDetails(extractedText);
      if (details.bio) profileUpdate.bio = details.bio;
      if (details.phone && (!pgProfile.phone || pgProfile.phone === "+91 98765 43210")) {
        profileUpdate.phone = details.phone;
      }
      if (details.location && !pgProfile.location) profileUpdate.location = details.location;
      if (details.portfolioUrl && !pgProfile.portfolioUrl) profileUpdate.portfolioUrl = details.portfolioUrl;
      if (details.linkedinUrl && !pgProfile.linkedinUrl) profileUpdate.linkedinUrl = details.linkedinUrl;
      if (details.githubUrl && !pgProfile.githubUrl) profileUpdate.githubUrl = details.githubUrl;

      await prisma.profile.update({
        where: { id: pgProfile.id },
        data: profileUpdate
      });

      if (details.experiences && details.experiences.length > 0) {
        await prisma.workExperience.deleteMany({ where: { profileId: pgProfile.id } });
        await prisma.workExperience.createMany({
          data: details.experiences.map((exp: any) => ({
            profileId: pgProfile.id,
            company: exp.company || "",
            role: exp.role || "",
            period: exp.period || "",
            duration: exp.duration || "",
            description: exp.description || "",
            skills: exp.skills || [],
            companyColor: "#6366f1",
            logo: (exp.company || "C").charAt(0).toUpperCase()
          }))
        });
      }

      if (details.education && details.education.length > 0) {
        await prisma.education.deleteMany({ where: { profileId: pgProfile.id } });
        await prisma.education.createMany({
          data: details.education.map((edu: any) => ({
            profileId: pgProfile.id,
            school: edu.school || "",
            degree: edu.degree || "",
            period: edu.period || "",
            logo: (edu.school || "S").charAt(0).toUpperCase(),
            color: "#003580"
          }))
        });
      }

      if (details.projects && details.projects.length > 0) {
        await prisma.project.deleteMany({ where: { profileId: pgProfile.id } });
        await prisma.project.createMany({
          data: details.projects.map((proj: any) => ({
            profileId: pgProfile.id,
            name: proj.name || "",
            description: proj.description || "",
            tech: proj.tech || [],
            link: "#",
            stars: "0"
          }))
        });
      }
    } catch (extractErr) {
      console.error("[Resume Upload] Non-fatal: Failed to extract detailed profile sections:", extractErr);
      await prisma.profile.update({
        where: { id: pgProfile.id },
        data: profileUpdate
      });
    }

    const updatedPgProfile = await prisma.profile.findUnique({
      where: { id: pgProfile.id },
      include: { skills: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        resumeUrl,
        resumeName: fileName,
        resumeUpdatedAt: updatedPgProfile!.resumeUpdatedAt,
        skillsExtracted: newSkills.length,
        extractedSkills: newSkills,
        skills: updatedPgProfile!.skills.map(s => ({ _id: s.id, name: s.name, level: s.level })),
        resumeCategory: updatedPgProfile!.resumeCategory,
        resumeSummary: updatedPgProfile!.resumeSummary,
        suggestedRoles: updatedPgProfile!.suggestedRoles,
        resumeInsights: {
          found: updatedPgProfile!.insightsFound,
          missing: updatedPgProfile!.insightsMissing,
          tips: updatedPgProfile!.insightsTips
        },
        lastAnalyzedAt: updatedPgProfile!.lastAnalyzedAt,
      },
    });
  } catch (err: unknown) {
    return safeErrorResponse(err, "Failed to process resume upload");
  }
}