import { BasePortalAdapter, PortalFetchQuery, PortalUnifiedJob } from "./base-adapter";
import { crawlIndeedViaApify } from "@/lib/apify-runner";
import { extractSkills } from "@/lib/skills-extractor";
import { fetchJobicyJobs, fetchRemotiveJobs } from "@/lib/adapters/aggregator-apis";
import { parsePostedDate } from "@/lib/parse-posted-date";
import { sanitizeJobDescription, validateExternalUrl } from "../sanitizers/sanitizer";
import crypto from "crypto";

/**
 * Indeed Portal Adapter
 * Primary:  SerpAPI (`SERPAPI_KEY`) Google Jobs engine
 * Fallback 1: Apify Indeed Jobs Scraper (`APIFY_TOKEN`)
 * Fallback 2: Jobicy & Remotive Aggregator feeds
 * Catches all errors gracefully without crashing the crawler pipeline.
 */
export class IndeedPortalAdapter extends BasePortalAdapter {
  readonly source = "indeed" as const;
  private apiKey: string;

  constructor() {
    super();
    this.apiKey = process.env.SERPAPI_KEY || "";
  }

  async fetchJobs(query: PortalFetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "react developer";
    const location = query.location || "India";
    const page = query.page || 1;

    // 1. Primary: SerpAPI Google Jobs engine
    if (this.apiKey) {
      const start = (page - 1) * 10;
      const url = `https://serpapi.com/search?engine=google_jobs&q=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&start=${start}&api_key=${this.apiKey}`;

      console.log(`[Indeed Adapter] Fetching via SerpAPI (page ${page}, start ${start}): ${url}`);

      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const results = data.jobs_results || [];

          // Keep indeed-specific or all Google Jobs results
          const indeedJobs = results.filter((job: any) => {
            const via = (job.via || "").toLowerCase();
            return via.includes("indeed") || via.includes("via linkedin") || via.includes("via ziprecruiter") || results.length < 5;
          });

          if (indeedJobs.length > 0) {
            console.log(`[Indeed Adapter] SerpAPI returned ${indeedJobs.length} jobs.`);
            return indeedJobs;
          }
        } else {
          console.warn(`[Indeed Adapter] SerpAPI returned status ${response.status}. Switching to Apify fallback...`);
        }
      } catch (serpErr: any) {
        console.warn(`[Indeed Adapter] SerpAPI fetch failed (${serpErr.message}). Switching to Apify fallback...`);
      }
    }

    // 2. Fallback 1: Apify Indeed Actor
    if (process.env.APIFY_TOKEN) {
      console.log(`[Indeed Adapter] Fetching via Apify Actor for "${keyword}"...`);
      try {
        const apifyJobs = await crawlIndeedViaApify({ keyword, location, maxItems: 40 });
        if (apifyJobs && apifyJobs.length > 0) {
          return apifyJobs;
        }
      } catch (apifyErr: any) {
        console.warn(`[Indeed Adapter] Apify fetch failed (${apifyErr.message}). Switching to remote feeds fallback...`);
      }
    }

    // 3. Fallback 2: Remote Aggregator feeds (Jobicy + Remotive)
    console.log("[Indeed Adapter] Falling back to Jobicy + Remotive remote feeds...");
    try {
      const [jobicy, remotive] = await Promise.all([
        fetchJobicyJobs(keyword),
        fetchRemotiveJobs(keyword),
      ]);
      const combined = [...jobicy, ...remotive];
      return combined.map((j) => ({ ...j, _isFallback: true }));
    } catch (fallbackErr: any) {
      console.error("[Indeed Adapter] All Indeed fetch mechanisms failed. Returning empty list gracefully:", fallbackErr.message);
      return [];
    }
  }

  mapToUnified(raw: any): PortalUnifiedJob {
    if (raw._isApify) {
      const title = (raw.title || "").trim();
      const company = (raw.company || "").trim();
      const location = (raw.location || "India").trim();

      const rawHashInput = `${title}${company}${location}`.toLowerCase();
      const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

      const isRemote =
        location.toLowerCase().includes("remote") ||
        location.toLowerCase().includes("work from home") ||
        location.toLowerCase().includes("wfh");

      const descText = typeof raw.description === "string" ? raw.description : typeof raw.description === "object" && raw.description ? JSON.stringify(raw.description) : "";

      const applyUrl = validateExternalUrl(raw.applyUrl) || `https://in.indeed.com`;

      return {
        sourceId: raw.sourceId || dedupeHash.substring(0, 12),
        source: this.source,
        sourceUrl: applyUrl,
        applyUrl,
        title,
        company,
        logo: null,
        location,
        isRemote,
        employmentType: "full-time",
        experience: title.toLowerCase().includes("senior") ? "senior" : "mid",
        salary: raw.salary || "Not disclosed",
        salaryMin: null,
        salaryMax: null,
        description: descText,
        postedDate: raw.postedText ? parsePostedDate(String(raw.postedText))?.timestamp || new Date() : new Date(),
        skills: descText ? extractSkills(descText).map((s) => s.name.toLowerCase()) : [],
      };
    }

    if (raw._isFallback) {
      const title = (raw.title || "").trim();
      const company = (raw.company || "").trim();
      const location = (raw.location || "Remote").trim();

      const rawHashInput = `${title}${company}${location}`.toLowerCase();
      const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

      const isRemote = raw.isRemote || location.toLowerCase().includes("remote");

      const targetUrl = raw.url || raw.applyUrl || `https://in.indeed.com/jobs?q=${encodeURIComponent(title)}`;

      return {
        sourceId: raw.id || dedupeHash.substring(0, 12),
        source: this.source,
        sourceUrl: targetUrl,
        applyUrl: targetUrl,
        title,
        company,
        logo: validateExternalUrl(raw.companyLogoUrl) || null,
        location,
        isRemote,
        employmentType: "full-time",
        experience: title.toLowerCase().includes("senior") ? "senior" : "mid",
        salary: "Not disclosed",
        salaryMin: raw.salaryMin || null,
        salaryMax: raw.salaryMax || null,
        description: (raw.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
        postedDate: raw.postedAt ? new Date(raw.postedAt) : null,
        skills: raw.description ? extractSkills(raw.description).map((s) => s.name.toLowerCase()) : [],
      };
    }

    const title = (raw.title || "").trim();
    const company = (raw.company_name || "").trim();
    const location = (raw.location || "India").trim();

    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

    const description = raw.description || "";
    const extractedSkills = extractSkills(description).map((s) => s.name.toLowerCase());

    let rawApply: string | null = null;
    if (raw.apply_options && Array.isArray(raw.apply_options) && raw.apply_options.length > 0) {
      rawApply = raw.apply_options[0].link || null;
    }

    const applyUrl = validateExternalUrl(rawApply || raw.link) || `https://www.indeed.com`;

    const ext = raw.detected_extensions || {};
    const isRemote =
      location.toLowerCase().includes("remote") ||
      location.toLowerCase().includes("work from home") ||
      location.toLowerCase().includes("wfh") ||
      ext.remote === true;

    let postedAt: Date | null = null;
    const rawPosted = raw.posted_at || ext.posted_at || "";
    if (rawPosted) {
      const parsed = parsePostedDate(rawPosted);
      if (parsed) postedAt = parsed.timestamp;
    }

    return {
      sourceId: raw.job_id || dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: applyUrl,
      applyUrl,
      title,
      company,
      logo: validateExternalUrl(raw.thumbnail) || null,
      location,
      isRemote,
      employmentType: "full-time",
      experience: title.toLowerCase().includes("senior") ? "senior" : "mid",
      salary: ext.salary || "Not disclosed",
      salaryMin: null,
      salaryMax: null,
      description: description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      postedDate: postedAt,
      skills: extractedSkills,
    };
  }
}
