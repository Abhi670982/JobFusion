import { BasePortalAdapter, PortalFetchQuery, PortalUnifiedJob } from "./base-adapter";
import { crawlIndeedViaApify } from "@/lib/apify-runner";
import { fetchWithBrightDataProxy } from "@/lib/brightdata-proxy";
import { extractSkills } from "@/lib/skills-extractor";
import { parsePostedDate } from "@/lib/parse-posted-date";
import crypto from "crypto";

function validateExternalUrl(urlStr: string | null | undefined): string | null {
  if (!urlStr || typeof urlStr !== "string") return null;
  const trimmed = urlStr.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return null;
}

export class IndeedPortalAdapter extends BasePortalAdapter {
  readonly source = "indeed" as const;

  async fetchJobs(query: PortalFetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "software engineer";
    const location = query.location || "India";
    const page = query.page || 1;

    // 1. Try Primary: SerpAPI Google Jobs
    const serpApiKey = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY;
    if (serpApiKey) {
      try {
        console.log(`[Indeed Adapter] Fetching via SerpAPI (keyword: "${keyword}")`);
        const start = (page - 1) * 10;
        const serpUrl = `https://serpapi.com/search?engine=google_jobs&q=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&start=${start}&api_key=${serpApiKey}`;
        const res = await fetch(serpUrl);
        if (res.ok) {
          const data = await res.json();
          const jobs = (data.jobs_results || []).map((j: any) => ({
            title: j.title,
            company: j.company_name,
            location: j.location,
            applyUrl: j.related_links?.[0]?.link || j.share_link || "",
            description: j.description || "",
            postedText: j.detected_extensions?.posted_at || "Recently listed",
            salary: j.detected_extensions?.salary || "Not disclosed",
            thumbnail: j.thumbnail,
            sourceId: j.job_id || String(Math.random()),
            _isSerpApi: true,
          }));
          if (jobs.length > 0) return jobs;
        }
      } catch (serpErr: any) {
        console.warn(`[Indeed Adapter] SerpAPI fetch failed (${serpErr.message}). Switching to Apify fallback...`);
      }
    }

    // 2. Try Secondary: Apify Indeed Jobs Scraper
    if (process.env.APIFY_TOKEN) {
      try {
        console.log(`[Indeed Adapter] Fetching via Apify Actor for "${keyword}"...`);
        const apifyJobs = await crawlIndeedViaApify({ keyword, location, maxItems: 40 });
        if (apifyJobs && apifyJobs.length > 0) {
          return apifyJobs;
        }
      } catch (apifyErr: any) {
        console.warn(`[Indeed Adapter] Apify fetch failed (${apifyErr.message}). Switching to remote feeds fallback...`);
      }
    }

    // 3. Fallback: Remote Feeds
    try {
      console.log(`[Indeed Adapter] Falling back to Jobicy + Remotive remote feeds...`);
      const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=20&tag=${encodeURIComponent(keyword)}`);
      if (res.ok) {
        const data = await res.json();
        return (data.jobs || []).map((j: any) => ({
          title: j.jobTitle,
          company: j.companyName,
          location: j.jobGeo || location,
          applyUrl: j.url,
          description: j.jobDescription || "",
          postedText: j.pubDate || "Recently listed",
          salary: j.annualSalaryMin ? `$${j.annualSalaryMin} - $${j.annualSalaryMax}` : "Not disclosed",
          thumbnail: j.companyLogo,
          sourceId: String(j.id),
          _isRemoteFeed: true,
        }));
      }
    } catch (feedErr: any) {
      console.warn(`[Indeed Adapter] Remote feed fallback failed (${feedErr.message}). Returning empty list.`);
    }

    return [];
  }

  mapToUnified(raw: any): PortalUnifiedJob {
    const title = (raw.title || "").trim();
    const company = (raw.company || "").trim();
    const location = (raw.location || "Remote").trim();

    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

    const description = typeof raw.description === "string" ? raw.description : "";
    const extractedSkills = extractSkills(title + " " + description).map((s) => s.name.toLowerCase());

    const isRemote =
      location.toLowerCase().includes("remote") ||
      location.toLowerCase().includes("work from home") ||
      location.toLowerCase().includes("wfh");

    let postedAt: Date | null = new Date();
    if (raw.postedText) {
      const parsed = parsePostedDate(String(raw.postedText));
      if (parsed) postedAt = parsed.timestamp;
    }

    const applyUrl = raw.applyUrl || "https://in.indeed.com";

    return {
      sourceId: raw.sourceId || dedupeHash.substring(0, 12),
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
      salary: raw.salary || "Not disclosed",
      salaryMin: null,
      salaryMax: null,
      description: description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      postedDate: postedAt ? postedAt.toISOString() : null,
      skills: extractedSkills,
    };
  }
}
