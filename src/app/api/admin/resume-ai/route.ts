import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const [
      totalParses,
      successCount,
      failedCount,
      avgAggregate,
      topSkillsRaw,
      pgFailedLogs,
    ] = await Promise.all([
      prisma.resumeParsingLog.count(),
      prisma.resumeParsingLog.count({ where: { status: "success" } }),
      prisma.resumeParsingLog.count({ where: { status: "failed" } }),
      prisma.resumeParsingLog.aggregate({
        _avg: {
          parsingTimeMs: true
        }
      }),
      prisma.$queryRaw<{ name: string; count: number }[]>`
        SELECT name, COUNT(*)::int as count
        FROM profile_skills
        GROUP BY name
        ORDER BY count DESC
        LIMIT 10
      `,
      prisma.resumeParsingLog.findMany({
        where: { status: "failed" },
        include: {
          user: {
            select: {
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { timestamp: "desc" },
        take: 20
      })
    ]);

    const averageTimeMs = avgAggregate._avg.parsingTimeMs || 0;
    const topSkills = topSkillsRaw.map(s => ({
      name: s.name,
      count: s.count,
    }));

    const failedLogs = pgFailedLogs.map(log => ({
      _id: log.id,
      userId: log.user ? {
        _id: log.userId,
        fullName: log.user.fullName,
        email: log.user.email
      } : log.userId,
      status: log.status,
      errorMessage: log.errorMsg,
      fileName: log.fileName,
      fileSize: 0,
      parsingTimeMs: log.parsingTimeMs,
      timestamp: log.timestamp,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalParses,
        successCount,
        failedCount,
        averageTimeMs,
        topSkills,
        failedLogs,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/resume-ai:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load resume analytics" },
      { status: 500 }
    );
  }
}
