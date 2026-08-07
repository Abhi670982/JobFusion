import { BasePortalAdapter, PortalFetchQuery, PortalUnifiedJob } from "./base-adapter";
import { crawlLinkedInViaApify } from "@/lib/apify-runner";
import { fetchWithBrightDataProxy } from "@/lib/brightdata-proxy";
import { extractSkills } from "@/lib/skills-extractor";
import { parsePostedDate } from "@/lib/parse-posted-date";
import crypto from "crypto";

export class LinkedInPortalAdapter extends BasePortalAdapter {
  readonly source = "linkedin" as const;

  async fetchJobs(query: PortalFetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "software engineer";
    const location = query.location || "India";
    const page = query.page || 1;

    if (process.env.APIFY_TOKEN) {
      try {
        console.log(`[LinkedIn Adapter] Fetching via Apify Actor (keyword: "${keyword}", location: "${location}")`);
        const apifyJobs = await crawlLinkedInViaApify({
          keyword,
          location,
          maxItems: 50,
        });
        if (apifyJobs && apifyJobs.length > 0) {
          return apifyJobs;
        }
      } catch (err: any) {
        console.warn(`[LinkedIn Adapter] Apify execution failed (${err.message}). Switching to Bright Data Proxy fallback...`);
      }
    }

    try {
      return await this.scrapeGuestApiWithProxy(keyword, location, page);
    } catch (err: any) {
      console.warn(`[LinkedIn Adapter] Guest API fallback failed (${err.message}). Trying search page with Bright Data Proxy...`);
      try {
        return await this.scrapeSearchPageWithProxy(keyword, location, page);
      } catch (fallbackErr: any) {
        console.warn(`[LinkedIn Adapter] Search page fallback also failed (${fallbackErr.message}). Returning empty list.`);
        return [];
      }
    }
  }

  private async scrapeGuestApiWithProxy(keyword: string, location: string, page: number): Promise<any[]> {
    const cheerio = require("cheerio");
    const start = (page - 1) * 25;
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&start=${start}&f_TPR=r604800`;

    const res = await fetchWithBrightDataProxy(url);
    if (!res.ok) throw new Error(`LinkedIn guest API returned ${res.status}`);

    const html = await res.text();
    if (html.includes("captcha") || html.includes("Cloudflare")) {
      throw new Error("LinkedIn guest API blocked by CAPTCHA");
    }

    const $ = cheerio.load(html);
    const jobs: any[] = [];

    $("li").each((_: number, elem: any) => {
      const card = $(elem);
      const title = card.find(".base-search-card__title").text().trim();
      const company = card.find(".base-search-card__subtitle a, .base-search-card__subtitle").text().trim().split("\n")[0].trim();
      const loc = card.find(".job-search-card__location").text().trim();
      const applyUrl = card.find("a.base-card__full-link").attr("href") || "";
      const timeEl = card.find("time").first();
      const postedText = timeEl.length > 0 ? timeEl.attr("datetime") || timeEl.text().trim() : "";

      if (title && company) {
        jobs.push({
          title,
          company,
          location: loc,
          applyUrl,
          postedText,
          _isGuestScraped: true,
        });
      }
    });

    return jobs;
  }

  private async scrapeSearchPageWithProxy(keyword: string, location: string, page: number): Promise<any[]> {
    const cheerio = require("cheerio");
    const start = (page - 1) * 25;
    const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&start=${start}&f_TPR=r604800`;

    const res = await fetchWithBrightDataProxy(url);
    if (!res.ok) throw new Error(`LinkedIn search page returned ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs: any[] = [];

    $(".jobs-search__results-list li").each((_: number, el: any) => {
      const title = $(el).find(".base-search-card__title").text().trim();
      const company = $(el).find(".base-search-card__subtitle").text().trim();
      const loc = $(el).find(".job-search-card__location").text().trim();
      const applyUrl = $(el).find("a.base-card__full-link").attr("href") || "";
      const posted = $(el).find("time").attr("datetime") || "";

      if (title && applyUrl) {
        jobs.push({
          title,
          company,
          location: loc,
          applyUrl,
          postedText: posted,
          _isGuestScraped: true,
        });
      }
    });

    return jobs;
  }

  mapToUnified(raw: any): PortalUnifiedJob {
    const title = (raw.title || "").trim();
    const company = (raw.company || "").trim();
    const location = (raw.location || "Remote, India").trim();

    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

    const description = raw.description || `Job listing from LinkedIn: ${title} at ${company} located in ${location}.`;
    const extractedSkills = extractSkills(title + " " + description).map((s) => s.name.toLowerCase());

    const isRemote =
      location.toLowerCase().includes("remote") ||
      location.toLowerCase().includes("work from home") ||
      location.toLowerCase().includes("wfh");

    let sourceId = dedupeHash.substring(0, 12);
    if (raw.applyUrl) {
      const match = raw.applyUrl.match(/-(\d+)\?/);
      if (match && match[1]) sourceId = match[1];
    } else if (raw.sourceId) {
      sourceId = raw.sourceId;
    }

    let postedAt: Date | null = new Date();
    if (raw.postedText) {
      const parsed = parsePostedDate(String(raw.postedText));
      if (parsed) postedAt = parsed.timestamp;
    }

    return {
      sourceId,
      source: this.source,
      sourceUrl: raw.applyUrl || "https://www.linkedin.com",
      applyUrl: raw.applyUrl || null,
      title,
      company,
      logo: null,
      location,
      isRemote,
      employmentType: (raw.jobType || "full-time") as any,
      experience:
        title.toLowerCase().includes("senior") ? "senior" :
        title.toLowerCase().includes("lead") ? "lead" :
        title.toLowerCase().includes("junior") ? "entry" : "mid",
      salary: raw.salary || "Not disclosed",
      salaryMin: null,
      salaryMax: null,
      description,
      postedDate: postedAt ? postedAt.toISOString() : null,
      skills: extractedSkills,
    };
  }
}
