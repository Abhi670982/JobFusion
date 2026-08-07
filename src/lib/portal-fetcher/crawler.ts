import { portalRegistry, JobPortalSource } from "./registry";
import { PortalUnifiedJob } from "./adapters/base-adapter";
import { parsePostedDate } from "../parse-posted-date";
import { expandSkillsToQueries } from "./utils/query-expansion";
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
}

function normalizeExperienceLevel(exp: string | undefined): "entry" | "mid" | "senior" | "lead" {
  if (!exp) return "mid";
  const lower = exp.toLowerCase();
  if (lower.includes("entry") || lower.includes("junior") || lower.includes("fresher")) return "entry";
  if (lower.includes("senior") || lower.includes("sr")) return "senior";
  if (lower.includes("lead") || lower.includes("principal")) return "lead";
  return "mid";
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1500): Promise<T> {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      return await fn();
    } catch (err: any) {
      if (attempt > retries) throw err;
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

  const errors: string[] = [];
  const allRawJobs: { source: JobPortalSource; raw: any }[] = [];
  const failedPortals: string[] = [];
  let partial = false;
  let timedOut = false;

  let totalPagesCrawled = 0;
  let failedRequests = 0;
  const portalStats: Record<string, { pagesCrawled: number; jobsFetched: number; status: string }> = {};

  const crawlPromises = portalsToCrawl.map(async (portal) => {
    portalStats[portal] = { pagesCrawled: 0, jobsFetched: 0, status: "pending" };
    try {
      const adapter = portalRegistry.getAdapter(portal);
      const allPortalJobs: any[] = [];

      for (const currentKeyword of keywords) {
        let currentPage = startPage;
        let hasMore = true;

        console.log(`[Crawler] Sourcing live jobs from ${portal} for keyword: "${currentKeyword}" (max ${maxPagesLimit} pages)`);

        while (currentPage <= maxPagesLimit && hasMore) {
          try {
            const rawPageJobs = await withTimeout(
              withRetry(() => adapter.fetchJobs({ keywords: [currentKeyword], location, page: currentPage })),
              50000
            );

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
              if (!job) continue;

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
                  continue;
                }
                if (options.crawlTo && resolvedDate > options.crawlTo) {
                  continue;
                }
              }

              allPortalJobs.push(rawJob);
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
      return { portal, rawJobs: allPortalJobs, status: "success" as const };
    } catch (err: any) {
      failedRequests++;
      console.warn(`[Crawler] Failed fetching from ${portal}:`, err.message);
      errors.push(`${portal}: ${err.message}`);
      failedPortals.push(portal);
      portalStats[portal].status = "failed";
      return { portal, rawJobs: [], status: "failed" as const, error: err.message };
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

  return {
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
    },
  };
}
