import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const userIdStr = user.id;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      appliedCount,
      appliedThisWeek,
      appliedThisMonth,
      interviewCount,
      offerCount,
      savedCount,
      totalJobsCount,
      portalJobsCount,
      companyCareersCount,
    ] = await Promise.all([
      prisma.application.count({ where: { userId: userIdStr } }),
      prisma.application.count({ where: { userId: userIdStr, appliedAt: { gte: oneWeekAgo } } }),
      prisma.application.count({ where: { userId: userIdStr, appliedAt: { gte: oneMonthAgo } } }),
      prisma.application.count({ where: { userId: userIdStr, status: "Interview" } }),
      prisma.application.count({ where: { userId: userIdStr, status: "Offer" } }),
      prisma.savedJob.count({ where: { userId: userIdStr } }),
      prisma.job.count({ where: { isActive: true } }),
      prisma.job.count({ where: { isActive: true, sourceCategory: "JOB_PORTAL" } }),
      prisma.job.count({ where: { isActive: true, sourceCategory: "COMPANY_CAREER" } }),
    ]);

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
        totalJobsCount,
        portalJobsCount,
        companyCareersCount,
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
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to fetch dashboard stats");
  }
}
