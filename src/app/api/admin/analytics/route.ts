import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { safeErrorResponse } from "@/lib/security";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Server-side TTL Cache (20 seconds)
let analyticsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 20_000;

export async function GET(req: any) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";

    if (!forceRefresh && analyticsCache && Date.now() - analyticsCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: analyticsCache.data
      });
    }

    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const last8Weeks = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
    const last6Months = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Helper: generate list of past N days in YYYY-MM-DD format
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

    // Helper function for safe query execution with log & fallback
    async function safeQuery<T>(name: string, queryFn: () => Promise<T>, fallback: T): Promise<T> {
      try {
        return await queryFn();
      } catch (err: any) {
        console.error(`[Analytics API Error] Exception during ${name}:`, err.message || err);
        return fallback;
      }
    }

    // ── 1. USER GROWTH Aggregations (Daily, Weekly, Monthly) ─────────────────
    const dailyRegistrationsRaw = await safeQuery<{ date_str: string; count: number }[]>(
      "dailyRegistrations",
      () => prisma.$queryRaw`
        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date_str, COUNT(*)::int as count
        FROM users
        WHERE "createdAt" >= ${last14Days}
        GROUP BY date_str
      `,
      []
    );
    const dailyRegistrationsMap = new Map(dailyRegistrationsRaw.map(d => [d.date_str, d.count]));
    const dailyUsers = dateList14.map(date => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: dailyRegistrationsMap.get(date) || 0,
    }));

    const weeklyRegistrationsRaw = await safeQuery<{ week_num: number; count: number }[]>(
      "weeklyRegistrations",
      () => prisma.$queryRaw`
        SELECT EXTRACT(WEEK FROM "createdAt")::int as week_num, COUNT(*)::int as count
        FROM users
        WHERE "createdAt" >= ${last8Weeks}
        GROUP BY week_num
        ORDER BY week_num ASC
      `,
      []
    );
    const weeklyUsers = weeklyRegistrationsRaw.map((w, idx) => ({
      date: `Week ${idx + 1}`,
      value: w.count,
    }));

    const monthlyRegistrationsRaw = await safeQuery<{ year_num: number; month_num: number; count: number }[]>(
      "monthlyRegistrations",
      () => prisma.$queryRaw`
        SELECT EXTRACT(YEAR FROM "createdAt")::int as year_num, EXTRACT(MONTH FROM "createdAt")::int as month_num, COUNT(*)::int as count
        FROM users
        WHERE "createdAt" >= ${last6Months}
        GROUP BY year_num, month_num
        ORDER BY year_num ASC, month_num ASC
      `,
      []
    );
    const monthlyUsers = monthlyRegistrationsRaw.map(m => {
      const monthName = new Date(m.year_num, m.month_num - 1).toLocaleDateString("en-US", { month: "short" });
      return {
        date: `${monthName} ${m.year_num}`,
        value: m.count,
      };
    });

    // ── 2. RESUME UPLOAD TREND (last 14 days) ─────────────────────────────────
    const dailyUploadsRaw = await safeQuery<{ date_str: string; count: number }[]>(
      "dailyUploads",
      () => prisma.$queryRaw`
        SELECT TO_CHAR(timestamp, 'YYYY-MM-DD') as date_str, COUNT(*)::int as count
        FROM resume_parsing_logs
        WHERE timestamp >= ${last14Days} AND status = 'success'
        GROUP BY date_str
      `,
      []
    );
    const dailyUploadsMap = new Map(dailyUploadsRaw.map(d => [d.date_str, d.count]));
    const resumeUploads = dateList14.map(date => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: dailyUploadsMap.get(date) || 0,
    }));

    // ── 3. JOB APPLICATIONS TREND (last 14 days) ──────────────────────────────
    const dailyAppsRaw = await safeQuery<{ date_str: string; count: number }[]>(
      "dailyApps",
      () => prisma.$queryRaw`
        SELECT TO_CHAR("appliedAt", 'YYYY-MM-DD') as date_str, COUNT(*)::int as count
        FROM applications
        WHERE "appliedAt" >= ${last14Days}
        GROUP BY date_str
      `,
      []
    );
    const dailyAppsMap = new Map(dailyAppsRaw.map(d => [d.date_str, d.count]));
    const jobApplications = dateList14.map(date => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: dailyAppsMap.get(date) || 0,
    }));

    // ── 4. JOB SOURCE DISTRIBUTION ───────────────────────────────────────────
    const jobSourcesRaw = await safeQuery<{ source: string; count: number }[]>(
      "jobSources",
      () => prisma.$queryRaw`
        SELECT source, COUNT(*)::int as count
        FROM jobs
        WHERE source IN ('careers', 'wellfound', 'foundit', 'aggregator')
        GROUP BY source
      `,
      []
    );
    const jobSources = jobSourcesRaw.map(s => ({
      name: !s.source ? "Other" : s.source === "careers" ? "Company Careers" : s.source.charAt(0).toUpperCase() + s.source.slice(1),
      value: s.count,
    }));

    // ── 5. AI PARSING SUCCESS RATE ────────────────────────────────────────────
    const parseLogsRaw = await safeQuery<{ status: string; count: number }[]>(
      "parseLogs",
      () => prisma.$queryRaw`
        SELECT status::text, COUNT(*)::int as count
        FROM resume_parsing_logs
        GROUP BY status
      `,
      []
    );
    const parseLogsMap = new Map(parseLogsRaw.map(p => [p.status, p.count]));
    const aiSuccessRate = [
      { name: "Success", value: parseLogsMap.get("success") || 0, color: "#10b981" },
      { name: "Failed", value: parseLogsMap.get("failed") || 0, color: "#ef4444" },
      { name: "Processing", value: parseLogsMap.get("processing") || 0, color: "#6366f1" },
    ];

    // ── 6. TOP EXTRACTED SKILLS ──────────────────────────────────────────────
    const topSkillsRaw = await safeQuery<{ name: string; count: number }[]>(
      "topSkills",
      () => prisma.$queryRaw`
        SELECT name, COUNT(*)::int as count
        FROM profile_skills
        GROUP BY name
        ORDER BY count DESC
        LIMIT 8
      `,
      []
    );
    const topSkills = topSkillsRaw.map(s => ({
      name: s.name,
      value: s.count,
    }));

    // ── 7. WEEKLY PLATFORM ACTIVITY (last 7 days) ─────────────────────────────
    const weeklySignupsRaw = await safeQuery<{ date_str: string; count: number }[]>(
      "weeklySignups",
      () => prisma.$queryRaw`
        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date_str, COUNT(*)::int as count
        FROM users
        WHERE "createdAt" >= ${last7Days}
        GROUP BY date_str
      `,
      []
    );
    const weeklyUploadsRaw = await safeQuery<{ date_str: string; count: number }[]>(
      "weeklyUploads",
      () => prisma.$queryRaw`
        SELECT TO_CHAR(timestamp, 'YYYY-MM-DD') as date_str, COUNT(*)::int as count
        FROM resume_parsing_logs
        WHERE timestamp >= ${last7Days} AND status = 'success'
        GROUP BY date_str
      `,
      []
    );
    const weeklyAppsRaw = await safeQuery<{ date_str: string; count: number }[]>(
      "weeklyApps",
      () => prisma.$queryRaw`
        SELECT TO_CHAR("appliedAt", 'YYYY-MM-DD') as date_str, COUNT(*)::int as count
        FROM applications
        WHERE "appliedAt" >= ${last7Days}
        GROUP BY date_str
      `,
      []
    );

    const weeklySignupsMap = new Map(weeklySignupsRaw.map(d => [d.date_str, d.count]));
    const weeklyUploadsMap = new Map(weeklyUploadsRaw.map(d => [d.date_str, d.count]));
    const weeklyAppsMap = new Map(weeklyAppsRaw.map(d => [d.date_str, d.count]));

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
    const pgActivities = await safeQuery(
      "recentActivities",
      () => prisma.activity.findMany({
        include: {
          user: {
            select: {
              fullName: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      []
    );

    const activityFeed = pgActivities.map((act) => {
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
        _id: act.id,
        user: act.user ? {
          fullName: act.user.fullName,
          profileImage: act.user.profileImage,
        } : null,
        time: timeLabel,
        date: relativeDate,
        message,
        type: act.type,
      };
    });

    const payload = {
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
    };

    analyticsCache = {
      data: payload,
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      cached: false,
      data: payload,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to fetch analytics");
  }
}
