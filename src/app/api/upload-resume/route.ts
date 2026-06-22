import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Profile from "@/models/Profile";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";
import { parsePdf, parseDocx } from "@/lib/parser";
import { extractSkills } from "@/lib/skills-extractor";
import { analyzeResume } from "@/lib/resume-intelligence";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { extractProfileDetails } from "@/lib/profile-extractor";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let currentStep = "file_validation";
  try {
    console.log("[Resume Upload] Request received");

    // ── 1. DB Connection ────────────────────────────────────────
    try {
      await connectDB();
    } catch (dbErr: any) {
      console.error("[Resume Upload] DB connection error:", dbErr);
      return NextResponse.json(
        { success: false, step: "mongodb_connection", error: dbErr.message || "Database connection failed" },
        { status: 500 }
      );
    }

    // ── 2. Parse form data ──────────────────────────────────────
    const formData = await req.formData();
    const file     = formData.get("file") as File;
    const userId   = formData.get("userId") as string;

    if (!file)   return NextResponse.json({ success: false, step: "file_validation", error: "No file uploaded" }, { status: 400 });
    if (!userId) return NextResponse.json({ success: false, step: "file_validation", error: "userId is required" }, { status: 400 });

    // ── 3. Auth ─────────────────────────────────────────────────
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) return NextResponse.json({ success: false, step: "authentication", error: "Unauthorized" }, { status: 401 });
    if (userId !== mongoUser._id.toString()) return NextResponse.json({ success: false, step: "authorization", error: "Forbidden" }, { status: 403 });

    // ── 4. Find / create profile ────────────────────────────────
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      const userExists = await User.findById(userId);
      if (!userExists) return NextResponse.json({ success: false, step: "file_validation", error: "User not found" }, { status: 404 });
      profile = await Profile.create({ userId, skills: [], experiences: [], education: [], certifications: [], projects: [] });
    }

    // ── 5. Validate file ────────────────────────────────────────
    const fileName  = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "docx"].includes(extension)) {
      return NextResponse.json({ success: false, step: "file_validation", error: "Only PDF and DOCX files are allowed." }, { status: 400 });
    }
    console.log(`[Resume Upload] File: ${fileName} (${file.size} bytes)`);

    // ── 6. Cloudinary Upload ────────────────────────────────────
    currentStep = "cloudinary_upload";
    console.log("[Resume Upload Step] Cloudinary upload started");
    const bytes  = await file.arrayBuffer();
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
      return NextResponse.json({ success: false, step: "cloudinary_upload", error: cloudErr.message || "Cloudinary upload failed" }, { status: 500 });
    }
    const resumeUrl = cloudinaryResult.secure_url;
    console.log("[Resume Upload Step] Cloudinary upload success:", resumeUrl);

    // ── 7. Text Extraction ──────────────────────────────────────
    currentStep = "parser";
    console.log("[Resume Upload Step] Text extraction started");
    let extractedText = "";
    try {
      extractedText = extension === "pdf" ? await parsePdf(buffer) : await parseDocx(buffer);
    } catch (parseErr: any) {
      console.error("[Resume Upload] Parser error:", parseErr);
      return NextResponse.json({ success: false, step: "parser", error: parseErr.message || "Failed to extract text from resume" }, { status: 500 });
    }
    console.log(`[Resume Upload Step] Extracted ${extractedText.length} characters`);

    // ── 8. Skill Extraction ─────────────────────────────────────
    currentStep = "skills_extraction";
    console.log("[Resume Upload Step] Skills extraction started");
    let newSkills: { name: string; level: number }[] = [];
    try {
      newSkills = extractSkills(extractedText);
    } catch (skillsErr: any) {
      console.error("[Resume Upload] Skills error:", skillsErr);
      return NextResponse.json({ success: false, step: "skills_extraction", error: skillsErr.message || "Skills extraction failed" }, { status: 500 });
    }
    console.log(`[Resume Upload Step] ${newSkills.length} skills extracted`);

    // ── 9. Resume Intelligence Analysis ────────────────────────
    currentStep = "intelligence";
    console.log("[Resume Upload Step] Resume intelligence analysis started");
    let intelligence;
    try {
      intelligence = analyzeResume(extractedText, newSkills.map(s => s.name));
    } catch (intErr: any) {
      console.error("[Resume Upload] Intelligence error:", intErr);
      // Non-fatal — continue with defaults
      intelligence = {
        category: "General Professional",
        suggestedRoles: [],
        resumeSummary: "",
        insights: { found: [], missing: [], tips: [] },
      };
    }
    console.log(`[Resume Upload Step] Category: ${intelligence.category}, Roles: ${intelligence.suggestedRoles.join(", ")}`);

    // ── 10. MongoDB Update ──────────────────────────────────────
    currentStep = "mongodb_update";
    console.log("[Resume Upload Step] MongoDB update started");
    try {
      const skillMode = profile.resumeSkillMode || "merge";
      let finalSkills: { name: string; level: number }[] = [];

      if (skillMode === "replace") {
        console.log("[Resume Upload] Replace mode: overwriting skills");
        finalSkills = newSkills;
      } else {
        console.log("[Resume Upload] Merge mode: merging skills");
        const existingSkills = profile.skills || [];
        finalSkills = [...existingSkills];
        for (const s of newSkills) {
          if (!finalSkills.some((e: any) => e.name.toLowerCase() === s.name.toLowerCase())) {
            finalSkills.push(s);
          }
        }
      }

      profile.resumeUrl       = resumeUrl;
      profile.resumeName      = fileName;
      profile.resumeUpdatedAt = new Date();
      profile.resumeText      = extractedText;
      profile.skills          = finalSkills;
      profile.lastAnalyzedAt  = new Date();
      profile.resumeCategory  = intelligence.category;
      profile.resumeSummary   = intelligence.resumeSummary;
      profile.suggestedRoles  = intelligence.suggestedRoles;
      profile.resumeInsights  = intelligence.insights;

      // Extract detailed profile sections (About Me, experiences, education, projects)
      console.log("[Resume Upload] Extracting detailed profile sections");
      try {
        const details = await extractProfileDetails(extractedText);
        
        if (details.bio) {
          profile.bio = details.bio;
        }
        if (details.experiences && details.experiences.length > 0) {
          profile.experiences = details.experiences.map((exp: any) => ({
            company: exp.company || "",
            role: exp.role || "",
            period: exp.period || "",
            duration: exp.duration || "",
            description: exp.description || "",
            skills: exp.skills || [],
            companyColor: "#6366f1",
            logo: (exp.company || "C").charAt(0).toUpperCase()
          }));
        }
        if (details.education && details.education.length > 0) {
          profile.education = details.education.map((edu: any) => ({
            school: edu.school || "",
            degree: edu.degree || "",
            period: edu.period || "",
            logo: (edu.school || "S").charAt(0).toUpperCase(),
            color: "#003580"
          }));
        }
        if (details.projects && details.projects.length > 0) {
          profile.projects = details.projects.map((proj: any) => ({
            name: proj.name || "",
            description: proj.description || "",
            tech: proj.tech || [],
            link: "#",
            stars: "0"
          }));
        }

        // Also sync contact details if empty or default
        if (details.phone && (!profile.phone || profile.phone === "+91 98765 43210")) {
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
      } catch (extractErr) {
        console.error("[Resume Upload] Non-fatal: Failed to extract detailed profile sections:", extractErr);
      }

      await profile.save();
    } catch (dbErr: any) {
      console.error("[Resume Upload] MongoDB save error:", dbErr);
      return NextResponse.json({ success: false, step: "mongodb_update", error: dbErr.message || "Failed to save profile" }, { status: 500 });
    }
    console.log("[Resume Upload Step] MongoDB update success");

    return NextResponse.json({
      success: true,
      data: {
        resumeUrl,
        resumeName:      fileName,
        resumeUpdatedAt: profile.resumeUpdatedAt,
        skillsExtracted: newSkills.length,
        skills:          profile.skills,
        resumeCategory:  profile.resumeCategory,
        resumeSummary:   profile.resumeSummary,
        suggestedRoles:  profile.suggestedRoles,
        resumeInsights:  profile.resumeInsights,
        lastAnalyzedAt:  profile.lastAnalyzedAt,
      },
    });
  } catch (err: any) {
    console.error("[Resume Upload] Unhandled error:", err);
    return NextResponse.json(
      { success: false, step: currentStep, error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}