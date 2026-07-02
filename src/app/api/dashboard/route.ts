import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import Profile from "@/models/Profile";
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

    // Run lookups concurrently
    const [
      profile,
      savedCount,
      visitedJobIds,
    ] = await Promise.all([
      Profile.findOne({ userId }).lean(),
      SavedJob.countDocuments({ userId }),
      Activity.distinct("jobId", { userId, type: "viewed", jobId: { $ne: null } }),
    ]);

    const visitedCount = visitedJobIds.length;

    return NextResponse.json({
      success: true,
      user,
      profile,
      stats: {
        visitedCount,
        skillsCount: profile?.skills?.length || 0,
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
