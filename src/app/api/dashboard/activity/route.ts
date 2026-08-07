import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, Activity, ActivityType } from "@prisma/client";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

function mapActivity(a: Activity | null) {
  if (!a) return null;
  return {
    _id: a.id,
    userId: a.userId,
    type: a.type,
    jobId: a.jobId,
    jobTitle: a.jobTitle,
    company: a.company,
    details: a.details,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  };
}

export async function GET() {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const userIdStr = user.id;

    let activities = await prisma.activity.findMany({
      where: { userId: userIdStr },
      orderBy: { createdAt: "desc" }
    });

    if (activities.length === 0) {
      const seedActivities: Prisma.ActivityCreateManyInput[] = [];

      const apps = await prisma.application.findMany({
        where: { userId: userIdStr },
        include: { job: true }
      });
      for (const app of apps) {
        seedActivities.push({
          userId: userIdStr,
          type: "applied",
          jobId: app.jobId,
          jobTitle: app.job?.title || "Unknown Position",
          company: app.job?.company || "Unknown Company",
          createdAt: app.appliedAt || app.createdAt,
        });

        if (app.status === "Interview") {
          seedActivities.push({
            userId: userIdStr,
            type: "interview",
            jobId: app.jobId,
            jobTitle: app.job?.title || "Unknown Position",
            company: app.job?.company || "Unknown Company",
            createdAt: app.updatedAt || app.appliedAt,
          });
        } else if (app.status === "Offer") {
          seedActivities.push({
            userId: userIdStr,
            type: "offer",
            jobId: app.jobId,
            jobTitle: app.job?.title || "Unknown Position",
            company: app.job?.company || "Unknown Company",
            createdAt: app.updatedAt || app.appliedAt,
          });
        } else if (app.status === "Rejected") {
          seedActivities.push({
            userId: userIdStr,
            type: "rejected",
            jobId: app.jobId,
            jobTitle: app.job?.title || "Unknown Position",
            company: app.job?.company || "Unknown Company",
            createdAt: app.updatedAt || app.appliedAt,
          });
        }
      }

      const saved = await prisma.savedJob.findMany({
        where: { userId: userIdStr },
        include: { job: true }
      });
      for (const s of saved) {
        seedActivities.push({
          userId: userIdStr,
          type: "saved",
          jobId: s.jobId,
          jobTitle: s.job?.title || "Unknown Position",
          company: s.job?.company || "Unknown Company",
          createdAt: s.savedAt || s.createdAt,
        });
      }

      const profile = await prisma.profile.findUnique({
        where: { userId: userIdStr }
      });
      if (profile) {
        if (profile.resumeUrl) {
          seedActivities.push({
            userId: userIdStr,
            type: "updated_resume",
            details: "Uploaded and parsed resume",
            createdAt: profile.resumeUpdatedAt || profile.updatedAt,
          });
        }
        if (profile.isOnboarded) {
          seedActivities.push({
            userId: userIdStr,
            type: "updated_profile",
            details: "Completed profile onboarding",
            createdAt: profile.updatedAt,
          });
        }
      }

      if (seedActivities.length === 0) {
        seedActivities.push({
          userId: userIdStr,
          type: "updated_profile",
          details: "Registered and signed in to JobFusion",
          createdAt: user.createdAt || new Date(),
        });
      }

      if (seedActivities.length > 0) {
        await prisma.activity.createMany({
          data: seedActivities
        });

        activities = await prisma.activity.findMany({
          where: { userId: userIdStr },
          orderBy: { createdAt: "desc" }
        });
      }
    }

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const chartData = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = daysOfWeek[targetDate.getDay()];
      
      const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
      const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

      const dayActivities = activities.filter(act => {
        const actDate = new Date(act.createdAt);
        return actDate >= dayStart && actDate <= dayEnd;
      });

      const dayViewActivities = dayActivities.filter(act => act.type === "viewed" && act.jobId);
      const uniqueJobIds = Array.from(new Set(dayViewActivities.map(act => act.jobId!.toString())));
      const visitedCount = uniqueJobIds.length;

      chartData.push({
        day: dayName,
        visited: visitedCount,
      });
    }

    const mappedActivities = activities.slice(0, 15).map(mapActivity);

    return NextResponse.json({
      success: true,
      recentActivities: mappedActivities,
      chartData,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to fetch activity history");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const { type, jobId, jobTitle, company, details } = await req.json();

    if (!type) {
      return NextResponse.json(
        { success: false, error: "Type is required" },
        { status: 400 }
      );
    }

    const newActivity = await prisma.activity.create({
      data: {
        userId: user.id,
        type: type as ActivityType,
        jobId: jobId || null,
        jobTitle: jobTitle || null,
        company: company || null,
        details: details || null,
      }
    });

    return NextResponse.json({
      success: true,
      data: mapActivity(newActivity),
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to record activity");
  }
}
