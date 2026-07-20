import { NextRequest, NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function mapProfile(p: any, user: any) {
  if (!p) return null;
  return {
    _id: p.id,
    userId: user ? {
      _id: user.id || user._id,
      clerkId: user.clerkId,
      fullName: user.fullName,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    } : p.userId,
    headline: p.headline,
    bio: p.bio,
    location: p.location,
    experience: p.experience,
    resumeUrl: p.resumeUrl,
    resumeName: p.resumeName,
    resumeUpdatedAt: p.resumeUpdatedAt,
    resumeText: p.resumeText,
    resumeSkillMode: p.resumeSkillMode,
    resumeCategory: p.resumeCategory,
    resumeSummary: p.resumeSummary,
    suggestedRoles: p.suggestedRoles,
    lastAnalyzedAt: p.lastAnalyzedAt,
    resumeInsights: {
      found: p.insightsFound,
      missing: p.insightsMissing,
      tips: p.insightsTips
    },
    skills: (p.skills || []).map((s: any) => ({
      _id: s.id,
      name: s.name,
      level: s.level
    })),
    experiences: (p.experiences || []).map((e: any) => ({
      _id: e.id,
      company: e.company,
      role: e.role,
      period: e.period,
      duration: e.duration,
      description: e.description,
      skills: e.skills,
      companyColor: e.companyColor,
      logo: e.logo
    })),
    education: (p.education || []).map((ed: any) => ({
      _id: ed.id,
      school: ed.school,
      degree: ed.degree,
      period: ed.period,
      logo: ed.logo,
      color: ed.color
    })),
    certifications: (p.certifications || []).map((c: any) => ({
      _id: c.id,
      name: c.name,
      issuer: c.issuer,
      year: c.year,
      iconName: c.iconName
    })),
    projects: (p.projects || []).map((proj: any) => ({
      _id: proj.id,
      name: proj.name,
      description: proj.description,
      tech: proj.tech,
      link: proj.link,
      stars: proj.stars
    })),
    noticePeriod: p.noticePeriod,
    expectedSalary: p.expectedSalary,
    phone: p.phone,
    portfolioUrl: p.portfolioUrl,
    githubUrl: p.githubUrl,
    linkedinUrl: p.linkedinUrl,
    isOnboarded: p.isOnboarded,
    notifications: {
      jobMatches: p.notificationJobMatches,
      applicationUpdates: p.notificationApplicationUpdates,
      recruiterMessages: p.notificationRecruiterMessages,
      aiRecommendations: p.notificationAiRecommendations,
      weeklyDigest: p.notificationWeeklyDigest,
      marketingEmails: p.notificationMarketingEmails
    },
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  };
}

// 1. POST - Create a Profile (Normally handled by auto-sync, but kept secure)
export async function POST(req: NextRequest) {
  try {
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { headline, bio, skills, location, experience, resumeUrl } = body;

    // Check if profile already exists for this user in Postgres
    let pgProfile = await prisma.profile.findUnique({
      where: { userId: mongoUser._id.toString() }
    });

    if (pgProfile) {
      return NextResponse.json(
        { success: false, error: "Profile already exists for this user. Use PUT to update." },
        { status: 409 }
      );
    }

    // Create in Postgres
    pgProfile = await prisma.profile.create({
      data: {
        user: { connect: { id: mongoUser._id.toString() } },
        headline: headline || "",
        bio: bio || "",
        location: location || "",
        experience: experience || "",
        resumeUrl: resumeUrl || "",
        resumeText: "",
        resumeSkillMode: "merge",
        resumeCategory: "",
        resumeSummary: "",
      }
    });

    // Create skills if they exist
    if (Array.isArray(skills) && skills.length > 0) {
      await prisma.profileSkill.createMany({
        data: skills.map((s: any) => ({
          profileId: pgProfile!.id,
          name: typeof s === "string" ? s : s.name,
          level: s.level ?? 80
        }))
      });
    }

    // Fetch the fully created profile from Postgres to return
    const fullProfile = await prisma.profile.findUnique({
      where: { id: pgProfile.id },
      include: { skills: true }
    });

    return NextResponse.json(
      { success: true, data: mapProfile(fullProfile, mongoUser) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 2. GET - Read Profile of current authenticated user
export async function GET(req: NextRequest) {
  try {
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Enforce "Users can only access their own profile"
    if (userId && userId !== mongoUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only access your own profile" },
        { status: 403 }
      );
    }

    // Fetch profile and all related models from Postgres
    const pgProfile = await prisma.profile.findUnique({
      where: { userId: mongoUser._id.toString() },
      include: {
        skills: true,
        experiences: true,
        education: true,
        certifications: true,
        projects: true
      }
    });

    if (!pgProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Fetch user details from Postgres
    const pgUser = await prisma.user.findUnique({
      where: { id: mongoUser._id.toString() }
    });

    return NextResponse.json({ 
      success: true, 
      data: mapProfile(pgProfile, pgUser || mongoUser) 
    });
  } catch (error: any) {
    console.error("Error in GET /api/profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 3. PUT - Update Profile & User details
export async function PUT(req: NextRequest) {
  try {
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || body.userId;

    // Enforce "Users can only edit their own data"
    if (userId && userId !== mongoUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only edit your own profile" },
        { status: 403 }
      );
    }

    // Update User model fields if they are present in the request
    const userUpdateFields: any = {};
    if (body.fullName !== undefined) userUpdateFields.fullName = body.fullName;
    if (body.email !== undefined) userUpdateFields.email = body.email;
    if (body.profileImage !== undefined) userUpdateFields.profileImage = body.profileImage;

    if (Object.keys(userUpdateFields).length > 0) {
      await prisma.user.update({
        where: { id: mongoUser._id.toString() },
        data: userUpdateFields
      });
    }



    // Fetch existing profile in PostgreSQL to verify existence
    const pgProfile = await prisma.profile.findUnique({
      where: { userId: mongoUser._id.toString() }
    });

    if (!pgProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found to update" },
        { status: 404 }
      );
    }

    // Map profile updating fields to flattened columns
    const updateData: any = {};
    if (body.headline !== undefined) updateData.headline = body.headline;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.experience !== undefined) updateData.experience = body.experience;
    if (body.resumeUrl !== undefined) updateData.resumeUrl = body.resumeUrl;
    if (body.resumeName !== undefined) updateData.resumeName = body.resumeName;
    if (body.resumeUpdatedAt !== undefined) updateData.resumeUpdatedAt = body.resumeUpdatedAt ? new Date(body.resumeUpdatedAt) : null;
    if (body.resumeText !== undefined) updateData.resumeText = body.resumeText;
    if (body.resumeSkillMode !== undefined) updateData.resumeSkillMode = body.resumeSkillMode;
    if (body.resumeCategory !== undefined) updateData.resumeCategory = body.resumeCategory;
    if (body.resumeSummary !== undefined) updateData.resumeSummary = body.resumeSummary;
    if (body.suggestedRoles !== undefined) updateData.suggestedRoles = body.suggestedRoles;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.portfolioUrl !== undefined) updateData.portfolioUrl = body.portfolioUrl;
    if (body.githubUrl !== undefined) updateData.githubUrl = body.githubUrl;
    if (body.linkedinUrl !== undefined) updateData.linkedinUrl = body.linkedinUrl;
    if (body.isOnboarded !== undefined) updateData.isOnboarded = body.isOnboarded;
    if (body.noticePeriod !== undefined) updateData.noticePeriod = body.noticePeriod;
    if (body.expectedSalary !== undefined) updateData.expectedSalary = body.expectedSalary;
    if (body.lastAnalyzedAt !== undefined) updateData.lastAnalyzedAt = body.lastAnalyzedAt ? new Date(body.lastAnalyzedAt) : null;

    if (body.resumeInsights) {
      const ri = body.resumeInsights;
      if (ri.found !== undefined) updateData.insightsFound = ri.found;
      if (ri.missing !== undefined) updateData.insightsMissing = ri.missing;
      if (ri.tips !== undefined) updateData.insightsTips = ri.tips;
    }

    if (body.notifications) {
      const n = body.notifications;
      if (n.jobMatches !== undefined) updateData.notificationJobMatches = n.jobMatches;
      if (n.applicationUpdates !== undefined) updateData.notificationApplicationUpdates = n.applicationUpdates;
      if (n.recruiterMessages !== undefined) updateData.notificationRecruiterMessages = n.recruiterMessages;
      if (n.aiRecommendations !== undefined) updateData.notificationAiRecommendations = n.aiRecommendations;
      if (n.weeklyDigest !== undefined) updateData.notificationWeeklyDigest = n.weeklyDigest;
      if (n.marketingEmails !== undefined) updateData.notificationMarketingEmails = n.marketingEmails;
    }

    // Update in Postgres
    await prisma.profile.update({
      where: { id: pgProfile.id },
      data: updateData
    });

    // Replace nested sub-documents (skills, experiences, education, certifications, projects)
    if (body.skills !== undefined && Array.isArray(body.skills)) {
      await prisma.profileSkill.deleteMany({ where: { profileId: pgProfile.id } });
      if (body.skills.length > 0) {
        await prisma.profileSkill.createMany({
          data: body.skills.map((s: any) => ({
            profileId: pgProfile.id,
            name: typeof s === "string" ? s : s.name,
            level: s.level ?? 80
          }))
        });
      }
    }

    if (body.experiences !== undefined && Array.isArray(body.experiences)) {
      await prisma.workExperience.deleteMany({ where: { profileId: pgProfile.id } });
      if (body.experiences.length > 0) {
        await prisma.workExperience.createMany({
          data: body.experiences.map((e: any) => ({
            profileId: pgProfile.id,
            company: e.company || "",
            role: e.role || "",
            period: e.period || "",
            duration: e.duration || "",
            description: e.description || "",
            skills: e.skills || [],
            companyColor: e.companyColor || null,
            logo: e.logo || null
          }))
        });
      }
    }

    if (body.education !== undefined && Array.isArray(body.education)) {
      await prisma.education.deleteMany({ where: { profileId: pgProfile.id } });
      if (body.education.length > 0) {
        await prisma.education.createMany({
          data: body.education.map((edu: any) => ({
            profileId: pgProfile.id,
            school: edu.school || "",
            degree: edu.degree || "",
            period: edu.period || "",
            logo: edu.logo || null,
            color: edu.color || null
          }))
        });
      }
    }

    if (body.certifications !== undefined && Array.isArray(body.certifications)) {
      await prisma.certification.deleteMany({ where: { profileId: pgProfile.id } });
      if (body.certifications.length > 0) {
        await prisma.certification.createMany({
          data: body.certifications.map((c: any) => ({
            profileId: pgProfile.id,
            name: c.name || "",
            issuer: c.issuer || "",
            year: c.year || "",
            iconName: c.iconName || null
          }))
        });
      }
    }

    if (body.projects !== undefined && Array.isArray(body.projects)) {
      await prisma.project.deleteMany({ where: { profileId: pgProfile.id } });
      if (body.projects.length > 0) {
        await prisma.project.createMany({
          data: body.projects.map((p: any) => ({
            profileId: pgProfile.id,
            name: p.name || "",
            description: p.description || "",
            tech: p.tech || [],
            link: p.link || null,
            stars: p.stars || null
          }))
        });
      }
    }

    // Fetch updated profile with relationships to return
    const updatedProfile = await prisma.profile.findUnique({
      where: { id: pgProfile.id },
      include: {
        skills: true,
        experiences: true,
        education: true,
        certifications: true,
        projects: true
      }
    });

    const pgUser = await prisma.user.findUnique({
      where: { id: mongoUser._id.toString() }
    });

    // Trigger background scraper sync if skills were updated
    if (body.skills && Array.isArray(body.skills)) {
      const newSkillNames = body.skills.map((s: any) => (typeof s === "string" ? s : s.name || "").toLowerCase()).filter(Boolean);
      if (newSkillNames.length > 0) {
        console.log(`[Profile API] Triggering backend skills sync for manually updated skills:`, newSkillNames);
        Promise.resolve().then(async () => {
          try {
            const backendUrl = process.env.JOB_AGGREGATOR_URL || "http://localhost:5000";
            const response = await fetch(`${backendUrl}/api/jobs/sync`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                skills: newSkillNames,
                location: body.location || undefined
              }),
            });
            const data = await response.json();
            console.log(`[Profile API Background] Sync trigger result:`, data);
          } catch (err: any) {
            console.error(`[Profile API Background] Sync trigger failed:`, err.message);
          }
        });
      }
    }

    return NextResponse.json({ success: true, data: mapProfile(updatedProfile, pgUser || mongoUser) });
  } catch (error: any) {
    console.error("Error in PUT /api/profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 4. DELETE - Delete User & Profile
export async function DELETE(req: NextRequest) {
  try {
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Enforce "Users can only edit/delete their own data"
    if (userId && userId !== mongoUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only delete your own account" },
        { status: 403 }
      );
    }

    // Delete in PostgreSQL
    await prisma.profile.delete({
      where: { userId: mongoUser._id.toString() }
    });
    
    await prisma.user.delete({
      where: { id: mongoUser._id.toString() }
    });

    return NextResponse.json({
      success: true,
      message: "Profile and User account deleted successfully",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
