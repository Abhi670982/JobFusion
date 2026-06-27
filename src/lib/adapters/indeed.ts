import { SourceAdapter, FetchQuery, UnifiedJob } from "./types";
import { extractSkills } from "@/lib/skills-extractor";
import crypto from "crypto";

export class IndeedAdapter implements SourceAdapter {
  source = "indeed" as const;

  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SERPAPI_KEY || "";
  }

  async fetchJobs(query: FetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "react";
    const location = query.location || "India";

    if (!this.apiKey) {
      console.warn("[Indeed Adapter] SERPAPI_KEY is not set. Returning empty list.");
      return [];
    }

    const url = `https://serpapi.com/search?engine=google_jobs&q=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&api_key=${this.apiKey}`;

    console.log(`[Indeed Adapter] Fetching Indeed jobs via SerpAPI: ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Indeed SerpAPI responded with status: ${response.status}`);
      }

      const data = await response.json();
      const results = data.jobs_results || [];

      // Filter results to only keep those coming from Indeed (via Indeed or Indeed.com)
      const indeedJobs = results.filter((job: any) => {
        const via = (job.via || "").toLowerCase();
        return via.includes("indeed");
      });

      console.log(`[Indeed Adapter] Found ${indeedJobs.length} indeed-specific jobs out of ${results.length} total Google Jobs results.`);
      return indeedJobs;
    } catch (error: any) {
      console.error(`[Indeed Adapter] Error fetching data:`, error.message);
      throw error;
    }
  }

  mapToUnified(raw: any): UnifiedJob {
    if (raw._isJobicy) {
      return this.mapJobicyToUnified(raw);
    }

    const title = (raw.title || "").trim();
    const company = (raw.company_name || "").trim();
    const location = (raw.location || "India").trim();

    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

    const description = raw.description || "";
    const extractedSkills = extractSkills(description).map(s => s.name.toLowerCase());

    let applyUrl: string | null = null;
    if (raw.apply_options && Array.isArray(raw.apply_options) && raw.apply_options.length > 0) {
      applyUrl = raw.apply_options[0].link || null;
    }

    const ext = raw.detected_extensions || {};
    const isRemote =
      location.toLowerCase().includes("remote") ||
      location.toLowerCase().includes("work from home") ||
      location.toLowerCase().includes("wfh") ||
      ext.remote === true;

    let jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null = null;
    const rawType = (ext.schedule_type || "").toLowerCase();
    if (rawType.includes("full")) jobType = "full-time";
    else if (rawType.includes("part")) jobType = "part-time";
    else if (rawType.includes("contract")) jobType = "contract";
    else if (rawType.includes("intern")) jobType = "internship";
    else if (rawType.includes("free") || rawType.includes("gig")) jobType = "freelance";

    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    let salaryCurrency: "INR" | "USD" | "GBP" | null = "INR";
    let salaryPeriod: "monthly" | "annual" | "hourly" | null = "annual";

    const rawSalary = ext.salary || "";
    if (rawSalary) {
      const cleanSalary = rawSalary.replace(/,/g, "");
      const nums = cleanSalary.match(/\d+/g);

      if (nums && nums.length > 0) {
        if (nums.length === 1) {
          salaryMin = parseInt(nums[0], 10);
          salaryMax = salaryMin;
        } else {
          salaryMin = parseInt(nums[0], 10);
          salaryMax = parseInt(nums[1], 10);
        }

        if (cleanSalary.includes("$")) {
          salaryCurrency = "USD";
          salaryMin = salaryMin * 83;
          if (salaryMax) salaryMax = salaryMax * 83;
        } else if (cleanSalary.includes("£")) {
          salaryCurrency = "GBP";
          salaryMin = salaryMin * 105;
          if (salaryMax) salaryMax = salaryMax * 105;
        }

        if (cleanSalary.includes("month")) {
          salaryPeriod = "monthly";
        } else if (cleanSalary.includes("hour")) {
          salaryPeriod = "hourly";
        }
      }
    }

    let postedAt: Date | null = new Date();
    const rawPosted = ext.posted_at || "";
    if (rawPosted) {
      const now = new Date();
      const numMatch = rawPosted.match(/\d+/);
      const val = numMatch ? parseInt(numMatch[0], 10) : 1;

      if (rawPosted.includes("hour")) {
        now.setHours(now.getHours() - val);
      } else if (rawPosted.includes("day")) {
        now.setDate(now.getDate() - val);
      } else if (rawPosted.includes("month")) {
        now.setMonth(now.getMonth() - val);
      }
      postedAt = now;
    }

    let city: string | null = null;
    let country: string | null = "India";
    if (location) {
      const parts = location.split(",").map((p: string) => p.trim());
      if (parts.length > 0) city = parts[0];
      if (parts.length > 1) country = parts[parts.length - 1];
    }

    let experienceLevel: "entry" | "mid" | "senior" | "lead" | null = null;
    const textToSearch = (title + " " + description).toLowerCase();
    if (textToSearch.includes("senior") || textToSearch.includes("sr.")) experienceLevel = "senior";
    else if (textToSearch.includes("lead") || textToSearch.includes("principal")) experienceLevel = "lead";
    else if (textToSearch.includes("junior") || textToSearch.includes("entry") || textToSearch.includes("intern")) experienceLevel = "entry";
    else experienceLevel = "mid";

    const plainDescription = description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    return {
      sourceId: raw.job_id || dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: raw.link || applyUrl || `https://www.indeed.com`,
      applyUrl,
      title,
      company,
      companyLogoUrl: raw.thumbnail || null,
      location,
      city,
      country,
      isRemote,
      jobType,
      experienceLevel,
      skills: extractedSkills,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryPeriod,
      description: plainDescription,
      descriptionHtml: raw.description ? `<div>${raw.description}</div>` : null,
      postedAt,
      expiresAt: null,
      fetchedAt: new Date(),
      dedupeHash,
    };
  }

  private mapJobicyToUnified(raw: any): UnifiedJob {
    const title = (raw.jobTitle || "").trim();
    const company = (raw.companyName || "").trim();
    const location = (raw.jobGeo || "Remote").trim();

    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

    const description = (raw.jobDescription || "").replace(/<[^>]+>/g, " ").trim();
    const extractedSkills = extractSkills(raw.jobDescription || "").map(s => s.name.toLowerCase());

    const isRemote = true; // Jobicy is a remote jobs directory

    let jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null = "full-time";
    if (raw.jobType && raw.jobType.length > 0) {
      const typeVal = raw.jobType[0].toLowerCase();
      if (typeVal.includes("part-time")) jobType = "part-time";
      else if (typeVal.includes("contract")) jobType = "contract";
      else if (typeVal.includes("internship")) jobType = "internship";
      else if (typeVal.includes("freelance")) jobType = "freelance";
    }

    let experienceLevel: "entry" | "mid" | "senior" | "lead" | null = "mid";
    const lvl = (raw.jobLevel || "").toLowerCase();
    if (lvl.includes("entry") || lvl.includes("junior")) experienceLevel = "entry";
    else if (lvl.includes("senior") || lvl.includes("lead")) experienceLevel = "senior";

    // Standard simulated Startup Salary
    const salaryMin = 1400000;
    const salaryMax = 2800000;

    return {
      sourceId: String(raw.id) || dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: raw.url || "https://www.indeed.com",
      applyUrl: raw.url || null,
      title,
      company,
      companyLogoUrl: raw.companyLogo || null,
      location,
      city: location.split(",")[0] || null,
      country: "India",
      isRemote,
      jobType,
      experienceLevel,
      skills: extractedSkills,
      salaryMin,
      salaryMax,
      salaryCurrency: "INR",
      salaryPeriod: "annual",
      description,
      descriptionHtml: raw.jobDescription || null,
      postedAt: raw.pubDate ? new Date(raw.pubDate) : new Date(),
      expiresAt: null,
      fetchedAt: new Date(),
      dedupeHash,
    };
  }
}
