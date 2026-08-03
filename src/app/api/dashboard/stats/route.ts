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

    // Dates for week and month filters
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Queries in PostgreSQL using Prisma
    const [
      appliedCount,
      appliedThisWeek,
      appliedThisMonth,
      interviewCount,
      offerCount,
      savedCount,
    ] = await Promise.all([
      prisma.application.count({ where: { userId: userIdStr } }),
      prisma.application.count({ where: { userId: userIdStr, appliedAt: { gte: oneWeekAgo } } }),
      prisma.application.count({ where: { userId: userIdStr, appliedAt: { gte: oneMonthAgo } } }),
      prisma.application.count({ where: { userId: userIdStr, status: "Interview" } }),
      prisma.application.count({ where: { userId: userIdStr, status: "Offer" } }),
      prisma.savedJob.count({ where: { userId: userIdStr } }),
    ]);

    // Usage and monetization queries
    const { hasProAccess } = await import("@/lib/subscription");
    const { usageService } = await import("@/lib/usageService");

    const isPro = await hasProAccess(userIdStr);
    const todayUsage = await usageService.getTodayUsage(userIdStr, "resume-analyzer");

    return NextResponse.json({
      success: true,
      stats: {
        appliedCount,
        appliedThisWeek,
        appliedThisMonth,
        interviewCount,
        offerCount,
        savedCount,
        monetization: {
          isPro,
          todayResumeAnalysisCount: todayUsage,
          dailyLimit: isPro ? null : 2,
          remainingAnalyses: isPro ? "Unlimited" : Math.max(0, 2 - todayUsage),
          availablePortals: isPro ? ["LinkedIn", "Wellfound", "Indeed", "Internshala", "Foundit", "Naukri", "Company Careers"] : ["LinkedIn", "Wellfound"],
          lockedPortalsCount: isPro ? 0 : 4,
        }
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/stats:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
