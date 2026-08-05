import { BasePortalAdapter, PortalFetchQuery, PortalUnifiedJob } from "./base-adapter";
import { extractSkills } from "@/lib/skills-extractor";
import { parsePostedDate } from "@/lib/parse-posted-date";
import { sanitizeJobDescription, validateExternalUrl } from "../sanitizers/sanitizer";
import crypto from "crypto";

export class LinkedInPortalAdapter extends BasePortalAdapter {
  readonly source = "linkedin" as const;

  async fetchJobs(query: PortalFetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "software engineer";
    const location = query.location || "India";
    const page = query.page || 1;

    try {
      return await this.scrapeGuestApi(keyword, location, page);
    } catch (err: any) {
      this.logger.warn(`Guest API failed (${err.message}). Trying search page fallback...`, { portal: this.source });
      try {
        return await this.scrapeSearchPage(keyword, location, page);
      } catch (fallbackErr: any) {
        this.logger.warn(`Search page fallback failed (${fallbackErr.message}). Returning empty list.`, { portal: this.source });
        return [];
      }
    }
  }

  private async scrapeGuestApi(keyword: string, location: string, page: number): Promise<any[]> {
    const cheerio = require("cheerio");
    const start = (page - 1) * 25;
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&start=${start}&f_TPR=r604800`;

    this.logger.info(`Fetching via guest API (page ${page}, start ${start})`, { portal: this.source, url });

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) throw new Error(`LinkedIn guest API returned ${res.status}`);

    const html = await res.text();

    if (
      html.includes("captcha") ||
      html.includes("Cloudflare") ||
      html.includes("just a moment")
    ) {
      throw new Error("LinkedIn guest API blocked by CAPTCHA");
    }

    const $ = cheerio.load(html);
    const jobs: any[] = [];

    $("li").each((_: number, elem: any) => {
      const card = $(elem);
      const titleEl = card.find(".base-search-card__title");
      const companyEl = card.find(
        ".base-search-card__subtitle a, .base-search-card__subtitle"
      );
      const locationEl = card.find(".job-search-card__location");
      const linkEl = card.find("a.base-card__full-link");

      let timeEl = card.find("time").first();
      if (timeEl.length === 0) {
        timeEl = card
          .find(
            ".job-search-card__listdate, .job-search-card__listdate--new, .base-search-card__metadata time"
          )
          .first();
      }

      const title = titleEl.text().trim();
      const company = companyEl.text().trim().split("\n")[0].trim();
      const loc = locationEl.text().trim();
      const applyUrl = linkEl.attr("href") || "";
      const postedText =
        timeEl.length > 0
          ? timeEl.attr("datetime") || timeEl.text().trim()
          : "";

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

    this.logger.info(`Guest API returned ${jobs.length} jobs.`, { portal: this.source });
    return jobs;
  }

  private async scrapeSearchPage(keyword: string, location: string, page: number): Promise<any[]> {
    const cheerio = require("cheerio");
    const start = (page - 1) * 25;
    const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&start=${start}&f_TPR=r604800`;

    this.logger.info(`Fetching via search page (page ${page}, start ${start})`, { portal: this.source, url });

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) throw new Error(`LinkedIn search page returned ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs: any[] = [];

    $(".jobs-search__results-list li").each((_: number, el: any) => {
      const title = $(el).find(".base-search-card__title").text().trim();
      const company = $(el).find(".base-search-card__subtitle").text().trim();
      const loc = $(el).find(".job-search-card__location").text().trim();
      const applyUrl =
        $(el).find("a.base-card__full-link").attr("href") || "";
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

    this.logger.info(`Search page returned ${jobs.length} jobs.`, { portal: this.source });
    return jobs;
  }

  mapToUnified(raw: any): PortalUnifiedJob {
    const title = (raw.title || "").trim();
    const company = (raw.company || "").trim();
    const location = (raw.location || "Remote, India").trim();

    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto
      .createHash("sha256")
      .update(rawHashInput)
      .digest("hex");

    const rawDescription = `Job listing from LinkedIn: ${title} at ${company} located in ${location}.`;
    const description = sanitizeJobDescription(rawDescription);
    const extractedSkills = extractSkills(title + " " + description).map((s) =>
      s.name.toLowerCase()
    );

    const isRemote =
      location.toLowerCase().includes("remote") ||
      location.toLowerCase().includes("work from home") ||
      location.toLowerCase().includes("wfh");

    let sourceId = dedupeHash.substring(0, 12);
    if (raw.applyUrl) {
      const match = raw.applyUrl.match(/-(\d+)\?/);
      if (match && match[1]) sourceId = match[1];
    }

    let postedAtISO: string | null = null;
    if (raw.postedText) {
      const parsed = parsePostedDate(raw.postedText);
      if (parsed) {
        postedAtISO = parsed.timestamp.toISOString();
      }
    }

    const validatedApplyUrl = validateExternalUrl(raw.applyUrl) || "https://www.linkedin.com";

    return {
      sourceId,
      source: this.source,
      sourceUrl: validatedApplyUrl,
      applyUrl: validatedApplyUrl,
      title,
      company,
      logo: null,
      location,
      isRemote,
      employmentType: "full-time",
      experience:
        title.toLowerCase().includes("senior") ||
        title.toLowerCase().includes("sr.")
          ? "senior"
          : title.toLowerCase().includes("lead") ||
            title.toLowerCase().includes("principal")
          ? "lead"
          : title.toLowerCase().includes("junior") ||
            title.toLowerCase().includes("entry")
          ? "entry"
          : "mid",
      salary: "Not disclosed",
      salaryMin: null,
      salaryMax: null,
      description,
      postedDate: postedAtISO,
      skills: extractedSkills,
    };
  }
}
