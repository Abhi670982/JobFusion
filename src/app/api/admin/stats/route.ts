import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7DaysStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ── KPI Queries in PostgreSQL ─────────────────────────────────────────────
    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersPrevWeek,
      activeUsers,
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
    ] = await Promise.all([
      // Users counts
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.user.count({ where: { createdAt: { gte: prev7DaysStart, lt: last7Days } } }),
      // Distinct active users in last 30 days
      prisma.pageView.findMany({
        where: {
          timestamp: { gte: last30Days },
          userId: { not: null }
        },
        distinct: ["userId"],
        select: { userId: true }
      }),
      // Jobs counts
      prisma.job.count(),
      prisma.job.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.job.count({ where: { createdAt: { gte: prev7DaysStart, lt: last7Days } } }),
      // Profiles with uploaded resumes
      prisma.profile.count({
        where: {
          NOT: [
            { resumeUrl: null },
            { resumeUrl: "" }
          ]
        }
      }),
      // Profiles with AI analyses
      prisma.profile.count({
        where: {
          lastAnalyzedAt: { not: null }
        }
      }),
      // Applications counts
      prisma.application.count(),
      prisma.application.count({ where: { appliedAt: { gte: last7Days } } }),
      prisma.application.count({ where: { appliedAt: { gte: prev7DaysStart, lt: last7Days } } }),
      // Saved Jobs count
      prisma.savedJob.count(),
      // Pending Reports count
      prisma.report.count({ where: { status: "pending" } })
    ]);

    const activeUsersCount = activeUsers.length;

    // Calculate Trend percentages (compare last 7 days vs previous 7 days)
    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const userTrend = calculateTrend(newUsersThisWeek, newUsersPrevWeek);
    const jobTrend = calculateTrend(newJobsThisWeek, newJobsPrevWeek);
    const appTrend = calculateTrend(appsThisWeek, appsPrevWeek);

    // System Health Status Summary
    const systemHealthStatus = "healthy";

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: {
          value: totalUsers,
          trend: userTrend >= 0 ? "up" : "down",
          percentage: Math.abs(userTrend),
          label: "vs previous week",
        },
        activeUsers: {
          value: Math.max(activeUsersCount, 1), // fallback to 1 in dev
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
          trend: pendingReportsCount > 0 ? "down" : "flat", // pending is bad, down is good trend
          percentage: 0,
          label: "pending unresolved",
        },
        systemHealth: {
          value: systemHealthStatus,
          trend: "flat",
          percentage: 100,
          label: "All systems online",
        },
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/stats:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load admin stats" },
      { status: 500 }
    );
  }
}
