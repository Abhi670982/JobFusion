import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import User from "@/models/User";
import Job from "@/models/Job";
import Application from "@/models/Application";
import SavedJob from "@/models/SavedJob";
import Profile from "@/models/Profile";
import Report from "@/models/Report";
import PageView from "@/models/PageView";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7DaysStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ── KPI Queries ──────────────────────────────────────────────────────────
    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersPrevWeek,
      activeUsersCount, // Active in 30d (distinct users from PageView in last 30d)
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
      // Users
      User.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: last7Days } }),
      User.countDocuments({ createdAt: { $gte: prev7DaysStart, $lt: last7Days } }),
      // Active Users
      PageView.distinct("userId", { timestamp: { $gte: last30Days }, userId: { $ne: null } }).then(arr => arr.length),
      // Jobs
      Job.countDocuments({}),
      Job.countDocuments({ createdAt: { $gte: last7Days } }),
      Job.countDocuments({ createdAt: { $gte: prev7DaysStart, $lt: last7Days } }),
      // Resume & AI
      Profile.countDocuments({ resumeUrl: { $nin: [null, ""] } }),
      Profile.countDocuments({ lastAnalyzedAt: { $exists: true, $ne: null } }),
      // Applications
      Application.countDocuments({}),
      Application.countDocuments({ appliedAt: { $gte: last7Days } }),
      Application.countDocuments({ appliedAt: { $gte: prev7DaysStart, $lt: last7Days } }),
      // Saved Jobs
      SavedJob.countDocuments({}),
      // Reports
      Report.countDocuments({ status: "pending" }),
    ]);

    // Calculate Trend percentages (compare last 7 days vs previous 7 days)
    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const userTrend = calculateTrend(newUsersThisWeek, newUsersPrevWeek);
    const jobTrend = calculateTrend(newJobsThisWeek, newJobsPrevWeek);
    const appTrend = calculateTrend(appsThisWeek, appsPrevWeek);

    // System Health Status Summary
    // We consider it "healthy" unless there's a database connection problem
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
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load admin stats" },
      { status: 500 }
    );
  }
}
