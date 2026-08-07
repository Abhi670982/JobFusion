import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const userIdStr = user.id;

    const [profile, savedCount, visitedJobs, appliedCountResult] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: userIdStr },
        include: { skills: true }
      }),
      prisma.savedJob.count({
        where: { userId: userIdStr }
      }),
      prisma.activity.findMany({
        select: { jobId: true },
        where: {
          userId: userIdStr,
          type: "viewed",
          jobId: { not: null }
        },
        distinct: ["jobId"]
      }),
      prisma.application.count({
        where: { userId: userIdStr }
      })
    ]);

    const visitedCount = visitedJobs.length;
    const appliedCount = appliedCountResult || 0;

    const mappedProfile = profile ? {
      _id: profile.id,
      userId: profile.userId,
      skills: profile.skills.map(s => ({ _id: s.id, name: s.name, level: s.level })),
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      experience: profile.experience,
      resumeUrl: profile.resumeUrl,
      resumeName: profile.resumeName,
      resumeUpdatedAt: profile.resumeUpdatedAt,
      phone: profile.phone,
      portfolioUrl: profile.portfolioUrl,
      githubUrl: profile.githubUrl,
      linkedinUrl: profile.linkedinUrl,
      isOnboarded: profile.isOnboarded,
      resumeCategory: profile.resumeCategory,
      resumeSummary: profile.resumeSummary,
      suggestedRoles: profile.suggestedRoles,
      lastAnalyzedAt: profile.lastAnalyzedAt,
      resumeInsights: {
        found: profile.insightsFound,
        missing: profile.insightsMissing,
        tips: profile.insightsTips
      },
      resumeSkillMode: profile.resumeSkillMode,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    } : null;

    return NextResponse.json({
      success: true,
      user,
      profile: mappedProfile,
      stats: {
        visitedCount,
        skillsCount: profile?.skills?.length || 0,
        savedCount,
        appliedCount,
      },
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to load dashboard data");
  }
}
