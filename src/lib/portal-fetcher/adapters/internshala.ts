import { BasePortalAdapter, PortalFetchQuery, PortalUnifiedJob } from "./base-adapter";
import { extractSkills } from "@/lib/skills-extractor";
import { parsePostedDate } from "@/lib/parse-posted-date";
import crypto from "crypto";

function sanitizeText(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function validateExternalUrl(urlStr: string | null | undefined): string | null {
  if (!urlStr || typeof urlStr !== "string") return null;
  const trimmed = urlStr.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return null;
}

export class InternshalaPortalAdapter extends BasePortalAdapter {
  readonly source = "internshala" as const;

  async fetchJobs(query: PortalFetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "react developer";
    const page = query.page || 1;
    const url = page > 1 
      ? `https://internshala.com/jobs/keyword-${encodeURIComponent(keyword)}/page-${page}/`
      : `https://internshala.com/jobs/keyword-${encodeURIComponent(keyword)}/`;

    try {
      return await this.scrapeWithCheerio(url);
    } catch (cheerioErr: any) {
      console.warn(`[Internshala Adapter] Cheerio scrape failed: ${cheerioErr.message}`);
      return [];
    }
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

    const applyUrl = raw.applyUrl || "https://internshala.com";

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
      employmentType: "internship",
      experience: "entry",
      salary: raw.salary || "Not disclosed",
      salaryMin: null,
      salaryMax: null,
      description: sanitizeText(description),
      postedDate: postedAt ? postedAt.toISOString() : null,
      skills: extractedSkills,
    };
  }

  private async scrapeWithCheerio(url: string): Promise<any[]> {
    const cheerio = require("cheerio");
    const { fetchWithBrightDataProxy } = await import("@/lib/brightdata-proxy");
    const res = await fetchWithBrightDataProxy(url);

    if (!res.ok) throw new Error(`Internshala returned status ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs: any[] = [];

    $(".individual_internship").each((_: number, elem: any) => {
      const card = $(elem);
      const titleEl = card.find(".job-internship-name, .heading_4_5, h3.heading_4_5");
      const companyEl = card.find(".company-name, .heading_6, a.link_display_like_text");
      const locationEl = card.find(".location_link, #location_names, .locations");
      const salaryEl = card.find(".stipend, .salary");

      let salary = "Not disclosed";
      if (salaryEl.length > 0) {
        salary = salaryEl.text().trim().replace(/\s+/g, " ");
      }

      let postedEl = card.find(".status-container, .posted_by, .status-inactive");
      if (postedEl.length === 0) {
        postedEl = card.find("span, div").filter((_: number, el: any) => {
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

    return jobs;
  }
}
