import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { safeErrorResponse } from "@/lib/security";
import { prisma } from "@/lib/prisma";
import { getActiveJobWhereClause } from "@/lib/job-freshness";
import { crawlPortalJobs } from "@/lib/portal-fetcher/crawler";
import { persistPortalJobs } from "@/lib/portal-jobs-persist";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 1. Fetch Overview Database Job Metrics
    const [totalJobsInDb, activeJobsCount, newJobsToday, updatedJobsToday, expiredJobsCount, failedJobsCount] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: getActiveJobWhereClause() }),
      prisma.job.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.job.count({ where: { updatedAt: { gte: startOfDay }, createdAt: { lt: startOfDay } } }),
      prisma.job.count({ where: { isActive: false } }),
      prisma.failedJob.count(),
    ]);

    // 2. Fetch Latest Crawler Run & Status
    const latestRun = await prisma.crawlerRun.findFirst({
      orderBy: { startedAt: "desc" },
      include: { sourceRuns: true },
    });

    const isRunning = latestRun && latestRun.status === "RUNNING";
    const crawlerStatus = isRunning
      ? "RUNNING"
      : latestRun
      ? latestRun.status
      : "IDLE";

    // 3. Fetch Recent Crawler Runs History (Last 10)
    const recentRuns = await prisma.crawlerRun.findMany({
      take: 10,
      orderBy: { startedAt: "desc" },
      include: {
        sourceRuns: {
          select: {
            source: true,
            status: true,
            rawJobs: true,
            validJobs: true,
            newJobs: true,
            updatedJobs: true,
            duplicateJobs: true,
            errorMessage: true,
            errorCategory: true,
          }
        }
      }
    });

    // 4. Source Breakdown (Aggregated per portal)
    const registeredSources = ["linkedin", "indeed", "wellfound", "internshala", "naukri", "foundit", "careers"];
    
    const sourceBreakdown = await Promise.all(
      registeredSources.map(async (src) => {
        const lastSourceRun = await prisma.crawlerSourceRun.findFirst({
          where: { source: src },
          orderBy: { startedAt: "desc" },
        });

        const totalInDb = await prisma.job.count({
          where: { source: { equals: src, mode: "insensitive" } }
        });

        return {
          source: src,
          status: lastSourceRun ? lastSourceRun.status : "IDLE",
          lastCrawlAt: lastSourceRun?.startedAt || lastSourceRun?.finishedAt || null,
          rawJobs: lastSourceRun?.rawJobs || 0,
          validJobs: lastSourceRun?.validJobs || 0,
          newJobs: lastSourceRun?.newJobs || 0,
          updatedJobs: lastSourceRun?.updatedJobs || 0,
          duplicateJobs: lastSourceRun?.duplicateJobs || 0,
          failedJobs: lastSourceRun?.status === "FAILED" ? 1 : 0,
          totalInDb,
          provider: lastSourceRun?.provider || "Apify",
        };
      })
    );

    // 5. Recent Error Logs (Failed source runs or logged failed jobs)
    const failedSourceRuns = await prisma.crawlerSourceRun.findMany({
      where: {
        OR: [
          { status: "FAILED" },
          { errorMessage: { not: null } }
        ]
      },
      take: 15,
      orderBy: { startedAt: "desc" }
    });

    const errorLogs = failedSourceRuns.map((sr) => ({
      id: sr.id,
      source: sr.source,
      timestamp: sr.startedAt,
      errorCategory: sr.errorCategory || "HTTP_ERROR",
      errorMessage: sr.errorMessage || "Crawler source execution failed",
      httpStatus: sr.httpStatus || 500,
      retryCount: sr.retryCount || 0,
      usedFallback: sr.usedFallback || false,
    }));

    return NextResponse.json({
      success: true,
      data: {
        crawlerStatus,
        overview: {
          totalJobsInDb,
          activeJobs: activeJobsCount,
          newJobsToday,
          updatedJobsToday,
          expiredJobsRemoved: expiredJobsCount,
          duplicateJobsToday: latestRun?.duplicateJobs || 0,
          failedJobs: failedJobsCount,
        },
        lastCrawl: latestRun ? {
          startedAt: latestRun.startedAt,
          finishedAt: latestRun.finishedAt,
          durationMs: latestRun.durationMs,
          status: latestRun.status,
          jobsFetched: latestRun.jobsFetched,
          newJobs: latestRun.newJobs,
          updatedJobs: latestRun.updatedJobs,
          duplicateJobs: latestRun.duplicateJobs,
          expiredJobs: latestRun.expiredJobs,
          failedSources: latestRun.failedSources,
          successfulSources: latestRun.successfulSources,
          triggeredBy: latestRun.triggeredBy,
        } : null,
        sourceBreakdown,
        recentRuns,
        errorLogs,
      }
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to fetch crawler diagnostics stats");
  }
}

/**
 * POST /api/admin/crawler-stats
 * Admin manual trigger: Run Crawl Now
 */
export async function POST() {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const runningRun = await prisma.crawlerRun.findFirst({
      where: { status: "RUNNING" }
    });
    if (runningRun) {
      return NextResponse.json({
        success: false,
        error: "Crawler already running",
        data: {
          crawlerRunId: runningRun.id,
          startedAt: runningRun.startedAt,
          triggeredBy: runningRun.triggeredBy,
        }
      }, { status: 409 });
    }

    console.log(`[Admin Manual Trigger] Admin ${adminUser.email} initiated manual job portal crawl pass...`);

    const crawlRes = await crawlPortalJobs({
      portal: "all",
      location: "India",
      maxPages: 3,
      triggeredBy: "MANUAL_ADMIN",
    });

    const persistRes = await persistPortalJobs(crawlRes.jobs, undefined, [], crawlRes.crawlerRunId);

    return NextResponse.json({
      success: true,
      message: `Manual crawl completed successfully in ${crawlRes.metrics.durationMs}ms.`,
      data: {
        crawlerRunId: crawlRes.crawlerRunId,
        status: crawlRes.metrics.status,
        jobsDiscovered: crawlRes.metrics.jobsDiscovered,
        jobsInserted: persistRes.jobsInserted,
        jobsUpdated: persistRes.jobsUpdated,
        duplicatesSkipped: crawlRes.metrics.duplicatesSkipped + persistRes.duplicatesSkipped,
        expiredJobsDeactivated: persistRes.expiredJobsDeactivated,
        failedPortals: crawlRes.failedPortals,
      }
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to execute manual crawl");
  }
}
