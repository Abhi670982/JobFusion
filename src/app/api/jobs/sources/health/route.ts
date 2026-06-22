import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FetchLog from "@/models/FetchLog";
import Job from "@/models/Job";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const sources = ["linkedin", "indeed", "wellfound", "internshala", "careers"];
    const healthStatus: any = {};

    for (const source of sources) {
      // Find the latest fetch log for this source
      const lastLog = await FetchLog.findOne({ source })
        .sort({ timestamp: -1 });

      // Get count of jobs currently stored for this source (case-insensitive regex match)
      const jobCount = await Job.countDocuments({
        source: { $regex: new RegExp(`^${source}$`, "i") }
      });

      healthStatus[source] = {
        lastSync: lastLog ? lastLog.timestamp : null,
        status: lastLog ? lastLog.status : "never_run",
        errorMsg: lastLog ? lastLog.errorMsg : null,
        jobsCount: jobCount,
      };
    }

    return NextResponse.json({
      success: true,
      data: healthStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch health status" },
      { status: 500 }
    );
  }
}
