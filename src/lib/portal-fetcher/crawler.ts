import { portalRegistry } from "./registry";
import { PortalUnifiedJob, JobPortalSource } from "./adapters/base-adapter";
import { expandSkillsToQueries } from "./utils/query-expansion";

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
}

export async function crawlPortalJobs(options: CrawlerOptions): Promise<{
  jobs: PortalUnifiedJob[];
  errors: string[];
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

  // Parallel Crawling with timeout & boundary catch
  const crawlPromises = portalsToCrawl.map(async (portal) => {
    try {
      const adapter = portalRegistry.getAdapter(portal);
      // Fetch for top keyword
      console.log(`[Crawler] Sourcing live jobs from ${portal} for keyword: "${keywords[0]}"`);
      const rawJobs = await withTimeout(
        adapter.fetchJobs({ keywords, location, page }),
        25000 // 25s individual timeout (accommodates Puppeteer cold launch)
      );
      return { portal, rawJobs };
    } catch (err: any) {
      console.warn(`[Crawler] Failed fetching from ${portal}:`, err.message);
      errors.push(`${portal}: ${err.message}`);
      return { portal, rawJobs: [] };
    }
  });

  const results = await Promise.allSettled(crawlPromises);

  results.forEach((res) => {
    if (res.status === "fulfilled" && res.value.rawJobs.length > 0) {
      const { portal, rawJobs } = res.value;
      rawJobs.forEach((rj) => {
        allRawJobs.push({ source: portal, raw: rj });
      });
    }
  });

  // Normalize, score, and filter
  const unifiedJobs: PortalUnifiedJob[] = [];
  const seenHashes = new Set<string>();

  for (const jobWrap of allRawJobs) {
    try {
      const adapter = portalRegistry.getAdapter(jobWrap.source);
      const unified = adapter.mapToUnified(jobWrap.raw);

      // 1. Deduplication
      if (seenHashes.has(unified.sourceId) || seenHashes.has(unified.sourceUrl)) {
        continue;
      }

      // Keep postedDate as null if it's missing (making it invisible on the frontend)
      if (!unified.postedDate) {
        unified.postedDate = null;
      }

      seenHashes.add(unified.sourceId);
      if (unified.sourceUrl) seenHashes.add(unified.sourceUrl);

      // 2. Skill Relevance Filtering
      // If skills list is provided, filter out unrelated jobs (e.g. Sales, Marketing, HR if developer profile)
      if (rawSkills.length > 0) {
        const lowerUserSkills = rawSkills.map(s => s.toLowerCase().trim());
        const jobText = `${unified.title} ${unified.description} ${unified.skills.join(" ")}`.toLowerCase();
        
        // Check if at least one core skill is mentioned in the job, OR if the job title matches general tech terms
        const hasTechTerm = /\b(developer|engineer|programmer|analyst|architect|consultant|coder|technician|admin|intern)\b/i.test(unified.title);
        const matchesUserSkills = lowerUserSkills.some(skill => jobText.includes(skill));

        // Filter out non-matching jobs (to prevent returning HR/sales positions for developer skills)
        const isSpamRole = /\b(hr|sales|marketing|accountant|recruiter|business development|telecaller|mechanical|civil)\b/i.test(unified.title.toLowerCase()) && 
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
  };
}
