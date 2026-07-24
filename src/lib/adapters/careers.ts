import crypto from "crypto";
import { SourceAdapter, FetchQuery, UnifiedJob } from "./types";
import { companies, CompanySource } from "../jobs/companySearchUrls";
import {
  RawATSJob,
  fetchGreenhouseJobs,
  fetchLeverJobs,
  fetchAshbyJobs,
  fetchSmartRecruitersJobs,
  fetchRecruiteeJobs,
} from "./ats-apis";
import { canonicalizeUrl } from "../url-cleaner";
import {
  isCompanyInBackoff,
  recordCompanyCrawlSuccess,
  recordCompanyCrawlFailure,
} from "../company-crawl-state";

// Cache in-flight ATS API requests per company to prevent duplicate fetches across concurrent search queries
const apiCache = new Map<string, { data: RawATSJob[]; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

async function getCachedApiJobs(
  companyName: string,
  fetcher: () => Promise<RawATSJob[]>
): Promise<RawATSJob[]> {
  const cached = apiCache.get(companyName);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const data = await fetcher();
    apiCache.set(companyName, { data, timestamp: now });
    return data;
  } catch (err) {
    if (cached) {
      return cached.data;
    }
    throw err;
  }
}

/**
 * Checks if a job title matches the skill keyword using boundary-aware logic.
 */
function matchesSkill(title: string, skill: string): boolean {
  const tLower = title.toLowerCase();
  const sLower = skill.toLowerCase().trim();

  // 1. Direct substring match
  if (tLower.includes(sLower)) return true;

  // 2. Specific cases
  if (sLower.includes("frontend") || sLower.includes("front-end")) {
    return tLower.includes("frontend") || tLower.includes("front-end") || tLower.includes("ui") || tLower.includes("ux");
  }
  if (sLower.includes("backend") || sLower.includes("back-end")) {
    return tLower.includes("backend") || tLower.includes("back-end");
  }
  if (sLower.includes("fullstack") || sLower.includes("full-stack") || sLower.includes("full stack")) {
    return tLower.includes("fullstack") || tLower.includes("full-stack") || tLower.includes("full stack");
  }
  if (sLower.includes("software engineer") || sLower.includes("software developer") || sLower === "developer" || sLower === "engineer") {
    return tLower.includes("software") || tLower.includes("engineer") || tLower.includes("developer") || tLower.includes("programmer");
  }

  return false;
}

export class CareersAdapter implements SourceAdapter {
  source = "careers" as const;

