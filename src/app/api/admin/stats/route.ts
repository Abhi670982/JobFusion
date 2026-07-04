import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import PageView from "@/models/PageView";
import FetchLog from "@/models/FetchLog";
import Job from "@/models/Job";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function getAdminIds(): string[] {
  return (process.env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const adminIds = getAdminIds();

    if (!userId || !adminIds.includes(userId)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // ── Page View Stats ──────────────────────────────────────────────────────
    const [totalViews, viewsToday, viewsThisWeek, viewsThisMonth] = await Promise.all([
      PageView.countDocuments({}),
      PageView.countDocuments({ timestamp: { $gte: today } }),
      PageView.countDocuments({ timestamp: { $gte: last7Days } }),
      PageView.countDocuments({ timestamp: { $gte: last30Days } }),
    ]);

    // Visits per day for the last 14 days
    const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const dailyViewsRaw = await PageView.aggregate([
      { $match: { timestamp: { $gte: last14Days } } },
      {
        $group: {
          _id: {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" },
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const dailyViews = dailyViewsRaw.map((d) => ({
      date: `${d._id.year}-${String(d._id.month).padStart(2, "0")}-${String(d._id.day).padStart(2, "0")}`,
      visits: d.count,
      uniqueUsers: d.uniqueUsers.filter(Boolean).length,
    }));

    // Top pages
    const topPagesRaw = await PageView.aggregate([
      { $group: { _id: "$path", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const topPages = topPagesRaw.map((p) => ({ path: p._id, count: p.count }));

    // Unique user count (logged-in users only)
    const uniqueLoggedInUsers = await PageView.distinct("userId", { userId: { $ne: null } });

    // ── User Stats ───────────────────────────────────────────────────────────
    const [totalUsers, newUsersThisWeek, newUsersThisMonth] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: last7Days } }),
      User.countDocuments({ createdAt: { $gte: last30Days } }),
    ]);

    // ── Fetch Log / Error Stats ──────────────────────────────────────────────
    const recentErrors = await FetchLog.find({ status: { $in: ["failed", "captcha"] } })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    const errorSummary = await FetchLog.aggregate([
      { $match: { status: { $in: ["failed", "captcha"] } } },
      { $group: { _id: { source: "$source", status: "$status" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent successful fetches
    const recentSuccesses = await FetchLog.find({ status: "success" })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    // ── Job Source Health ────────────────────────────────────────────────────
    const sources = ["wellfound", "careers", "aggregator"];
    const sourceHealth: any = {};

    for (const source of sources) {
      const lastLog = await FetchLog.findOne({ source }).sort({ timestamp: -1 }).lean();
      const jobCount = await Job.countDocuments({ source });
      sourceHealth[source] = {
        lastSync: lastLog ? (lastLog as any).timestamp : null,
        status: lastLog ? (lastLog as any).status : "never_run",
        errorMsg: lastLog ? (lastLog as any).errorMsg : null,
        jobsCount: jobCount,
      };
    }

    // ── Total jobs ───────────────────────────────────────────────────────────
    const totalJobs = await Job.countDocuments({});

    return NextResponse.json({
      success: true,
      data: {
        pageViews: {
          total: totalViews,
          today: viewsToday,
          thisWeek: viewsThisWeek,
          thisMonth: viewsThisMonth,
          uniqueLoggedIn: uniqueLoggedInUsers.length,
          dailyChart: dailyViews,
          topPages,
        },
        users: {
          total: totalUsers,
          newThisWeek: newUsersThisWeek,
          newThisMonth: newUsersThisMonth,
        },
        jobs: {
          total: totalJobs,
          sourceHealth,
        },
        errors: {
          recent: recentErrors,
          summary: errorSummary,
        },
        recentSuccesses,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load admin stats" },
      { status: 500 }
    );
  }
}
