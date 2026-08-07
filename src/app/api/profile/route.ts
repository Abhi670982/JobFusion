import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";

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

// 1. POST - Create a Profile for authenticated user
export async function POST(req: NextRequest) {
  try {
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { headline, bio, location, experience, resumeUrl } = body;

    let pgProfile = await prisma.profile.findUnique({
      where: { userId: mongoUser.id }
    });

    if (pgProfile) {
      return NextResponse.json(
        { success: false, error: "Profile already exists for this user. Use PUT to update." },
        { status: 400 }
      );
    }

    pgProfile = await prisma.profile.create({
      data: {
        userId: mongoUser.id,
        headline: headline || "",
        bio: bio || "",
        location: location || "",
        experience: experience || "",
        resumeUrl: resumeUrl || "",
        resumeSkillMode: "merge",
        resumeCategory: "",
        resumeSummary: "",
      },
      include: {
        skills: true,
        experiences: true,
        education: true,
        certifications: true,
        projects: true
      }
    });

    return NextResponse.json(
      { success: true, data: mapProfile(pgProfile, mongoUser) },
      { status: 201 }
    );
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to create profile");
  }
}

// 2. GET - Read Profile of current authenticated user
export async function GET() {
  try {
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const pgProfile = await prisma.profile.findUnique({
      where: { userId: mongoUser.id },
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

    const pgUser = await prisma.user.findUnique({
      where: { id: mongoUser.id }
    });

    return NextResponse.json({ 
      success: true, 
      data: mapProfile(pgProfile, pgUser || mongoUser) 
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to fetch profile");
  }
}

// 3. PUT - Update Profile & User details of authenticated user
export async function PUT(req: NextRequest) {
  try {
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const body = await req.json();

    // Update User model fields
    const userUpdateFields: any = {};
    if (body.fullName !== undefined) userUpdateFields.fullName = body.fullName;
    if (body.email !== undefined) userUpdateFields.email = body.email;
    if (body.profileImage !== undefined) userUpdateFields.profileImage = body.profileImage;

    if (Object.keys(userUpdateFields).length > 0) {
      await prisma.user.update({
        where: { id: mongoUser.id },
        data: userUpdateFields
      });
    }

    const pgProfile = await prisma.profile.findUnique({
      where: { userId: mongoUser.id }
    });

    if (!pgProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found to update" },
        { status: 404 }
      );
    }

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

    await prisma.profile.update({
      where: { id: pgProfile.id },
      data: updateData
    });

    // Update nested relations
    if (body.skills && Array.isArray(body.skills)) {
      await prisma.profileSkill.deleteMany({ where: { profileId: pgProfile.id } });
      if (body.skills.length > 0) {
        await prisma.profileSkill.createMany({
          data: body.skills.map((s: any) => ({
            profileId: pgProfile.id,
            name: typeof s === 'string' ? s : (s.name || ''),
            level: typeof s === 'object' && s.level ? Number(s.level) : 80
          }))
        });
      }
    }

    if (body.experiences && Array.isArray(body.experiences)) {
      await prisma.workExperience.deleteMany({ where: { profileId: pgProfile.id } });
      if (body.experiences.length > 0) {
        await prisma.workExperience.createMany({
          data: body.experiences.map((e: any) => ({
            profileId: pgProfile.id,
            company: e.company || '',
            role: e.role || '',
            period: e.period || '',
            duration: e.duration || '',
            description: e.description || '',
            skills: Array.isArray(e.skills) ? e.skills : [],
            companyColor: e.companyColor || '#6366f1',
            logo: e.logo || (e.company ? e.company.charAt(0).toUpperCase() : 'C')
          }))
        });
      }
    }

    if (body.education && Array.isArray(body.education)) {
      await prisma.education.deleteMany({ where: { profileId: pgProfile.id } });
      if (body.education.length > 0) {
        await prisma.education.createMany({
          data: body.education.map((ed: any) => ({
            profileId: pgProfile.id,
            school: ed.school || '',
            degree: ed.degree || '',
            period: ed.period || '',
            logo: ed.logo || (ed.school ? ed.school.charAt(0).toUpperCase() : 'S'),
            color: ed.color || '#003580'
          }))
        });
      }
    }

    if (body.certifications && Array.isArray(body.certifications)) {
      await prisma.certification.deleteMany({ where: { profileId: pgProfile.id } });
      if (body.certifications.length > 0) {
        await prisma.certification.createMany({
          data: body.certifications.map((c: any) => ({
            profileId: pgProfile.id,
            name: c.name || '',
            issuer: c.issuer || '',
            year: c.year || '',
            iconName: c.iconName || 'Award'
          }))
        });
      }
    }

    if (body.projects && Array.isArray(body.projects)) {
      await prisma.project.deleteMany({ where: { profileId: pgProfile.id } });
      if (body.projects.length > 0) {
        await prisma.project.createMany({
          data: body.projects.map((proj: any) => ({
            profileId: pgProfile.id,
            name: proj.name || '',
            description: proj.description || '',
            tech: Array.isArray(proj.tech) ? proj.tech : [],
            link: proj.link || '#',
            stars: String(proj.stars || '0')
          }))
        });
      }
    }

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
      where: { id: mongoUser.id }
    });

    return NextResponse.json({ success: true, data: mapProfile(updatedProfile, pgUser || mongoUser) });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to update profile");
  }
}

// 4. DELETE - Delete User & Profile of authenticated user
export async function DELETE() {
  try {
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    await prisma.profile.delete({
      where: { userId: mongoUser.id }
    });
    
    await prisma.user.delete({
      where: { id: mongoUser.id }
    });

    return NextResponse.json({
      success: true,
      message: "Profile and User account deleted successfully",
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to delete profile account");
  }
}
