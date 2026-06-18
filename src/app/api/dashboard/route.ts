import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import Profile from "@/models/Profile";
import Application from "@/models/Application";
import SavedJob from "@/models/SavedJob";
import Activity from "@/models/Activity";

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

    // Dates for week and month filters
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run basic aggregate lookups concurrently
    const [
      profile,
      appliedCount,
      appliedThisWeek,
      appliedThisMonth,
      interviewCount,
      offerCount,
      savedCount,
    ] = await Promise.all([
      Profile.findOne({ userId }).lean(),
      Application.countDocuments({ userId }),
      Application.countDocuments({ userId, appliedAt: { $gte: oneWeekAgo } }),
      Application.countDocuments({ userId, appliedAt: { $gte: oneMonthAgo } }),
      Application.countDocuments({ userId, status: "Interview" }),
      Application.countDocuments({ userId, status: "Offer" }),
      SavedJob.countDocuments({ userId }),
    ]);

    return NextResponse.json({
      success: true,
      user,
      profile,
      stats: {
        appliedCount,
        appliedThisWeek,
        appliedThisMonth,
        interviewCount,
        offerCount,
        savedCount,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/dashboard:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
