import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { safeErrorResponse } from "@/lib/security";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/crawler-runs/[id]
 * Lightweight status polling endpoint for an individual crawler run.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id: runId } = await params;
    if (!runId) {
      return NextResponse.json({ success: false, error: "Run ID is required" }, { status: 400 });
    }

    const run = await prisma.crawlerRun.findUnique({
      where: { id: runId },
      include: {
        sourceRuns: {
          select: {
            id: true,
            source: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            durationMs: true,
            rawJobs: true,
            validJobs: true,
            newJobs: true,
            updatedJobs: true,
            duplicateJobs: true,
            errorCategory: true,
            errorMessage: true,
            provider: true,
          }
        }
      }
    });

    if (!run) {
      return NextResponse.json({ success: false, error: "Crawler run not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: run.id,
        status: run.status,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        durationMs: run.durationMs,
        triggeredBy: run.triggeredBy,
        totalSources: run.totalSources,
        successfulSources: run.successfulSources,
        failedSources: run.failedSources,
        jobsFetched: run.jobsFetched,
        newJobs: run.newJobs,
        updatedJobs: run.updatedJobs,
        duplicateJobs: run.duplicateJobs,
        expiredJobs: run.expiredJobs,
        errorCount: run.errorCount,
        sources: run.sourceRuns,
      }
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to fetch crawler run status");
  }
}