  async fetchJobs(query: FetchQuery): Promise<any[]> {
    const startTime = Date.now();
    const skill = query.keywords[0] || "software engineer";
    const allJobs: any[] = [];
    const seenHashes = new Set<string>();

    const activeAtsCompanies = companies.filter(
      (c: CompanySource) => c.enabled !== false && c.atsType !== "unknown"
    );

    console.log(
      `[Careers Adapter] Starting shared board acquisition for skill: "${skill}" across ${activeAtsCompanies.length} verified ATS companies`
    );

    let attemptedCompanies = 0;
    let successfulCompanies = 0;
    let failedCompanies = 0;
    let rawPostingsFetched = 0;

    const providerMetrics: Record<string, { total: number; success: number; failed: number }> = {};

    const BATCH_SIZE = 10; // Bounded concurrency limit of 10 requests per batch
    for (let i = 0; i < activeAtsCompanies.length; i += BATCH_SIZE) {
      const batch = activeAtsCompanies.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async (company: CompanySource) => {
          const provider = company.atsType.toUpperCase();
          if (!providerMetrics[provider]) {
            providerMetrics[provider] = { total: 0, success: 0, failed: 0 };
          }
          providerMetrics[provider].total++;

          const inBackoff = await isCompanyInBackoff(company.company);
          if (inBackoff) {
            return;
          }

          attemptedCompanies++;
          try {
            let rawJobs: RawATSJob[] = [];
            const slug = company.slug || company.id;
            const companyName = company.company;

            if (company.atsType === "greenhouse") {
              rawJobs = await getCachedApiJobs(companyName, () => fetchGreenhouseJobs(slug));
            } else if (company.atsType === "lever") {
              rawJobs = await getCachedApiJobs(companyName, () => fetchLeverJobs(slug));
            } else if (company.atsType === "ashby") {
              rawJobs = await getCachedApiJobs(companyName, () => fetchAshbyJobs(slug));
            } else if (company.atsType === "smartrecruiters") {
              rawJobs = await getCachedApiJobs(companyName, () => fetchSmartRecruitersJobs(slug));
            } else if (company.atsType === "recruitee") {
              rawJobs = await getCachedApiJobs(companyName, () => fetchRecruiteeJobs(slug));
            }

            rawPostingsFetched += rawJobs.length;
            await recordCompanyCrawlSuccess(companyName, rawJobs.length, company.careersUrl);
            successfulCompanies++;
            providerMetrics[provider].success++;

            for (const job of rawJobs) {
              const mapped = this.mapToUnified({
                ...job,
                company: companyName,
                _isCareersCrawled: true,
              });

              if (!seenHashes.has(mapped.dedupeHash)) {
                seenHashes.add(mapped.dedupeHash);
                allJobs.push({
                  ...job,
                  company: companyName,
                  _isCareersCrawled: true,
                  _mappedHash: mapped.dedupeHash,
                });
              }
            }
          } catch (err: any) {
            failedCompanies++;
            providerMetrics[provider].failed++;
            await recordCompanyCrawlFailure(company.company, err.message || "Fetch failed", company.careersUrl);
            console.error(`[Careers Adapter] Failed to fetch for ${company.company}: ${err.message}`);
          }
        })
      );
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n============================================================`);
    console.log(`=== COMPANY CAREERS ACQUISITION METRICS ===`);
    console.log(`============================================================`);
    console.log(`   Companies Configured:  ${companies.length}`);
    console.log(`   Verified ATS Sources:  ${activeAtsCompanies.length}`);
    console.log(`   Companies Attempted:   ${attemptedCompanies}`);
    console.log(`   Companies Successful:  ${successfulCompanies}`);
    console.log(`   Companies Failed:      ${failedCompanies}`);
    console.log(`   Raw Jobs Fetched:      ${rawPostingsFetched}`);
    console.log(`   Unique Matched Jobs:   ${allJobs.length}`);
    console.log(`   Duration:              ${durationSec}s`);
    console.log(`------------------------------------------------------------`);
    console.log(`Provider Health Breakdown:`);
    for (const [p, metrics] of Object.entries(providerMetrics)) {
      console.log(`   - ${p.padEnd(16)}: ${metrics.success}/${metrics.total} successful (${metrics.failed} failed)`);
    }
    console.log(`============================================================\n`);

    return allJobs;
  }

  mapToUnified(raw: any): UnifiedJob {
    const title = (raw.title || "").trim();
    const company = (raw.company || "").trim();
    const location = (raw.location || "Remote").trim();

    const sourceJobId = raw.sourceJobId ? String(raw.sourceJobId).trim() : undefined;
    const rawApplyUrl = raw.url || null;
    const applyUrl = canonicalizeUrl(rawApplyUrl);

    let dedupeInput = "";
    if (sourceJobId) {
      dedupeInput = `careers:${company.toLowerCase()}:${sourceJobId.toLowerCase()}`;
    } else if (applyUrl) {
      dedupeInput = applyUrl.toLowerCase();
    } else {
      dedupeInput = `${company}:${title}:${location}`.toLowerCase();
    }

    const dedupeHash = crypto
      .createHash("sha256")
      .update(dedupeInput)
      .digest("hex");

    const description = `${title} at ${company}. Location: ${location}. Matched skill: ${raw._skill || ""}`;
    const extractedSkills: string[] = (raw.skills || []).map((s: any) => String(s).toLowerCase());

    if (raw._skill && !extractedSkills.includes(raw._skill.toLowerCase())) {
      extractedSkills.push(raw._skill.toLowerCase());
    }

    const isRemote =
      location.toLowerCase().includes("remote") ||
      location.toLowerCase().includes("anywhere") ||
      location.toLowerCase().includes("work from home");

    let experienceLevel: "entry" | "mid" | "senior" | "lead" | null = null;
    const titleLower = title.toLowerCase();
    if (titleLower.includes("senior") || titleLower.includes("sr.") || titleLower.includes("sr "))
      experienceLevel = "senior";
    else if (titleLower.includes("lead") || titleLower.includes("principal") || titleLower.includes("staff"))
      experienceLevel = "lead";
    else if (
      titleLower.includes("junior") ||
      titleLower.includes("jr.") ||
      titleLower.includes("intern") ||
      titleLower.includes("entry")
    )
      experienceLevel = "entry";
    else experienceLevel = "mid";

    let jobType:
      | "full-time"
      | "part-time"
      | "contract"
      | "internship"
      | "freelance"
      | null = "full-time";
    
    const rawType = String(raw.jobType || "").toLowerCase();
    if (titleLower.includes("intern") || rawType.includes("intern")) {
      jobType = "internship";
    } else if (titleLower.includes("contract") || rawType.includes("contract") || rawType.includes("temporary")) {
      jobType = "contract";
    } else if (titleLower.includes("part-time") || titleLower.includes("part time") || rawType.includes("part")) {
      jobType = "part-time";
    }

    let postedAtDate: Date | null = null;
    let dateConfidence: "exact" | "estimated" | "unknown" = "unknown";

    const candidateDateStr =
      raw.first_published_at ||
      raw.createdAt ||
      raw.publishedAt ||
      raw.releasedDate ||
      raw.created_at ||
      raw.published_at ||
      raw.postedOn ||
      raw.postedAt ||
      raw.updated_at;

    if (candidateDateStr) {
      const parsed = new Date(candidateDateStr);
      if (!isNaN(parsed.getTime())) {
        postedAtDate = parsed;
        dateConfidence = raw.dateConfidence || "exact";
      }
    }

    const city = raw.parsedLocation?.city || location.split(",")[0]?.trim() || null;
    const country = raw.parsedLocation?.countryCode === "IN" ? "India" : (location.split(",").pop()?.trim() || null);

    return {
      sourceJobId,
      sourceId: sourceJobId || dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: canonicalizeUrl(raw.url) || "",
      applyUrl,
      title,
      company,
      companyLogoUrl: null,
      location,
      city,
      country,
      isRemote: raw.parsedLocation ? raw.parsedLocation.remoteEligible : isRemote,
      jobType,
      experienceLevel,
      skills: extractedSkills,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryPeriod: null,
      description,
      descriptionHtml: `<p>${description}</p>`,
      postedAt: postedAtDate,
      dateConfidence,
      expiresAt: null,
      fetchedAt: new Date(),
      dedupeHash,
    };
  }
}
