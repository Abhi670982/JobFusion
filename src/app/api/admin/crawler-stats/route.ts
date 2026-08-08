import { NextRequest, NextResponse, after } from "next/server";
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

    // 1. Safe Overview Job Metrics Queries (resilient to empty DB state)
    let totalJobsInDb = 0;
    let activeJobsCount = 0;
    let newJobsToday = 0;
    let updatedJobsToday = 0;
    let expiredJobsCount = 0;
    let failedJobsCount = 0;

    try {
      const [total, active, newToday, updatedToday, expired, failed] = await Promise.all([
        prisma.job.count(),
        prisma.job.count({ where: getActiveJobWhereClause() }),
        prisma.job.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.job.count({ where: { updatedAt: { gte: startOfDay }, createdAt: { lt: startOfDay } } }),
        prisma.job.count({ where: { isActive: false } }),
        prisma.failedJob.count(),
      ]);
      totalJobsInDb = total;
      activeJobsCount = active;
      newJobsToday = newToday;
      updatedJobsToday = updatedToday;
      expiredJobsCount = expired;
      failedJobsCount = failed;
    } catch (dbErr) {
      console.warn("[Admin Crawler Stats] Job count error (falling back to 0):", dbErr);
    }

    // 2. Fetch Latest Crawler Run & Status
    let latestRun = null;
    try {
      latestRun = await prisma.crawlerRun.findFirst({
        orderBy: { startedAt: "desc" },
        include: { sourceRuns: true },
      });
    } catch (runErr) {
      console.warn("[Admin Crawler Stats] CrawlerRun query error:", runErr);
    }

    const isRunning = latestRun && latestRun.status === "RUNNING";
    const crawlerStatus = isRunning
      ? "RUNNING"
      : latestRun
      ? latestRun.status
      : "IDLE";

    // 3. Fetch Recent Crawler Runs History (Last 10)
    let recentRuns: any[] = [];
    try {
      recentRuns = await prisma.crawlerRun.findMany({
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
    } catch (recentErr) {
      console.warn("[Admin Crawler Stats] Recent runs query error:", recentErr);
    }

    // 4. Source Breakdown (Aggregated per portal)
    const registeredSources = ["linkedin", "indeed", "wellfound", "internshala", "naukri", "foundit", "careers"];
    
    const sourceBreakdown = await Promise.all(
      registeredSources.map(async (src) => {
        try {
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
        } catch {
          return {
            source: src,
            status: "IDLE",
            lastCrawlAt: null,
            rawJobs: 0,
            validJobs: 0,
            newJobs: 0,
            updatedJobs: 0,
            duplicateJobs: 0,
            failedJobs: 0,
            totalInDb: 0,
            provider: "Apify",
          };
        }
      })
    );

    // 5. Recent Error Logs (Failed source runs or logged failed jobs)
    let errorLogs: any[] = [];
    try {
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

      errorLogs = failedSourceRuns.map((sr) => ({
        id: sr.id,
        source: sr.source,
        timestamp: sr.startedAt,
        errorCategory: sr.errorCategory || "HTTP_ERROR",
        errorMessage: sr.errorMessage || "Crawler source execution failed",
        httpStatus: sr.httpStatus || 500,
        retryCount: sr.retryCount || 0,
        usedFallback: sr.usedFallback || false,
      }));
    } catch (errLogsErr) {
      console.warn("[Admin Crawler Stats] Error logs query error:", errLogsErr);
    }

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
 * Async Non-Blocking Execution Pattern:
 * Returns HTTP 200/202 JSON immediately with runId and status: "RUNNING".
 * The actual crawl pass executes in the background via Next.js after().
 */
export async function POST() {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // 1. Check for Active Running Crawler Run (Concurrent Lock)
    const runningRun = await prisma.crawlerRun.findFirst({
      where: { status: "RUNNING" }
    });

    if (runningRun) {
      return NextResponse.json({
        success: false,
        status: "ALREADY_RUNNING",
        message: "A crawler run is already in progress.",
        runId: runningRun.id,
        data: {
          crawlerRunId: runningRun.id,
          startedAt: runningRun.startedAt,
          triggeredBy: runningRun.triggeredBy,
        }
      }, { status: 409 });
    }

    // 2. Create CrawlerRun record in PostgreSQL immediately
    const crawlerRun = await prisma.crawlerRun.create({
      data: {
        status: "RUNNING",
        triggeredBy: "MANUAL_ADMIN",
        startedAt: new Date(),
        totalSources: 7,
      }
    });

    console.log(`[Admin Manual Trigger] Admin ${adminUser.email} initiated background crawl pass (runId: ${crawlerRun.id})...`);

    // 3. Delegate execution to background after() so HTTP response returns in <100ms!
    after(async () => {
      console.log(`[Admin Manual Crawl Background] Executing portal crawl pass for runId ${crawlerRun.id}...`);
      try {
        const crawlRes = await crawlPortalJobs({
          portal: "all",
          location: "India",
          maxPages: 3,
          triggeredBy: "MANUAL_ADMIN",
        });

        const persistRes = await persistPortalJobs(crawlRes.jobs, undefined, [], crawlerRun.id);
        console.log(`[Admin Manual Crawl Background Complete] Run ${crawlerRun.id} completed. Discovered: ${crawlRes.metrics.jobsDiscovered}, Persisted: ${persistRes.jobsInserted} new, ${persistRes.jobsUpdated} updated.`);
      } catch (err: any) {
        console.error(`[Admin Manual Crawl Background Error] Run ${crawlerRun.id} failed:`, err.message || err);
        try {
          await prisma.crawlerRun.update({
            where: { id: crawlerRun.id },
            data: {
              status: "FAILED",
              finishedAt: new Date(),
              errorCount: 1,
            }
          });
        } catch {}
      }
    });

    // 4. Return valid JSON response immediately
    return NextResponse.json({
      success: true,
      runId: crawlerRun.id,
      status: "RUNNING",
      message: "Crawler started successfully",
      data: {
        crawlerRunId: crawlerRun.id,
        status: "RUNNING",
        startedAt: crawlerRun.startedAt,
      }
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to execute manual crawl");
  }
}

