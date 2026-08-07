import { BasePortalAdapter, PortalFetchQuery, PortalUnifiedJob } from "./base-adapter";
import { extractSkills } from "@/lib/skills-extractor";
import { parsePostedDate } from "@/lib/parse-posted-date";
import { sanitizeJobDescription, validateExternalUrl } from "../sanitizers/sanitizer";
import crypto from "crypto";

export class InternshalaPortalAdapter extends BasePortalAdapter {
  readonly source = "internshala" as const;

  async fetchJobs(query: PortalFetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "react developer";
    const page = query.page || 1;
    const url = page > 1 
      ? `https://internshala.com/jobs/keyword-${encodeURIComponent(keyword)}/page-${page}/`
      : `https://internshala.com/jobs/keyword-${encodeURIComponent(keyword)}/`;

    this.logger.info(`Starting scrape (page ${page}): ${url}`, { portal: this.source });

    try {
      return await this.scrapeWithCheerio(url);
    } catch (cheerioErr: any) {
      this.logger.warn(`Cheerio scrape failed: ${cheerioErr.message}`, { portal: this.source });
      return [];
    }
  }

  mapToUnified(raw: any): PortalUnifiedJob {
    const title = (raw.title || "").trim();
    const company = (raw.company || "").trim();
    const location = (raw.location || "Remote").trim();

    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

    const rawDesc = `Apply to the role of ${title} at ${company} in ${location}. Stipend/Salary details: ${raw.salary || "Not disclosed"}.`;
    const description = sanitizeJobDescription(rawDesc);
    const extractedSkills = extractSkills(description).map(s => s.name.toLowerCase());

    const isRemote =
      location.toLowerCase().includes("remote") ||
      location.toLowerCase().includes("work from home") ||
      location.toLowerCase().includes("wfh");

    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    const rawSalary = raw.salary || "";

    if (rawSalary) {
      const cleanSalary = rawSalary.replace(/,/g, "").toLowerCase();
      const nums = cleanSalary.match(/\d+/g);
      if (nums && nums.length > 0) {
        let min = parseInt(nums[0], 10);
        let max = nums.length > 1 ? parseInt(nums[1], 10) : min;

        if (cleanSalary.includes("month") || cleanSalary.includes("/pm") || min < 100000) {
          min *= 12;
          max *= 12;
        }

        salaryMin = min;
        salaryMax = max;
      }
    }

    let postedAtISO: string | null = null;
    if (raw.postedText) {
      const parsed = parsePostedDate(raw.postedText);
      if (parsed) postedAtISO = parsed.timestamp.toISOString();
    }

    const applyUrl = validateExternalUrl(raw.applyUrl) || "https://internshala.com";

    return {
      sourceId: dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: applyUrl,
      applyUrl,
      title,
      company,
      logo: null,
      location,
      isRemote,
      employmentType: title.toLowerCase().includes("intern") ? "internship" : "full-time",
      experience: "entry",
      salary: rawSalary || "Not disclosed",
      salaryMin,
      salaryMax,
      description,
      postedDate: postedAtISO,
      skills: extractedSkills,
    };
  }

  private async scrapeWithCheerio(url: string): Promise<any[]> {
    const cheerio = require("cheerio");

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`Cheerio fetch failed with status: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const pageTitle = $("title").text().toLowerCase();
    if (pageTitle.includes("cloudflare") || pageTitle.includes("captcha") || pageTitle.includes("just a moment")) {
      throw new Error("CAPTCHA detected on Internshala (Cheerio fetch)");
    }

    const jobs: any[] = [];

    $(".individual_internship").each((_: number, elem: any) => {
      const card = $(elem);
      const titleEl = card.find(".job-title-href, .profile a, .job-title-container a, .heading_4_5 a").first();
      const companyEl = card.find(".company-name, .heading_6 a, .company_name a").first();
      const locationEl = card.find(".locations span, .location_link, #location_names").first();
      
      let salary = "Not disclosed";
      const stipendEl = card.find(".stipend, .salary_container").first();
      if (stipendEl.length > 0) {
        salary = stipendEl.text().trim();
      } else {
        const salaryItem = card.find(".ic-16-money").parent();
        if (salaryItem.length > 0) {
          salary = salaryItem.find("span.desktop, span").first().text().trim();
        }
      }
      
      let postedEl = card.find(".status-success, .status-info, .status-inactive, .status-warning, .status-danger, .status-default, .status-secondary, .status-muted, .posted_by_container, .status-badge").first();
      
      if (postedEl.length === 0) {
        postedEl = card.find("div, span, p").filter((_: any, el: any) => {
          const text = $(el).text().trim();
          return text.toLowerCase().includes("posted");
        }).first();
      }
      
      const postedText = postedEl.length > 0 ? postedEl.text().trim() : "";
      const relativeHref = titleEl.attr("href") || "";
      const applyUrl = relativeHref.startsWith("http") ? relativeHref : `https://internshala.com${relativeHref}`;

      if (titleEl.length > 0 && companyEl.length > 0) {
        jobs.push({
          title: titleEl.text().trim(),
          company: companyEl.text().trim(),
          location: locationEl.text().trim() || "Remote",
          salary: salary,
          applyUrl: applyUrl,
          postedText: postedText,
        });
      }
    });

    this.logger.info(`Scraped ${jobs.length} jobs via Cheerio from Internshala.`, { portal: this.source });
    return jobs;
  }
}
