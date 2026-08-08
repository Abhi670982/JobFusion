import { portalRegistry, JobPortalSource } from "./registry";
import { PortalUnifiedJob } from "./adapters/base-adapter";
import { parsePostedDate } from "../parse-posted-date";
import { expandSkillsToQueries } from "./utils/query-expansion";
import { prisma } from "../prisma";
import crypto from "crypto";

export interface CrawlOptions {
  portal?: JobPortalSource | "all";
  keywords?: string[];
  skills?: string[];
  location?: string;
  maxPages?: number;
  crawlFrom?: Date;
  crawlTo?: Date;
  experience?: string;
  remoteOnly?: boolean;
  triggeredBy?: "SCHEDULER" | "MANUAL_ADMIN" | "MANUAL_CLI";
}

function normalizeExperienceLevel(exp: string | undefined): "entry" | "mid" | "senior" | "lead" {
  if (!exp) return "mid";
  const lower = exp.toLowerCase();
  if (lower.includes("entry") || lower.includes("junior") || lower.includes("fresher")) return "entry";
  if (lower.includes("senior") || lower.includes("sr")) return "senior";
  if (lower.includes("lead") || lower.includes("principal")) return "lead";
  return "mid";
}

function classifyErrorCategory(errMsg: string, httpStatus?: number): string {
  const lower = (errMsg || "").toLowerCase();
  if (httpStatus === 404 || lower.includes("actor") || lower.includes("not found")) return "INVALID_ACTOR";
  if (httpStatus === 401 || httpStatus === 403 || lower.includes("unauthorized") || lower.includes("auth")) return "AUTHENTICATION_ERROR";
  if (httpStatus === 429 || lower.includes("rate limit") || lower.includes("too many")) return "RATE_LIMIT";
  if (lower.includes("timeout") || lower.includes("exceeded")) return "TIMEOUT";
  if (lower.includes("missing") || lower.includes("env") || lower.includes("config")) return "CONFIGURATION_ERROR";
  if (lower.includes("parse") || lower.includes("map") || lower.includes("json")) return "PARSER_ERROR";
  if (lower.includes("prisma") || lower.includes("database")) return "DATABASE_ERROR";
  if (httpStatus && httpStatus >= 400) return "HTTP_ERROR";
  return "UNKNOWN_ERROR";
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1500): Promise<{ result?: T; retriesUsed: number; error?: any }> {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const res = await fn();
      return { result: res, retriesUsed: attempt - 1 };
    } catch (err: any) {
      if (attempt > retries) return { error: err, retriesUsed: attempt - 1 };
      const backoff = delayMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timeout exceeded")), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

export async function crawlPortalJobs(options: CrawlOptions = {}) {
  const portalParam = options.portal || "all";
  const location = options.location || "India";
  const startPage = 1;
  const maxPagesLimit = options.maxPages || 3;
  const triggeredBy = options.triggeredBy || "SCHEDULER";

  let rawSkills = options.skills || [];
  let keywords: string[] = [];

  if (options.keywords && options.keywords.length > 0) {
    keywords = options.keywords;
  } else if (rawSkills.length > 0) {
    keywords = expandSkillsToQueries(rawSkills);
  } else {
    keywords = ["Software Engineer", "Full Stack Developer", "Frontend Engineer"];
  }

  const registeredPortals = portalRegistry.getRegisteredSources();
  const portalsToCrawl: JobPortalSource[] =
    portalParam === "all" ? registeredPortals : [portalParam];

  // 1. Create DB record for CrawlerRun
  let crawlerRunId: string | null = null;
  const runStartedAt = new Date();
  try {
    const dbRun = await prisma.crawlerRun.create({
      data: {
        startedAt: runStartedAt,
        status: "RUNNING",
        triggeredBy,
        totalSources: portalsToCrawl.length,
      }
    });
    crawlerRunId = dbRun.id;
  } catch (dbErr: any) {
    console.warn("[Crawler DB Warning] Could not record CrawlerRun start:", dbErr.message);
  }

  const errors: string[] = [];
  const allRawJobs: { source: JobPortalSource; raw: any }[] = [];
  const failedPortals: string[] = [];
  let partial = false;
  let timedOut = false;

  let totalPagesCrawled = 0;
  let failedRequests = 0;
  const portalStats: Record<string, { pagesCrawled: number; jobsFetched: number; status: string }> = {};

  const sourceRunRecords: Array<{
    source: string;
    status: string;
    durationMs: number;
    rawJobs: number;
    validJobs: number;
    rejectedJobs: number;
    errorCategory?: string;
    errorMessage?: string;
    retryCount: number;
  }> = [];

  const crawlPromises = portalsToCrawl.map(async (portal) => {
    portalStats[portal] = { pagesCrawled: 0, jobsFetched: 0, status: "pending" };
    const sourceStartedAt = new Date();

    let sourceRunId: string | null = null;
    if (crawlerRunId) {
      try {
        const sr = await prisma.crawlerSourceRun.create({
          data: {
            crawlerRunId,
            source: portal,
            status: "RUNNING",
            startedAt: sourceStartedAt,
            provider: portal === "linkedin" || portal === "indeed" || portal === "wellfound" || portal === "naukri" || portal === "foundit" ? "Apify" : "Direct",
          }
        });
        sourceRunId = sr.id;
      } catch (err: any) {
        console.warn(`[Crawler DB Warning] Could not record CrawlerSourceRun for ${portal}:`, err.message);
      }
    }

    let sourceRetriesUsed = 0;

    try {
      const adapter = portalRegistry.getAdapter(portal);
      const allPortalJobs: any[] = [];
      let validJobsCount = 0;
      let rejectedJobsCount = 0;

      for (const currentKeyword of keywords) {
        let currentPage = startPage;
        let hasMore = true;

        console.log(`[Crawler] Sourcing live jobs from ${portal} for keyword: "${currentKeyword}" (max ${maxPagesLimit} pages)`);

        while (currentPage <= maxPagesLimit && hasMore) {
          try {
            const fetchResult = await withTimeout(
              withRetry(() => adapter.fetchJobs({ keywords: [currentKeyword], location, page: currentPage })),
              50000
            );

            if (fetchResult.error) {
              throw fetchResult.error;
            }

            sourceRetriesUsed += fetchResult.retriesUsed;
            const rawPageJobs = fetchResult.result || [];

            totalPagesCrawled++;
            portalStats[portal].pagesCrawled++;

            if (!rawPageJobs || rawPageJobs.length === 0) {
              hasMore = false;
              break;
            }

            const mappedJobs = rawPageJobs.map((rj: any) => {
              try {
                return adapter.mapToUnified(rj);
              } catch (err) {
                console.warn(`[Crawler] Mapping error on ${portal} page ${currentPage}:`, err);
                return null;
              }
            });

            let hasJobsOlderThanFrom = false;
            let addedCount = 0;

            for (let i = 0; i < mappedJobs.length; i++) {
              const job = mappedJobs[i];
              const rawJob = rawPageJobs[i];
              if (!job || !job.title || !job.company) {
                rejectedJobsCount++;
                continue;
              }

              let resolvedDate: Date | null = null;
              if (job.postedDate) {
                const parsedDate = parsePostedDate(String(job.postedDate));
                if (parsedDate) {
                  resolvedDate = parsedDate.timestamp;
                } else {
                  const d = new Date(job.postedDate as any);
                  if (!isNaN(d.getTime())) resolvedDate = d;
                }
              }

              if (resolvedDate) {
                if (options.crawlFrom && resolvedDate < options.crawlFrom) {
                  hasJobsOlderThanFrom = true;
                  rejectedJobsCount++;
                  continue;
                }
                if (options.crawlTo && resolvedDate > options.crawlTo) {
                  rejectedJobsCount++;
                  continue;
                }
              }

              allPortalJobs.push(rawJob);
              validJobsCount++;
              addedCount++;
            }

            portalStats[portal].jobsFetched += addedCount;
            console.log(`[Crawler] ${portal} [${currentKeyword}] page ${currentPage}: fetched ${rawPageJobs.length} jobs, kept ${addedCount}`);

            if (hasJobsOlderThanFrom) {
              hasMore = false;
              break;
            }

            currentPage++;
          } catch (err: any) {
            failedRequests++;
            console.warn(`[Crawler] ${portal} [${currentKeyword}] page ${currentPage} failed:`, err.message);
            hasMore = false;
            break;
          }
        }
      }

      portalStats[portal].status = "success";
      const sourceFinishedAt = new Date();
      const sourceDurationMs = sourceFinishedAt.getTime() - sourceStartedAt.getTime();

      if (sourceRunId) {
        try {
          await prisma.crawlerSourceRun.update({
            where: { id: sourceRunId },
            data: {
              status: "SUCCESS",
              finishedAt: sourceFinishedAt,
              durationMs: sourceDurationMs,
              rawJobs: allPortalJobs.length,
              validJobs: validJobsCount,
              rejectedJobs: rejectedJobsCount,
              retryCount: sourceRetriesUsed,
              lastSuccessfulAt: sourceFinishedAt,
            }
          });
        } catch (dbErr: any) {
          console.warn("[Crawler DB Warning] Update source run failed:", dbErr.message);
        }
      }

      sourceRunRecords.push({
        source: portal,
        status: "SUCCESS",
        durationMs: sourceDurationMs,
        rawJobs: allPortalJobs.length,
        validJobs: validJobsCount,
        rejectedJobs: rejectedJobsCount,
        retryCount: sourceRetriesUsed,
      });

      return { portal, rawJobs: allPortalJobs, status: "success" as const };
    } catch (err: any) {
      failedRequests++;
      const errMsg = err.message || "Portal fetch failed";
      console.warn(`[Crawler] Failed fetching from ${portal}:`, errMsg);
      errors.push(`${portal}: ${errMsg}`);
      failedPortals.push(portal);
      portalStats[portal].status = "failed";

      const sourceFinishedAt = new Date();
      const sourceDurationMs = sourceFinishedAt.getTime() - sourceStartedAt.getTime();
      const errCat = classifyErrorCategory(errMsg);

      if (sourceRunId) {
        try {
          await prisma.crawlerSourceRun.update({
            where: { id: sourceRunId },
            data: {
              status: "FAILED",
              finishedAt: sourceFinishedAt,
              durationMs: sourceDurationMs,
              errorMessage: errMsg,
              errorCategory: errCat,
              retryCount: sourceRetriesUsed,
            }
          });
        } catch (dbErr: any) {
          console.warn("[Crawler DB Warning] Update failed source run:", dbErr.message);
        }
      }

      sourceRunRecords.push({
        source: portal,
        status: "FAILED",
        durationMs: sourceDurationMs,
        rawJobs: 0,
        validJobs: 0,
        rejectedJobs: 0,
        errorCategory: errCat,
        errorMessage: errMsg,
        retryCount: sourceRetriesUsed,
      });

      return { portal, rawJobs: [], status: "failed" as const, error: errMsg };
    }
  });

  const results = await Promise.allSettled(crawlPromises);

  for (const res of results) {
    if (res.status === "fulfilled") {
      const data = res.value;
      if (data.status === "success") {
        for (const r of data.rawJobs) {
          allRawJobs.push({ source: data.portal, raw: r });
        }
      } else {
        partial = true;
      }
    } else {
      partial = true;
    }
  }

  // Normalize, deduplicate, score, and filter
  const unifiedJobs: PortalUnifiedJob[] = [];
  const seenHashes = new Set<string>();
  let duplicatesSkipped = 0;

  for (const jobWrap of allRawJobs) {
    try {
      const adapter = portalRegistry.getAdapter(jobWrap.source);
      
      const unified = adapter.mapToUnified(jobWrap.raw);
      if (!unified || !unified.title || !unified.company) continue;

      unified.experience = normalizeExperienceLevel(unified.experience as any);

      let isDateless = true;
      let keepJob = true;

      if (unified.postedDate) {
        const parsedDate = parsePostedDate(String(unified.postedDate));
        let resolvedDate: Date | null = null;

        if (parsedDate) {
          resolvedDate = parsedDate.timestamp;
        } else {
          const d = new Date(unified.postedDate as any);
          if (!isNaN(d.getTime())) resolvedDate = d;
        }

        if (resolvedDate) {
          isDateless = false;
          if (options.crawlFrom && resolvedDate < options.crawlFrom) {
            keepJob = false;
          }
          if (options.crawlTo && resolvedDate > options.crawlTo) {
            keepJob = false;
          }

          unified.postedDate = resolvedDate.toISOString() as any;
        }
      }

      unified.isDateless = isDateless;
      if (!keepJob) continue;

      // Multi-field deduplication hash
      const dedupeKey = `${unified.source}-${unified.sourceId}-${unified.sourceUrl}-${unified.title}-${unified.company}-${unified.location}`.toLowerCase();
      const dedupeHash = crypto.createHash("sha256").update(dedupeKey).digest("hex");

      if (seenHashes.has(dedupeHash)) {
        duplicatesSkipped++;
        continue;
      }
      seenHashes.add(dedupeHash);

      unifiedJobs.push(unified);
    } catch (mapErr: any) {
      console.warn(`[Crawler Map Error]: ${mapErr.message}`);
    }
  }

  console.log(`[Crawler] Deep Crawl Summary: ${unifiedJobs.length} jobs ready (${allRawJobs.length} raw jobs across ${totalPagesCrawled} pages)`);

  const runFinishedAt = new Date();
  const runDurationMs = runFinishedAt.getTime() - runStartedAt.getTime();
  const successfulCount = sourceRunRecords.filter(r => r.status === "SUCCESS").length;
  const failedCount = sourceRunRecords.filter(r => r.status === "FAILED").length;
  const runStatus = failedCount === 0 ? "SUCCESS" : (successfulCount > 0 ? "PARTIAL_SUCCESS" : "FAILED");

  // Update CrawlerRun DB record if crawlerRunId exists
  if (crawlerRunId) {
    try {
      await prisma.crawlerRun.update({
        where: { id: crawlerRunId },
        data: {
          finishedAt: runFinishedAt,
          durationMs: runDurationMs,
          status: runStatus,
          successfulSources: successfulCount,
          failedSources: failedCount,
          jobsFetched: allRawJobs.length,
          duplicateJobs: duplicatesSkipped,
          errorCount: errors.length,
        }
      });
    } catch (dbErr: any) {
      console.warn("[Crawler DB Warning] Could not finalize CrawlerRun:", dbErr.message);
    }
  }

  return {
    crawlerRunId,
    jobs: unifiedJobs,
    dtoJobs: unifiedJobs,
    errors,
    partial,
    timedOut,
    failedPortals,
    metrics: {
      totalPagesCrawled,
      jobsDiscovered: allRawJobs.length,
      duplicatesSkipped,
      failedRequests,
      portalStats,
      successfulSources: successfulCount,
      failedSources: failedCount,
      status: runStatus,
      durationMs: runDurationMs,
    },
  };
}
