import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const totalJobs = await Job.countDocuments();

    // Group count by source
    const sourceStats = await Job.aggregate([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 }
        }
      }
    ]);

    const sourceBreakdown: Record<string, number> = {
      linkedin: 0,
      indeed: 0,
      wellfound: 0,
      internshala: 0
    };

    sourceStats.forEach((stat) => {
      const src = stat._id || "unknown";
      sourceBreakdown[src] = stat.count;
    });

    // Count jobs added in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const recentJobsCount = await Job.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });

    return NextResponse.json({
      success: true,
      data: {
        total: totalJobs,
        bySource: sourceBreakdown,
        addedInLast24h: recentJobsCount
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
