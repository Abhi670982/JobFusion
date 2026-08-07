import { portalRegistry } from "./registry";
import { PortalUnifiedJob, JobPortalSource } from "./adapters/base-adapter";
import { expandSkillsToQueries } from "./utils/query-expansion";
import { parsePostedDate } from "@/lib/parse-posted-date";
import crypto from "crypto";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout of ${ms}ms exceeded`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 1500
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt > retries) throw err;
      console.warn(`[Crawler Retry] Retry attempt ${attempt}/${retries} after error: ${err.message}`);
      await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, attempt - 1)));
    }
  }
}

interface CrawlerOptions {
  portal: JobPortalSource | "all";
  keyword?: string;
  skills?: string[];
  location?: string;
  page?: number;
  maxPages?: number;
  crawlFrom?: Date;
  crawlTo?: Date;
  logger?: Logger;
}

export interface CrawlPortalResult {
  jobs: PortalUnifiedJob[];
  errors: string[];
  partial?: boolean;
  timedOut?: boolean;
  failedPortals?: string[];
  metrics: {
    totalPagesCrawled: number;
    jobsDiscovered: number;
    duplicatesSkipped: number;
    failedRequests: number;
    portalStats: Record<string, { pagesCrawled: number; jobsFetched: number; status: string }>;
  };
}

function normalizeExperienceLevel(exp: string | null): "entry" | "mid" | "senior" | "lead" | null {
  if (!exp) return null;
  const s = exp.toLowerCase().trim();
  if (/\b(entry|junior|jr\.?|associate|intern|fresher|0\s*year|no\s*exp)\b/.test(s)) return "entry";
  if (/\b(mid|intermediate|mid-senior|middle)\b/.test(s)) return "mid";
  if (/\b(senior|sr\.?)\b/.test(s)) return "senior";
  if (/\b(lead|principal|staff|architect|director|manager|head)\b/.test(s)) return "lead";
  return null;
}

export async function crawlPortalJobs(options: CrawlerOptions): Promise<CrawlPortalResult> {
  const portalParam = options.portal;
  const rawSkills = options.skills || [];
  const location = options.location || "India";
  const startPage = options.page || 1;
  const maxPagesLimit = options.maxPages || 10;

  // Determine keywords to search (broader role titles for maximum coverage)
  let keywords: string[] = [];
  if (options.keyword && options.keyword.trim().length > 0) {
    keywords = [options.keyword.trim()];
  } else if (rawSkills.length > 0) {
    keywords = expandSkillsToQueries(rawSkills);
  } else {
    keywords = ["software engineer", "full stack developer", "software developer"];
  }

  const registeredPortals = portalRegistry.getAvailableSources();
  const portalsToCrawl: JobPortalSource[] =
    portalParam === "all" ? registeredPortals : [portalParam];

  const errors: string[] = [];
  const allRawJobs: { source: JobPortalSource; raw: any }[] = [];
  const failedPortals: string[] = [];
  let partial = false;

  let totalPagesCrawled = 0;
  let failedRequests = 0;
  const portalStats: Record<string, { pagesCrawled: number; jobsFetched: number; status: string }> = {};

  const overallTimeoutMs = 120000; // 120s overall deadline for deep parallel crawling

  // Parallel Crawling across portals, progressive multi-page fetching per portal
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
              50000 // 50s per-page timeout for Apify actors
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

      metrics.recordAdapterExecution({
        portal,
        durationMs,
        success: false,
        itemCount: 0,
        error: err.message,
      });
    } else if (res.status === "timeout") {
      timedOut = true;
      partial = true;
      errors.push(`${res.portal}: Timeout exceeded overall deadline`);
      failedPortals.push(res.portal);
      if (portalStats[res.portal]) portalStats[res.portal].status = "timeout";
    } else if (res.status === "failed") {
      partial = true;
    }
  };

  // Normalize, deduplicate, score, and filter
  const unifiedJobs: PortalUnifiedJob[] = [];
  const seenHashes = new Set<string>();
  let duplicatesSkipped = 0;

  for (const jobWrap of allRawJobs) {
    try {
      const adapter = portalRegistry.getAdapter(jobWrap.source, logger);
      
      // Stage 2: NORMALIZE
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

          if (!options.crawlFrom) {
            const ageMs = Date.now() - resolvedDate.getTime();
            const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
            if (ageMs > TEN_DAYS_MS) keepJob = false;
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

      // Skill relevance filtering
      if (rawSkills.length > 0) {
        const lowerUserSkills = rawSkills.map(s => s.toLowerCase().trim());
        const matchesUserSkills = lowerUserSkills.some(skill =>
          unified.title.toLowerCase().includes(skill) ||
          unified.skills.some(s => s.toLowerCase() === skill)
        );

        const hasTechTerm = /\b(developer|engineer|programmer|analyst|architect|consultant|coder|technician|intern)\b/i.test(unified.title);

        const isSpamRole = /\b(hr|human resources|recruiter|talent acquisition|sales|business development|marketing|digital marketing|operations|office administrator|customer support|telecaller|account manager|finance|accounting|mechanical|civil)\b/i.test(unified.title.toLowerCase()) &&
                          !lowerUserSkills.some(s => unified.title.toLowerCase().includes(s));

        if (isSpamRole || (!matchesUserSkills && !hasTechTerm)) {
          continue;
        }
      }

      unifiedJobs.push(unified);
    } catch (mapErr: any) {
      logger.warn(`Mapping or Sanitization error: ${mapErr.message}`);
    }
  }

  console.log(`[Crawler] Deep Crawl Summary: ${unifiedJobs.length} jobs ready (${allRawJobs.length} raw jobs across ${totalPagesCrawled} pages)`);

  return {
    jobs: unifiedJobs,
    dtoJobs,
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
