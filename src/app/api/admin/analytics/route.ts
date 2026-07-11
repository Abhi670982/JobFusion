import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import User from "@/models/User";
import Application from "@/models/Application";
import Job from "@/models/Job";
import Profile from "@/models/Profile";
import ResumeParsingLog from "@/models/ResumeParsingLog";
import Activity from "@/models/Activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Helper: generate list of past 14 days
    const generateDateList = (days: number) => {
      const dates = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dates.push(d.toISOString().slice(0, 10));
      }
      return dates;
    };
    const dateList14 = generateDateList(14);
    const dateList7 = generateDateList(7);

    // ── 1. USER GROWTH Aggregations (Daily, Weekly, Monthly) ─────────────────
    // Daily User registrations (last 14 days)
    const dailyRegistrationsRaw = await User.aggregate([
      { $match: { createdAt: { $gte: last14Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const dailyRegistrationsMap = new Map(dailyRegistrationsRaw.map(d => [d._id, d.count]));
    const dailyUsers = dateList14.map(date => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: dailyRegistrationsMap.get(date) || 0,
    }));

    // Weekly registrations (last 8 weeks)
    const last8Weeks = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
    const weeklyRegistrationsRaw = await User.aggregate([
      { $match: { createdAt: { $gte: last8Weeks } } },
      {
        $group: {
          _id: { $week: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const weeklyUsers = weeklyRegistrationsRaw.map((w, idx) => ({
      date: `Week ${idx + 1}`,
      value: w.count,
    }));

    // Monthly registrations (last 6 months)
    const last6Months = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyRegistrationsRaw = await User.aggregate([
      { $match: { createdAt: { $gte: last6Months } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    const monthlyUsers = monthlyRegistrationsRaw.map(m => {
      const monthName = new Date(m._id.year, m._id.month - 1).toLocaleDateString("en-US", { month: "short" });
      return {
        date: `${monthName} ${m._id.year}`,
        value: m.count,
      };
    });

    // ── 2. RESUME UPLOAD TREND (last 14 days) ─────────────────────────────────
    const dailyUploadsRaw = await ResumeParsingLog.aggregate([
      { $match: { timestamp: { $gte: last14Days }, status: "success" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const dailyUploadsMap = new Map(dailyUploadsRaw.map(d => [d._id, d.count]));
    const resumeUploads = dateList14.map(date => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: dailyUploadsMap.get(date) || 0,
    }));

    // ── 3. JOB APPLICATIONS TREND (last 14 days) ──────────────────────────────
    const dailyAppsRaw = await Application.aggregate([
      { $match: { appliedAt: { $gte: last14Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const dailyAppsMap = new Map(dailyAppsRaw.map(d => [d._id, d.count]));
    const jobApplications = dateList14.map(date => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: dailyAppsMap.get(date) || 0,
    }));

    // ── 4. JOB SOURCE DISTRIBUTION ───────────────────────────────────────────
    const jobSourcesRaw = await Job.aggregate([
      { $match: { source: { $in: ["careers", "wellfound", "foundit"] } } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
    ]);
    const jobSources = jobSourcesRaw.map(s => ({
      name: s._id === "careers" ? "Company Careers" : s._id.charAt(0).toUpperCase() + s._id.slice(1),
      value: s.count,
    }));

    // ── 5. AI PARSING SUCCESS RATE ────────────────────────────────────────────
    const parseLogsRaw = await ResumeParsingLog.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const parseLogsMap = new Map(parseLogsRaw.map(p => [p._id, p.count]));
    const aiSuccessRate = [
      { name: "Success", value: parseLogsMap.get("success") || 0, color: "#10b981" },
      { name: "Failed", value: parseLogsMap.get("failed") || 0, color: "#ef4444" },
      { name: "Processing", value: parseLogsMap.get("processing") || 0, color: "#6366f1" },
    ];

    // ── 6. TOP EXTRACTED SKILLS ──────────────────────────────────────────────
    const topSkillsRaw = await Profile.aggregate([
      { $unwind: "$skills" },
      { $group: { _id: "$skills.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);
    const topSkills = topSkillsRaw.map(s => ({
      name: s._id,
      value: s.count,
    }));

    // ── 7. WEEKLY PLATFORM ACTIVITY (last 7 days) ─────────────────────────────
    const weeklySignupsRaw = await User.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    ]);
    const weeklyUploadsRaw = await ResumeParsingLog.aggregate([
      { $match: { timestamp: { $gte: last7Days }, status: "success" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, count: { $sum: 1 } } },
    ]);
    const weeklyAppsRaw = await Application.aggregate([
      { $match: { appliedAt: { $gte: last7Days } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" } }, count: { $sum: 1 } } },
    ]);

    const weeklySignupsMap = new Map(weeklySignupsRaw.map(d => [d._id, d.count]));
    const weeklyUploadsMap = new Map(weeklyUploadsRaw.map(d => [d._id, d.count]));
    const weeklyAppsMap = new Map(weeklyAppsRaw.map(d => [d._id, d.count]));

    const weeklyActivity = dateList7.map(date => {
      const dayLabel = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
      return {
        day: dayLabel,
        signups: weeklySignupsMap.get(date) || 0,
        uploads: weeklyUploadsMap.get(date) || 0,
        applications: weeklyAppsMap.get(date) || 0,
      };
    });

    // ── 8. RECENT ACTIVITY FEED ──────────────────────────────────────────────
    const recentActivities = await Activity.find({})
      .populate("userId", "fullName email profileImage")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const activityFeed = recentActivities.map((act: any) => {
      const date = new Date(act.createdAt);
      const timeLabel = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const relativeDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      let message = act.details || "Activity logged";
      if (act.type === "applied") {
        message = `Applied to ${act.jobTitle || "Job"} at ${act.company || "Company"}`;
      } else if (act.type === "saved") {
        message = `Saved job ${act.jobTitle || "Job"} at ${act.company || "Company"}`;
      } else if (act.type === "updated_resume") {
        message = "Uploaded and parsed resume";
      } else if (act.type === "updated_profile") {
        message = "Updated profile information";
      } else if (act.type === "registered") {
        message = "Registered new account";
      } else if (act.type === "admin_action") {
        message = act.details || "Admin performed action";
      }

      return {
        _id: act._id,
        user: act.userId ? {
          fullName: act.userId.fullName,
          profileImage: act.userId.profileImage,
        } : null,
        time: timeLabel,
        date: relativeDate,
        message,
        type: act.type,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        userGrowth: {
          daily: dailyUsers,
          weekly: weeklyUsers,
          monthly: monthlyUsers,
        },
        resumeUploads,
        jobApplications,
        jobSourceDistribution: jobSources,
        aiParsingSuccessRate: aiSuccessRate,
        topExtractedSkills: topSkills,
        weeklyActivity,
        activityFeed,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
