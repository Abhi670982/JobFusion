import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Mock data for crawler analytics since there's no dedicated database for this
    return NextResponse.json({
      success: true,
      data: {
        stats: {
          crawledToday: 342,
          successRate: 94.5,
          activePipelines: 3,
        },
        portalStats: [
          { name: "Careers Pages", success: 98, total: 150 },
          { name: "Wellfound", success: 92, total: 120 },
          { name: "Aggregator", success: 88, total: 72 },
        ],
        recentLogs: [
          { id: "log-1", source: "careers", status: "success", jobsFound: 15, timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
          { id: "log-2", source: "wellfound", status: "success", jobsFound: 42, timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
          { id: "log-3", source: "aggregator", status: "error", message: "Timeout connecting to feed", timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
          { id: "log-4", source: "careers", status: "success", jobsFound: 8, timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
        ]
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
