import { portalRegistry } from "./registry";
import { PortalUnifiedJob, JobPortalSource } from "./adapters/base-adapter";
import { expandSkillsToQueries } from "./utils/query-expansion";
import { parsePostedDate } from "@/lib/parse-posted-date";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout of ${ms}ms exceeded`)), ms)
    ),
  ]);
}

interface CrawlerOptions {
  portal: JobPortalSource | "all";
  keyword?: string;
  skills?: string[];
  location?: string;
  page?: number;
  crawlFrom?: Date;
  crawlTo?: Date;
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

export async function crawlPortalJobs(options: CrawlerOptions): Promise<{
  jobs: PortalUnifiedJob[];
  errors: string[];
  partial?: boolean;
  timedOut?: boolean;
  failedPortals?: string[];
}> {
  const portalParam = options.portal;
  const rawSkills = options.skills || [];
  const location = options.location || "India";
  const page = options.page || 1;

  // Determine keywords to search
  let keywords: string[] = [];
  if (options.keyword && options.keyword.trim().length > 0) {
    keywords = [options.keyword.trim()];
  } else if (rawSkills.length > 0) {
    keywords = expandSkillsToQueries(rawSkills);
  } else {
    keywords = ["software engineer"];
  }

  // Determine active portals
  const portalsToCrawl: JobPortalSource[] =
    portalParam === "all" ? portalRegistry.getAvailableSources() : [portalParam];

  const errors: string[] = [];
  const allRawJobs: { source: JobPortalSource; raw: any }[] = [];
  const failedPortals: string[] = [];
  let timedOut = false;
  let partial = false;

  const overallTimeoutMs = 40000; // 40s overall deadline

  // Parallel Crawling across portals, sequential/progressive page fetching within each portal
  const crawlPromises = portalsToCrawl.map(async (portal) => {
    try {
      const adapter = portalRegistry.getAdapter(portal);
      console.log(`[Crawler] Sourcing live jobs from ${portal} progressively for keyword: "${keywords[0]}"`);

      const allPortalJobs: any[] = [];
      let currentPage = page;
      let hasMore = true;

      while (currentPage <= page + 2 && hasMore) {
        try {
          const rawPageJobs = await withTimeout(
            adapter.fetchJobs({ keywords, location, page: currentPage }),
            18000 // 18s per-page timeout
          );
          if (rawPageJobs.length === 0) {
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

            // Resolve postedAt date
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
                continue; // Skip, it's older than crawlFrom
              }
              if (options.crawlTo && resolvedDate > options.crawlTo) {
                continue; // Skip, it's newer than crawlTo
              }
            }

            allPortalJobs.push(rawJob);
            addedCount++;
          }

          console.log(`[Crawler] ${portal} page ${currentPage}: fetched ${rawPageJobs.length} jobs, kept ${addedCount} within boundaries`);

          if (hasJobsOlderThanFrom) {
            console.log(`[Crawler] ${portal} page ${currentPage} has jobs older than crawlFrom (${options.crawlFrom?.toISOString()}). Stopping pagination.`);
            hasMore = false;
            break;
          }

          if (rawPageJobs.length < 5) {
            hasMore = false;
            break;
          }

          currentPage++;
        } catch (err: any) {
          console.warn(`[Crawler] ${portal} page ${currentPage} failed:`, err.message);
          hasMore = false;
          break;
        }
      }

      return { portal, rawJobs: allPortalJobs, status: "success" as const };
    } catch (err: any) {
      console.warn(`[Crawler] Failed fetching from ${portal}:`, err.message);
      errors.push(`${portal}: ${err.message}`);
      failedPortals.push(portal);
      return { portal, rawJobs: [], status: "failed" as const, error: err.message };
    }
  });

  // Race each promise with a timeout promise representing overall deadline
  const results = await Promise.all(
    crawlPromises.map(async (p, idx) => {
      const portal = portalsToCrawl[idx];
      return Promise.race([
        p,
        new Promise<any>((resolve) => {
          setTimeout(() => {
            resolve({ portal, rawJobs: [], status: "timeout" as const });
          }, overallTimeoutMs);
        })
      ]);
    })
  );

  results.forEach((res) => {
    if (res.status === "success" && res.rawJobs.length > 0) {
      const { portal, rawJobs } = res;
      rawJobs.forEach((rj: any) => {
        allRawJobs.push({ source: portal, raw: rj });
      });
    } else if (res.status === "timeout") {
      timedOut = true;
      partial = true;
      errors.push(`${res.portal}: Timeout exceeded overall deadline`);
      failedPortals.push(res.portal);
    } else if (res.status === "failed") {
      partial = true;
    }
  });

  // Normalize, score, and filter
  const unifiedJobs: PortalUnifiedJob[] = [];
  const seenHashes = new Set<string>();

  for (const jobWrap of allRawJobs) {
    try {
      const adapter = portalRegistry.getAdapter(jobWrap.source);
      const unified = adapter.mapToUnified(jobWrap.raw);

      // Normalize experience
      unified.experience = normalizeExperienceLevel(unified.experience as any);

      // Check date freshness and mark isDateless
      let isDateless = true;
      let keepJob = true;

      if (unified.postedDate) {
        const parsedDate = parsePostedDate(String(unified.postedDate));
        let resolvedDate: Date | null = null;

        if (parsedDate) {
          resolvedDate = parsedDate.timestamp;
        } else {
          // Try native Date parsing as fallback (works for ISO strings from APIs)
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
            // Age check: max 10 days old (consistent with careers pipeline)
            const ageMs = Date.now() - resolvedDate.getTime();
            const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
            if (ageMs > TEN_DAYS_MS) {
              keepJob = false;
            }
          }
          // Update postedDate to the resolved ISO string for consistent client-side sorting
          unified.postedDate = resolvedDate.toISOString() as any;
        }
      }

      unified.isDateless = isDateless;

      if (!keepJob) {
        console.log(`[Crawler] Rejecting stale job: "${unified.title}" posted at ${unified.postedDate}`);
        continue;
      }

      // 1. Deduplication
      if (seenHashes.has(unified.sourceId) || seenHashes.has(unified.sourceUrl)) {
        continue;
      }

      seenHashes.add(unified.sourceId);
      if (unified.sourceUrl) seenHashes.add(unified.sourceUrl);

      // 2. Skill Relevance Filtering
      // If skills list is provided, filter out unrelated jobs (e.g. Sales, Marketing, HR if developer profile)
      if (rawSkills.length > 0) {
        const lowerUserSkills = rawSkills.map(s => s.toLowerCase().trim());
        
        // Prioritize Job Title and Explicit Skills
        const matchesUserSkills = lowerUserSkills.some(skill => 
          unified.title.toLowerCase().includes(skill) || 
          unified.skills.some(s => s.toLowerCase() === skill)
        );

        const hasTechTerm = /\b(developer|engineer|programmer|analyst|architect|consultant|coder|technician|intern)\b/i.test(unified.title);

        // Filter out non-matching jobs (to prevent returning HR/sales positions for developer skills)
        const isSpamRole = /\b(hr|human resources|recruiter|talent acquisition|sales|business development|marketing|digital marketing|operations|office administrator|customer support|telecaller|account manager|finance|accounting|mechanical|civil)\b/i.test(unified.title.toLowerCase()) && 
                          !lowerUserSkills.some(s => unified.title.toLowerCase().includes(s));

        if (isSpamRole || (!matchesUserSkills && !hasTechTerm)) {
          console.log(`[Crawler] Filtering out irrelevant role: "${unified.title}" at "${unified.company}"`);
          continue;
        }
      }

      unifiedJobs.push(unified);
    } catch (mapErr: any) {
      console.warn(`[Crawler] Mapping error:`, mapErr.message);
    }
  }

  console.log(`[Crawler] Merged live results: ${unifiedJobs.length} jobs (from ${allRawJobs.length} raw jobs fetched)`);

  return {
    jobs: unifiedJobs,
    errors,
    partial,
    timedOut,
    failedPortals,
  };
}

