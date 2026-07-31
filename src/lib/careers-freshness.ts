import { prisma } from "./prisma";
import { JobSourceCategory } from "@prisma/client";
import { enqueueCrawlJob } from "./queue";

/**
 * Named constant for Company Careers background refresh staleness threshold (10 hours).
 * Evaluated relative to an 8-hour scheduled background crawler:
 * - Healthy scheduler (< 8h since last crawl) -> Fresh -> GET never enqueues fallback
 * - Missed run (>= 10h since last crawl) -> Stale -> GET enqueues safety-net refresh
 */
export const CAREERS_REFRESH_STALE_MS = 10 * 60 * 60 * 1000;

/**
 * Retrieves the timestamp of the last successful Company Careers fetch log.
 */
export async function getLastSuccessfulCareersCrawlTime(): Promise<Date | null> {
  try {
    const lastLog = await prisma.fetchLog.findFirst({
      where: {
        source: "careers",
        status: "success",
      },
      orderBy: { timestamp: "desc" },
      select: { timestamp: true },
    });

    return lastLog?.timestamp || null;
  } catch (err: any) {
    console.error("[Careers Freshness] Error querying fetchLog:", err?.message || err);
    return null;
  }
}

/**
 * Determines whether Company Careers data is stale based on the last successful crawl log.
 * Data is stale if no successful crawl exists or if elapsed time >= staleThresholdMs.
 */
export async function isCareersDataStale(
  staleThresholdMs: number = CAREERS_REFRESH_STALE_MS
): Promise<boolean> {
  const lastCrawlTime = await getLastSuccessfulCareersCrawlTime();
  if (!lastCrawlTime) {
    return true; // No successful crawl recorded -> Stale
  }

  const elapsedMs = Date.now() - lastCrawlTime.getTime();
  return elapsedMs >= staleThresholdMs;
}

/**
 * Checks Company Careers freshness and enqueues a background refresh if stale.
 * Non-blocking, fire-and-forget safe, with explicit lifecycle logging.
 */
export async function checkAndEnqueueCareersRefresh(
  staleThresholdMs: number = CAREERS_REFRESH_STALE_MS
): Promise<{ refreshRequested: boolean; enqueued: boolean; reason: string }> {
  try {
    const stale = await isCareersDataStale(staleThresholdMs);
    if (!stale) {
      console.log("[Careers Refresh] Company Careers data is fresh (< 6h since last successful crawl). Refresh skipped.");
      return { refreshRequested: false, enqueued: false, reason: "fresh" };
    }

    console.log("[Careers Refresh] Company Careers data is STALE (>= 6h since last successful crawl). Triggering background refresh...");

    const enqueueResult = await enqueueCrawlJob({
      category: JobSourceCategory.COMPANY_CAREER,
      provider: "CAREERS",
      keyword: "software engineer",
      location: "India",
    });

    if (enqueueResult.enqueued) {
      console.log(`[Careers Refresh] Background refresh successfully queued into BullMQ (jobId: ${enqueueResult.jobId}).`);
    } else {
      console.log(`[Careers Refresh] Background refresh already queued/running (jobId: ${enqueueResult.jobId}). Deduplicated.`);
    }

    return {
      refreshRequested: true,
      enqueued: enqueueResult.enqueued,
      reason: enqueueResult.enqueued ? "enqueued" : "deduplicated",
    };
  } catch (err: any) {
    console.error("[Careers Refresh] Error during background refresh check:", err?.message || err);
    return { refreshRequested: true, enqueued: false, reason: "error" };
  }
}
