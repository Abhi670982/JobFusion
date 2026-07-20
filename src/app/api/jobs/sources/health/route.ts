import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sources = ["wellfound", "careers", "aggregator"];
    const healthStatus: any = {};

    for (const source of sources) {
      // Find the latest fetch log for this source in Postgres
      const lastLog = await prisma.fetchLog.findFirst({
        where: { source },
        orderBy: { timestamp: "desc" }
      });

      // Get count of jobs currently stored for this source (case-insensitive)
      const jobCount = await prisma.job.count({
        where: {
          source: { equals: source, mode: "insensitive" }
        }
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
