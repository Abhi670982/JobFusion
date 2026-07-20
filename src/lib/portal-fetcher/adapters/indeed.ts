import { BasePortalAdapter, PortalFetchQuery, PortalUnifiedJob } from "./base-adapter";
import { extractSkills } from "@/lib/skills-extractor";
import { fetchJobicyJobs, fetchRemotiveJobs } from "@/lib/adapters/aggregator-apis";
import { parsePostedDate } from "@/lib/parse-posted-date";
import crypto from "crypto";

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

    if (!this.apiKey) {
      console.warn("[Indeed Portal Adapter] SERPAPI_KEY is not set. Checking environment compatibility for Puppeteer crawl...");
      
      const isServerless = process.env.VERCEL || process.env.NEXT_RUNTIME === "edge" || process.env.NODE_ENV === "production";
      if (isServerless) {
        console.warn("[Indeed Portal Adapter] Serverless environment detected. Puppeteer not supported. Falling back to Jobicy + Remotive...");
        try {
          const [jobicy, remotive] = await Promise.all([
            fetchJobicyJobs(keyword),
            fetchRemotiveJobs(keyword)
          ]);
          const combined = [...jobicy, ...remotive];
          return combined.map(j => ({ ...j, _isFallback: true }));
        } catch (err: any) {
          console.error("[Indeed Portal Adapter] Fallback aggregator fetch failed:", err.message);
          return [];
        }
      }

      // Local/dev environment: Run Puppeteer to crawl Indeed directly
      try {
        return await this.scrapeWithPuppeteer(keyword, location);
      } catch (err: any) {
        console.error("[Indeed Portal Adapter] Puppeteer crawl failed:", err.message);
        console.log("[Indeed Portal Adapter] Falling back to Jobicy + Remotive...");
        try {
          const [jobicy, remotive] = await Promise.all([
            fetchJobicyJobs(keyword),
            fetchRemotiveJobs(keyword)
          ]);
          const combined = [...jobicy, ...remotive];
          return combined.map(j => ({ ...j, _isFallback: true }));
        } catch (fallbackErr: any) {
          console.error("[Indeed Portal Adapter] Fallback aggregator fetch failed:", fallbackErr.message);
          return [];
        }
      }
    }

    const url = `https://serpapi.com/search?engine=google_jobs&q=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&api_key=${this.apiKey}`;

    console.log(`[Indeed Portal Adapter] Fetching Indeed jobs via SerpAPI: ${url}`);

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

      console.log(`[Indeed Portal Adapter] Found ${indeedJobs.length} indeed-specific jobs out of ${results.length} total Google Jobs results.`);
      return indeedJobs;
    } catch (error: any) {
      console.error(`[Indeed Portal Adapter] Error fetching data:`, error.message);
      throw error;
    }
  }

  mapToUnified(raw: any): PortalUnifiedJob {
    if (raw._isPuppeteerScraped) {
      const title = raw.title;
      const company = raw.company;
      const location = raw.location || "Remote, India";

      const rawHashInput = `${title}${company}${location}`.toLowerCase();
      const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

      const isRemote =
        location.toLowerCase().includes("remote") ||
        location.toLowerCase().includes("work from home") ||
        location.toLowerCase().includes("wfh");

      let postedAt: Date | null = null;
      if (raw.postedText) {
        const parsed = parsePostedDate(raw.postedText);
        if (parsed) {
          postedAt = parsed.timestamp;
        }
      }

      return {
        sourceId: raw.jk || dedupeHash.substring(0, 12),
        source: this.source,
        sourceUrl: raw.applyUrl || `https://in.indeed.com`,
        applyUrl: raw.applyUrl || null,
        title,
        company,
        logo: null,
        location,
        isRemote,
        employmentType: "full-time",
        experience: title.toLowerCase().includes("senior") ? "senior" : "mid",
        salary: "Not disclosed",
        salaryMin: null,
        salaryMax: null,
        description: raw.description || "",
        postedDate: postedAt,
        skills: raw.description ? extractSkills(raw.description).map(s => s.name.toLowerCase()) : [],
      };
    }

    if (raw._isFallback) {
      const title = (raw.title || "").trim();
      const company = (raw.company || "").trim();
      const location = (raw.location || "Remote").trim();

      const rawHashInput = `${title}${company}${location}`.toLowerCase();
      const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

      const isRemote = raw.isRemote || location.toLowerCase().includes("remote");

      let employmentType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null = "full-time";
      const rawType = String(raw.jobType || "").toLowerCase();
      if (rawType.includes("part")) employmentType = "part-time";
      else if (rawType.includes("contract")) employmentType = "contract";
      else if (rawType.includes("intern")) employmentType = "internship";
      else if (rawType.includes("free") || rawType.includes("gig")) employmentType = "freelance";

      const salaryString = raw.salaryMin && raw.salaryMax
        ? `₹${Math.round(raw.salaryMin / 100000)}L – ₹${Math.round(raw.salaryMax / 100000)}L`
        : "Not disclosed";

      const searchTerms = `${title} ${company}`;
      const indeedUrl = `https://in.indeed.com/jobs?q=${encodeURIComponent(searchTerms)}`;

      return {
        sourceId: raw.id || dedupeHash.substring(0, 12),
        source: this.source,
        sourceUrl: indeedUrl,
        applyUrl: indeedUrl,
        title,
        company,
        logo: raw.companyLogoUrl || null,
        location,
        isRemote,
        employmentType,
        experience: title.toLowerCase().includes("senior") ? "senior" : "mid",
        salary: salaryString,
        salaryMin: raw.salaryMin || null,
        salaryMax: raw.salaryMax || null,
        description: (raw.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
        postedDate: (() => {
          if (!raw.postedAt) return null;
          const parsed = parsePostedDate(raw.postedAt);
          return parsed ? parsed.timestamp : null;
        })(),
        skills: raw.description ? extractSkills(raw.description).map(s => s.name.toLowerCase()) : [],
      };
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

    let employmentType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null = null;
    const rawType = (ext.schedule_type || "").toLowerCase();
    if (rawType.includes("full")) employmentType = "full-time";
    else if (rawType.includes("part")) employmentType = "part-time";
    else if (rawType.includes("contract")) employmentType = "contract";
    else if (rawType.includes("intern")) employmentType = "internship";
    else if (rawType.includes("free") || rawType.includes("gig")) employmentType = "freelance";

    let salaryMin: number | null = null;
    let salaryMax: number | null = null;

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
          salaryMin = salaryMin * 83;
          if (salaryMax) salaryMax = salaryMax * 83;
        } else if (cleanSalary.includes("£")) {
          salaryMin = salaryMin * 105;
          if (salaryMax) salaryMax = salaryMax * 105;
        }
      }
    }

    let postedAt: Date | null = null;
    const rawPosted = raw.posted_at || ext.posted_at || "";
    if (rawPosted) {
      const parsed = parsePostedDate(rawPosted);
      if (parsed) {
        postedAt = parsed.timestamp;
      }
    }

    let experience: "entry" | "mid" | "senior" | "lead" | null = null;
    const textToSearch = (title + " " + description).toLowerCase();
    if (textToSearch.includes("senior") || textToSearch.includes("sr.")) experience = "senior";
    else if (textToSearch.includes("lead") || textToSearch.includes("principal")) experience = "lead";
    else if (textToSearch.includes("junior") || textToSearch.includes("entry") || textToSearch.includes("intern")) experience = "entry";
    else experience = "mid";

    const salaryString = salaryMin && salaryMax
      ? `₹${Math.round(salaryMin / 100000)}L – ₹${Math.round(salaryMax / 100000)}L`
      : "Not disclosed";

    return {
      sourceId: raw.job_id || dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: raw.link || applyUrl || `https://www.indeed.com`,
      applyUrl,
      title,
      company,
      logo: raw.thumbnail || null,
      location,
      isRemote,
      employmentType,
      experience,
      salary: salaryString,
      salaryMin,
      salaryMax,
      description: description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      postedDate: postedAt,
      skills: extractedSkills,
    };
  }

  private async scrapeWithPuppeteer(keyword: string, location: string): Promise<any[]> {
    const { withPage } = await import("@/lib/browser-pool");
    const url = `https://in.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}&f_TPR=r86400&fromage=1&sort=date`;

    console.log(`[Indeed Portal Adapter] Launching Puppeteer to scrape Indeed: ${url}`);

    return withPage(async (page) => {
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      console.log(`[Indeed Portal Adapter] Navigating to Indeed search...`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });

      const pageTitle = await page.title();
      if (pageTitle.includes("Security Check") || pageTitle.includes("CAPTCHA") || pageTitle.includes("just a moment")) {
        throw new Error("Indeed crawl blocked by Cloudflare challenge");
      }

      console.log(`[Indeed Portal Adapter] Scraped page successfully. Extracting cards...`);
      const jobs = await page.evaluate(() => {
        const cards = document.querySelectorAll(".job_seen_beacon");
        const list: any[] = [];

        cards.forEach((card) => {
          const titleEl = card.querySelector("a.jcs-JobTitle");
          const companyEl = card.querySelector('[data-testid="company-name"]');
          const locationEl = card.querySelector('[data-testid="text-location"]');
          const snippetEl = card.querySelector(".job-snippet, .jobCardProps");
          const dateEl = card.querySelector(".date, .myJobsState");

          if (titleEl && companyEl) {
            const href = titleEl.getAttribute("href") || "";
            let jk = "";
            const match = href.match(/jk=([^&]+)/);
            if (match && match[1]) {
              jk = match[1];
            } else {
              const id = titleEl.getAttribute("id") || "";
              if (id.startsWith("job_")) {
                jk = id.substring(4);
              }
            }

            const applyUrl = jk ? `https://in.indeed.com/viewjob?jk=${jk}` : `https://in.indeed.com${href}`;

            list.push({
              title: titleEl.textContent?.trim() || "",
              company: companyEl.textContent?.trim() || "",
              location: locationEl?.textContent?.trim() || "Remote, India",
              jk: jk,
              applyUrl: applyUrl,
              description: snippetEl?.textContent?.trim() || "",
              postedText: dateEl?.textContent?.trim() || "",
              _isPuppeteerScraped: true,
            });
          }
        });

        return list;
      });

      console.log(`[Indeed Portal Adapter] Scraped ${jobs.length} jobs directly from Indeed.`);
      return jobs;
    });
  }
}
