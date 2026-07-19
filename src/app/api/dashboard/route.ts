import { NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userIdStr = user._id.toString();

    // Query stats in PostgreSQL
    const [profile, savedCount, visitedJobs] = await Promise.all([
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
      })
    ]);

    const visitedCount = visitedJobs.length;

    // Map profile back to MongoDB casing
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
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/dashboard:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
