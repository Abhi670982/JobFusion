import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const totalJobs = await prisma.job.count();

    // Group count by source in PostgreSQL using Prisma
    const sourceStats = await prisma.job.groupBy({
      by: ["source"],
      _count: {
        id: true
      }
    });

    const sourceBreakdown: Record<string, number> = {
      linkedin: 0,
      indeed: 0,
      wellfound: 0,
      internshala: 0,
      careers: 0
    };

    sourceStats.forEach((stat) => {
      const src = (stat.source || "unknown").toLowerCase();
      sourceBreakdown[src] = stat._count.id;
    });

    // Count jobs added in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const recentJobsCount = await prisma.job.count({
      where: {
        createdAt: { gte: oneDayAgo }
      }
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
