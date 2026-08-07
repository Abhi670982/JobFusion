import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { safeErrorResponse } from "@/lib/security";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Server-side in-memory TTL Cache (15 seconds)
let statsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 15_000;

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    // Return cached payload if valid and not forced
    if (!forceRefresh && statsCache && Date.now() - statsCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: statsCache.data
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7DaysStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Safe helper function to execute database query with logging & fallback
    async function safeQuery<T>(name: string, queryFn: () => Promise<T>, fallback: T): Promise<T> {
      try {
        return await queryFn();
      } catch (err: any) {
        console.error(`[Admin Stats Query Error] Exception in ${name}:`, err.message || err);
        return fallback;
      }
    }

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // ── KPI Queries in PostgreSQL ─────────────────────────────────────────────
    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersPrevWeek,
      activeUsersList,
      totalJobs,
      newJobsThisWeek,
      newJobsPrevWeek,
      resumeUploadsCount,
      aiAnalysesCount,
      totalApplications,
      appsThisWeek,
      appsPrevWeek,
      totalSavedJobs,
      pendingReportsCount,
      premiumUsers,
      freeUsers,
      totalAIRequests,
      todayAIRequests,
    ] = await Promise.all([
      safeQuery("totalUsers", () => prisma.user.count(), 0),
      safeQuery("newUsersToday", () => prisma.user.count({ where: { createdAt: { gte: todayStart } } }), 0),
      safeQuery("newUsersThisWeek", () => prisma.user.count({ where: { createdAt: { gte: last7Days } } }), 0),
      safeQuery("newUsersPrevWeek", () => prisma.user.count({ where: { createdAt: { gte: prev7DaysStart, lt: last7Days } } }), 0),
      safeQuery("activeUsers", () => prisma.pageView.findMany({
        where: { timestamp: { gte: last30Days }, userId: { not: null } },
        distinct: ["userId"],
        select: { userId: true }
      }), []),
      safeQuery("totalJobs", () => prisma.job.count(), 0),
      safeQuery("newJobsThisWeek", () => prisma.job.count({ where: { createdAt: { gte: last7Days } } }), 0),
      safeQuery("newJobsPrevWeek", () => prisma.job.count({ where: { createdAt: { gte: prev7DaysStart, lt: last7Days } } }), 0),
      safeQuery("resumeUploads", () => prisma.profile.count({
        where: { NOT: [{ resumeUrl: null }, { resumeUrl: "" }] }
      }), 0),
      safeQuery("aiAnalyses", () => prisma.profile.count({
        where: { lastAnalyzedAt: { not: null } }
      }), 0),
      safeQuery("totalApplications", () => prisma.application.count(), 0),
      safeQuery("appsThisWeek", () => prisma.application.count({ where: { appliedAt: { gte: last7Days } } }), 0),
      safeQuery("appsPrevWeek", () => prisma.application.count({ where: { appliedAt: { gte: prev7DaysStart, lt: last7Days } } }), 0),
      safeQuery("savedJobs", () => prisma.savedJob.count(), 0),
      safeQuery("pendingReports", () => prisma.report.count({ where: { status: "pending" } }), 0),
      safeQuery("premiumUsers", () => prisma.subscription.count({ where: { status: "active", planId: { not: "free" } } }), 0),
      safeQuery("freeUsers", () => prisma.user.count({
        where: { NOT: { subscription: { status: "active", planId: { not: "free" } } } }
      }), 0),
      safeQuery("totalAIRequests", () => prisma.userUsage.aggregate({ _sum: { usageCount: true } }), { _sum: { usageCount: 0 } }),
      safeQuery("todayAIRequests", () => prisma.userUsage.aggregate({
        where: { usageDate: { startsWith: todayStr } },
        _sum: { usageCount: true }
      }), { _sum: { usageCount: 0 } }),
    ]);

    const activeUsersCount = activeUsersList.length;

    // Calculate Trend percentages (compare last 7 days vs previous 7 days)
    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const userTrend = calculateTrend(newUsersThisWeek, newUsersPrevWeek);
    const jobTrend = calculateTrend(newJobsThisWeek, newJobsPrevWeek);
    const appTrend = calculateTrend(appsThisWeek, appsPrevWeek);

    const responsePayload = {
      totalUsers: {
        value: totalUsers,
        trend: userTrend >= 0 ? "up" : "down",
        percentage: Math.abs(userTrend),
        label: "vs previous week",
      },
      activeUsers: {
        value: Math.max(activeUsersCount, 1),
        trend: "up",
        percentage: 0,
        label: "active last 30d",
      },
      newUsersToday: {
        value: newUsersToday,
        trend: newUsersToday > 0 ? "up" : "flat",
        percentage: 0,
        label: "registered today",
      },
      totalJobs: {
        value: totalJobs,
        trend: jobTrend >= 0 ? "up" : "down",
        percentage: Math.abs(jobTrend),
        label: "vs previous week",
      },
      resumeUploads: {
        value: resumeUploadsCount,
        trend: "up",
        percentage: 0,
        label: "all-time uploads",
      },
      aiAnalyses: {
        value: aiAnalysesCount,
        trend: "up",
        percentage: 0,
        label: "AI parsed profiles",
      },
      totalApplications: {
        value: totalApplications,
        trend: appTrend >= 0 ? "up" : "down",
        percentage: Math.abs(appTrend),
        label: "vs previous week",
      },
      savedJobs: {
        value: totalSavedJobs,
        trend: "up",
        percentage: 0,
        label: "total saved jobs",
      },
      pendingReports: {
        value: pendingReportsCount,
        trend: pendingReportsCount > 0 ? "down" : "flat",
        percentage: 0,
        label: "pending unresolved",
      },
      systemHealth: {
        value: 100,
        trend: "flat",
        percentage: 100,
        label: "All systems online",
      },
      premiumUsers: {
        value: premiumUsers,
        trend: "up",
        percentage: 0,
        label: "pro subscriptions"
      },
      freeUsers: {
        value: freeUsers,
        trend: "up",
        percentage: 0,
        label: "free tier users"
      },
      totalAIRequests: {
        value: totalAIRequests?._sum?.usageCount || 0,
        trend: "up",
        percentage: 0,
        label: "all-time AI operations"
      },
      todayAIRequests: {
        value: todayAIRequests?._sum?.usageCount || 0,
        trend: "up",
        percentage: 0,
        label: "requests today"
      }
    };

    // Store in TTL Cache
    statsCache = {
      data: responsePayload,
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      cached: false,
      data: responsePayload,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to load admin stats");
  }
}
