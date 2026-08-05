import { portalRegistry } from "./registry";
import { PortalUnifiedJob, JobPortalSource } from "./adapters/base-adapter";
import { expandSkillsToQueries } from "./utils/query-expansion";
import { parsePostedDate } from "@/lib/parse-posted-date";
import { PORTAL_CONFIG } from "./config";
import { defaultLogger, Logger } from "./observability/logger";
import { createMetricsCollector } from "./observability/metrics";
import { getCircuitBreaker } from "./resilience/circuit-breaker";
import { sanitizeJobDescription, validateExternalUrl } from "./sanitizers/sanitizer";
import { PortalJobDTOV1 } from "./dto/v1";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout of ${ms}ms exceeded`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

interface CrawlerOptions {
  portal: JobPortalSource | "all";
  keyword?: string;
  skills?: string[];
  location?: string;
  page?: number;
  limit?: number;
  crawlFrom?: Date;
  crawlTo?: Date;
  logger?: Logger;
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

/**
 * Executes the 10-stage Job Portal Deterministic Processing Pipeline
 */
export async function crawlPortalJobs(options: CrawlerOptions): Promise<{
  jobs: PortalUnifiedJob[];
  dtoJobs: PortalJobDTOV1[];
  errors: string[];
  partial?: boolean;
  timedOut?: boolean;
  failedPortals?: string[];
  metricsSummary: ReturnType<ReturnType<typeof createMetricsCollector>["getSummary"]>;
}> {
  const logger = options.logger || defaultLogger;
  const metrics = createMetricsCollector();
  const portalParam = options.portal;
  const rawSkills = options.skills || [];
  const location = options.location || "India";
  const page = options.page || 1;
  const limit = options.limit || PORTAL_CONFIG.DEFAULT_PAGE_SIZE;

  let keywords: string[] = [];
  if (options.keyword && options.keyword.trim().length > 0) {
    keywords = [options.keyword.trim()];
  } else if (rawSkills.length > 0) {
    keywords = expandSkillsToQueries(rawSkills);
  } else {
    keywords = ["software engineer"];
  }

  const registeredPortals = portalRegistry.getAvailableSources();
  const portalsToCrawl: JobPortalSource[] =
    portalParam === "all" ? registeredPortals : [portalParam];

  const errors: string[] = [];
  const allRawJobs: { source: JobPortalSource; raw: any }[] = [];
  const failedPortals: string[] = [];
  let partial = false;

  logger.info(`Starting 10-stage pipeline crawl for portal: "${portalParam}", keywords: "${keywords[0]}", location: "${location}"`);

  // Stage 1: FETCH (with bounded concurrency and circuit breaker protection)
  const executePortalFetch = async (portal: JobPortalSource) => {
    const startTime = Date.now();
    const cb = getCircuitBreaker(portal);

    if (!cb.isCallAllowed()) {
      logger.warn(`Circuit breaker OPEN for portal: ${portal}. Skipping call.`, { portal });
      errors.push(`${portal}: Circuit breaker open (suspended)`);
      failedPortals.push(portal);
      portalRegistry.updateHealth(portal, "Offline");
      metrics.recordAdapterExecution({
        portal,
        durationMs: 0,
        success: false,
        itemCount: 0,
        error: "Circuit breaker open",
      });
      return;
    }

    try {
      const adapter = portalRegistry.getAdapter(portal, logger);
      const rawPageJobs = await withTimeout(
        adapter.fetchJobs({ keywords, location, page }),
        PORTAL_CONFIG.ADAPTER_TIMEOUT_MS
      );

      cb.recordSuccess();
      portalRegistry.updateHealth(portal, "Healthy");
      const durationMs = Date.now() - startTime;

      metrics.recordAdapterExecution({
        portal,
        durationMs,
        success: true,
        itemCount: rawPageJobs.length,
      });

      rawPageJobs.forEach(rj => allRawJobs.push({ source: portal, raw: rj }));
    } catch (err: any) {
      cb.recordFailure();
      portalRegistry.updateHealth(portal, cb.getState() === "OPEN" ? "Offline" : "Degraded");
      const durationMs = Date.now() - startTime;

      logger.warn(`Portal fetch failed for ${portal}: ${err.message}`, { portal });
      errors.push(`${portal}: ${err.message}`);
      failedPortals.push(portal);

      metrics.recordAdapterExecution({
        portal,
        durationMs,
        success: false,
        itemCount: 0,
        error: err.message,
      });
    }
  };

  // Concurrency Limiter
  const chunks: JobPortalSource[][] = [];
  for (let i = 0; i < portalsToCrawl.length; i += PORTAL_CONFIG.MAX_ADAPTER_CONCURRENCY) {
    chunks.push(portalsToCrawl.slice(i, i + PORTAL_CONFIG.MAX_ADAPTER_CONCURRENCY));
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map(p => executePortalFetch(p)));
  }

  if (failedPortals.length > 0) {
    partial = true;
  }

  // Stages 2 - 5: NORMALIZE ➔ VALIDATE ➔ SANITIZE ➔ DEDUPLICATE ➔ FILTER
  const unifiedJobs: PortalUnifiedJob[] = [];
  const seenHashes = new Set<string>();

  for (const jobWrap of allRawJobs) {
    try {
      const adapter = portalRegistry.getAdapter(jobWrap.source, logger);
      
      // Stage 2: NORMALIZE
      const unified = adapter.mapToUnified(jobWrap.raw);

      // Stage 3: VALIDATE
      if (!unified.title || !unified.company || !unified.source) {
        logger.warn(`[Validation] Missing required fields for job on ${jobWrap.source}`);
        continue;
      }

      // Stage 4: SANITIZE
      unified.description = sanitizeJobDescription(unified.description);
      unified.applyUrl = validateExternalUrl(unified.applyUrl);
      unified.sourceUrl = validateExternalUrl(unified.sourceUrl) || unified.applyUrl || "https://jobfusion.com";
      unified.experience = normalizeExperienceLevel(unified.experience);

      // Resolve Date
      let isDateless = true;
      let keepJob = true;

      if (unified.postedDate) {
        const parsedDate = parsePostedDate(String(unified.postedDate));
        let resolvedDate: Date | null = null;

        if (parsedDate) {
          resolvedDate = parsedDate.timestamp;
        } else {
          const d = new Date(unified.postedDate);
          if (!isNaN(d.getTime())) resolvedDate = d;
        }

        if (resolvedDate) {
          isDateless = false;
          if (options.crawlFrom && resolvedDate < options.crawlFrom) keepJob = false;
          if (options.crawlTo && resolvedDate > options.crawlTo) keepJob = false;

          if (!options.crawlFrom) {
            const ageMs = Date.now() - resolvedDate.getTime();
            const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
            if (ageMs > TEN_DAYS_MS) keepJob = false;
          }
          unified.postedDate = resolvedDate.toISOString();
        }
      }

      unified.isDateless = isDateless;

      if (!keepJob) continue;

      // Stage 5: DEDUPLICATE
      const hashInput = `${unified.source}-${unified.title}-${unified.company}-${unified.applyUrl || ""}`.toLowerCase();
      if (seenHashes.has(hashInput) || seenHashes.has(unified.sourceId)) continue;
      seenHashes.add(hashInput);
      seenHashes.add(unified.sourceId);

      // Filtering by skill relevance
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

  // Stage 7: SORT (Deterministic ISO Timestamp descending; dateless at bottom)
  unifiedJobs.sort((a, b) => {
    const tsA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
    const tsB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
    return tsB - tsA;
  });

  // Stage 8: PAGINATE (Must occur strictly AFTER sorting)
  const startIndex = (page - 1) * limit;
  const paginatedUnified = unifiedJobs.slice(startIndex, startIndex + limit);

  // Stage 9: MAP DTO
  const dtoJobs: PortalJobDTOV1[] = paginatedUnified.map(j => ({
    id: j.sourceId,
    title: j.title,
    company: j.company,
    companyLogo: j.logo,
    location: j.location || "Remote",
    isRemote: j.isRemote,
    employmentType: j.employmentType,
    experienceLevel: j.experience,
    salaryText: j.salary || "Not disclosed",
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    description: j.description,
    applyUrl: j.applyUrl || j.sourceUrl,
    sourcePortal: j.source,
    postedAtISO: j.postedDate,
    isDateless: j.isDateless || false,
    matchedSkills: j.skills,
  }));

  logger.info(`10-Stage Pipeline Complete. Raw=${allRawJobs.length}, Deduplicated/Filtered=${unifiedJobs.length}, ReturnedPageCount=${dtoJobs.length}`);

  const timedOut = errors.some(e => e.toLowerCase().includes("timeout"));

  return {
    jobs: unifiedJobs,
    dtoJobs,
    errors,
    partial,
    timedOut,
    failedPortals,
    metricsSummary: metrics.getSummary(),
  };
}
