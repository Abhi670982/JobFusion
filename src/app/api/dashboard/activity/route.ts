import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import Activity from "@/models/Activity";
import Application from "@/models/Application";
import SavedJob from "@/models/SavedJob";
import Profile from "@/models/Profile";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user._id;

    // Check if the user has any activities in the DB
    let activities = await Activity.find({ userId }).sort({ createdAt: -1 });

    if (activities.length === 0) {
      // Retroactively seed from current state
      const seedActivities = [];

      // 1. Seed applications
      const apps = await Application.find({ userId }).populate("jobId").lean();
      for (const app of apps) {
        seedActivities.push({
          userId,
          type: "applied",
          jobId: app.jobId?._id,
          jobTitle: (app.jobId as any)?.title || "Unknown Position",
          company: (app.jobId as any)?.company || "Unknown Company",
          createdAt: app.appliedAt || (app as any).createdAt,
        });

        if (app.status === "Interview") {
          seedActivities.push({
            userId,
            type: "interview",
            jobId: app.jobId?._id,
            jobTitle: (app.jobId as any)?.title || "Unknown Position",
            company: (app.jobId as any)?.company || "Unknown Company",
            createdAt: (app as any).updatedAt || app.appliedAt,
          });
        } else if (app.status === "Offer") {
          seedActivities.push({
            userId,
            type: "offer",
            jobId: app.jobId?._id,
            jobTitle: (app.jobId as any)?.title || "Unknown Position",
            company: (app.jobId as any)?.company || "Unknown Company",
            createdAt: (app as any).updatedAt || app.appliedAt,
          });
        } else if (app.status === "Rejected") {
          seedActivities.push({
            userId,
            type: "rejected",
            jobId: app.jobId?._id,
            jobTitle: (app.jobId as any)?.title || "Unknown Position",
            company: (app.jobId as any)?.company || "Unknown Company",
            createdAt: (app as any).updatedAt || app.appliedAt,
          });
        }
      }

      // 2. Seed saved jobs
      const saved = await SavedJob.find({ userId }).populate("jobId").lean();
      for (const s of saved) {
        seedActivities.push({
          userId,
          type: "saved",
          jobId: s.jobId?._id,
          jobTitle: (s.jobId as any)?.title || "Unknown Position",
          company: (s.jobId as any)?.company || "Unknown Company",
          createdAt: s.savedAt || (s as any).createdAt,
        });
      }

      // 3. Seed profile and resume creation if exists
      const profile = await Profile.findOne({ userId }).lean();
      if (profile) {
        if (profile.resumeUrl) {
          seedActivities.push({
            userId,
            type: "updated_resume",
            details: "Uploaded and parsed resume",
            createdAt: profile.resumeUpdatedAt || profile.updatedAt,
          });
        }
        if (profile.isOnboarded) {
          seedActivities.push({
            userId,
            type: "updated_profile",
            details: "Completed profile onboarding",
            createdAt: profile.updatedAt,
          });
        }
      }

      // If absolutely no history, add a default sign up activity
      if (seedActivities.length === 0) {
        seedActivities.push({
          userId,
          type: "updated_profile",
          details: "Registered and signed in to JobFusion",
          createdAt: user.createdAt || new Date(),
        });
      }

      // Insert all activities
      await Activity.insertMany(seedActivities);
      activities = await Activity.find({ userId }).sort({ createdAt: -1 });
    }

    // Generate chart data for the last 7 days
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const chartData = [];

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = daysOfWeek[targetDate.getDay()];
      
      // Filter activities for this day
      const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
      const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

      const dayActivities = activities.filter(act => {
        const actDate = new Date(act.createdAt);
        return actDate >= dayStart && actDate <= dayEnd;
      });

      const appsCount = dayActivities.filter(act => act.type === "applied").length;
      const viewsCount = dayActivities.filter(act => act.type === "viewed").length;

      chartData.push({
        day: dayName,
        applications: appsCount,
        views: viewsCount,
      });
    }

    return NextResponse.json({
      success: true,
      recentActivities: activities.slice(0, 15),
      chartData,
    });
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/activity:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { type, jobId, jobTitle, company, details } = await req.json();

    if (!type) {
      return NextResponse.json(
        { success: false, error: "Type is required" },
        { status: 400 }
      );
    }

    const newActivity = await Activity.create({
      userId: user._id,
      type,
      jobId,
      jobTitle,
      company,
      details,
    });

    return NextResponse.json({
      success: true,
      data: newActivity,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
