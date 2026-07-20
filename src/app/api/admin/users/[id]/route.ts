import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ── GET USER PROFILE DETAILS ────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Fetch user details from Postgres
    const pgUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!pgUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Fetch linked profile from Postgres
    const pgProfile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: true,
        experiences: true,
        education: true,
        certifications: true,
        projects: true
      }
    });

    // Fetch user applications from Postgres
    const pgApplications = await prisma.application.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { appliedAt: "desc" }
    });

    // Map Postgres user model to Mongo format
    const user = {
      _id: pgUser.id,
      clerkId: pgUser.clerkId,
      fullName: pgUser.fullName,
      email: pgUser.email,
      profileImage: pgUser.profileImage,
      role: pgUser.role,
      status: pgUser.status,
      createdAt: pgUser.createdAt,
      updatedAt: pgUser.updatedAt
    };

    // Map Postgres profile to Mongo format
    const profile = pgProfile ? {
      _id: pgProfile.id,
      userId: pgProfile.userId,
      headline: pgProfile.headline,
      bio: pgProfile.bio,
      location: pgProfile.location,
      experience: pgProfile.experience,
      resumeUrl: pgProfile.resumeUrl,
      resumeName: pgProfile.resumeName,
      resumeUpdatedAt: pgProfile.resumeUpdatedAt,
      resumeText: pgProfile.resumeText,
      resumeSkillMode: pgProfile.resumeSkillMode,
      resumeCategory: pgProfile.resumeCategory,
      resumeSummary: pgProfile.resumeSummary,
      suggestedRoles: pgProfile.suggestedRoles,
      lastAnalyzedAt: pgProfile.lastAnalyzedAt,
      resumeInsights: {
        found: pgProfile.insightsFound,
        missing: pgProfile.insightsMissing,
        tips: pgProfile.insightsTips
      },
      skills: pgProfile.skills.map(s => ({
        _id: s.id,
        name: s.name,
        level: s.level
      })),
      experiences: pgProfile.experiences.map(e => ({
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
      education: pgProfile.education.map(ed => ({
        _id: ed.id,
        school: ed.school,
        degree: ed.degree,
        period: ed.period,
        logo: ed.logo,
        color: ed.color
      })),
      certifications: pgProfile.certifications.map(c => ({
        _id: c.id,
        name: c.name,
        issuer: c.issuer,
        year: c.year,
        iconName: c.iconName
      })),
      projects: pgProfile.projects.map(p => ({
        _id: p.id,
        name: p.name,
        description: p.description,
        tech: p.tech,
        link: p.link,
        stars: p.stars
      })),
      noticePeriod: pgProfile.noticePeriod,
      expectedSalary: pgProfile.expectedSalary,
      phone: pgProfile.phone,
      portfolioUrl: pgProfile.portfolioUrl,
      githubUrl: pgProfile.githubUrl,
      linkedinUrl: pgProfile.linkedinUrl,
      isOnboarded: pgProfile.isOnboarded,
      notifications: {
        jobMatches: pgProfile.notificationJobMatches,
        applicationUpdates: pgProfile.notificationApplicationUpdates,
        recruiterMessages: pgProfile.notificationRecruiterMessages,
        aiRecommendations: pgProfile.notificationAiRecommendations,
        weeklyDigest: pgProfile.notificationWeeklyDigest,
        marketingEmails: pgProfile.notificationMarketingEmails
      },
      createdAt: pgProfile.createdAt,
      updatedAt: pgProfile.updatedAt
    } : null;

    // Map Postgres applications to Mongo format
    const applications = pgApplications.map(app => ({
      _id: app.id,
      userId: app.userId,
      status: app.status,
      appliedAt: app.appliedAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      jobId: app.job ? {
        _id: app.job.id,
        title: app.job.title,
        company: app.job.company,
        companyLogo: app.job.companyLogo,
        companyColor: app.job.companyColor,
        location: app.job.location,
        locationType: app.job.locationType,
        salary: app.job.salary,
        experience: app.job.experience,
        experienceLevel: app.job.experienceLevel,
        type: app.job.type,
        postedAt: app.job.postedAt,
        postedAtDate: app.job.postedAtDate,
        category: app.job.category,
        source: app.job.source,
        applyUrl: app.job.applyUrl
      } : null
    }));

    return NextResponse.json({
      success: true,
      data: {
        user,
        profile,
        applications,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load user details";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// ── UPDATE USER (SUSPEND/ACTIVATE) ───────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    const body = await req.json();
    const { status, role } = body;

    // Fetch user details from Postgres
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Do not allow suspending oneself
    if (user.clerkId === admin.clerkId && status === "suspended") {
      return NextResponse.json({ success: false, error: "You cannot suspend your own account." }, { status: 400 });
    }

    // Update in Postgres
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: status !== undefined ? (status === "suspended" ? "suspended" : "active") : undefined,
        role: role !== undefined ? role : undefined
      }
    });

    // Log admin action in Activity collection using structured audit logger
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin: {
        _id: admin.id,
        fullName: admin.fullName,
        email: admin.email
      },
      action: status === "suspended" ? "Suspended User" : "Activated User",
      resource: "User",
      resourceId: updatedUser.id,
      details: `${status === "suspended" ? "Suspended" : "Activated"} user: ${updatedUser.fullName} (${updatedUser.email})`,
    });

    // Format response payload
    const mappedUser = {
      _id: updatedUser.id,
      clerkId: updatedUser.clerkId,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      profileImage: updatedUser.profileImage,
      role: updatedUser.role,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: `User account updated to ${status || updatedUser.status}`,
      data: mappedUser,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// ── DELETE USER (CASCADE) ───────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Fetch user from Postgres
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Prevent self deletion
    if (user.clerkId === admin.clerkId) {
      return NextResponse.json({ success: false, error: "You cannot delete your own account." }, { status: 400 });
    }

    // Perform cascade delete in PostgreSQL
    await prisma.user.delete({
      where: { id: userId }
    });

    // Log admin action using structured audit logger
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin: {
        _id: admin.id,
        fullName: admin.fullName,
        email: admin.email
      },
      action: "Deleted User",
      resource: "User",
      resourceId: userId,
      details: `Permanently deleted user: ${user.fullName} (${user.email})`,
    });

    return NextResponse.json({
      success: true,
      message: "User and all associated profile data deleted successfully",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
