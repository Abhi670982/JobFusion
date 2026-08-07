import { BasePortalAdapter, PortalFetchQuery, PortalUnifiedJob } from "./base-adapter";
import { crawlFounditViaApify } from "@/lib/apify-runner";
import { fetchWithBrightDataProxy, inspectHtmlForAntiBot } from "@/lib/brightdata-proxy";
import { extractSkills } from "@/lib/skills-extractor";
import { parsePostedDate } from "@/lib/parse-posted-date";
import crypto from "crypto";

/**
 * Foundit Portal Adapter (formerly Monster India)
 * Primary: Apify Foundit Actor (`APIFY_TOKEN`)
 * Secondary: Direct HTML card scraping via Bright Data Proxy (`BRIGHTDATA_API_KEY`)
 * Zero Yahoo dependency! Fails loudly with clear diagnostics on anti-bot blocks.
 */
export class FounditPortalAdapter extends BasePortalAdapter {
  readonly source = "foundit" as const;

  async fetchJobs(query: PortalFetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "software engineer";
    const location = query.location || "India";
    const page = query.page || 1;

    // 1. Try Primary: Apify Foundit Actor
    if (process.env.APIFY_TOKEN) {
      try {
        console.log(`[Foundit Adapter] Sourcing jobs via Apify Actor for keyword: "${keyword}"`);
        const apifyJobs = await crawlFounditViaApify({ keyword, location, maxItems: 30 });
        if (apifyJobs && apifyJobs.length > 0) {
          console.log(`[Foundit Adapter Diagnostics] Provider: Apify, Jobs Parsed: ${apifyJobs.length}`);
          return apifyJobs;
        }
      } catch (apifyErr: any) {
        console.warn(`[Foundit Adapter Warning] Apify actor failed (${apifyErr.message}). Switching to Bright Data Proxy fallback...`);
      }
    }

    // 2. Secondary: Direct HTML card fetch via Bright Data Proxy
    const start = (page - 1) * 15;
    const url = `https://www.foundit.in/seeker/job-search?query=${encodeURIComponent(keyword)}&locations=${encodeURIComponent(location)}&start=${start}`;

    console.log(`[Foundit Adapter] Fetching page ${page} via Bright Data Proxy: ${url}`);

    try {
      const res = await fetchWithBrightDataProxy(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP_STATUS_${res.status}: Foundit returned status ${res.status}`);
      }

      const html = await res.text();
      const antiBot = inspectHtmlForAntiBot(html);
      if (antiBot.isBlocked) {
        console.error(`[Foundit Adapter Anti-Bot Blocked] ${antiBot.reason} detected on ${url} (HTML Size: ${html.length} bytes)`);
        throw new Error(`ANTI_BOT_BLOCKED: ${antiBot.reason}`);
      }

      const cheerio = require("cheerio");
      const $ = cheerio.load(html);
      const jobs: any[] = [];

      $(".cardCard, .job-apply-card, article").each((_: number, elem: any) => {
        const title = $(elem).find(".jobTitle, .title, h3").text().trim();
        const company = $(elem).find(".companyName, .company, .subtitle").text().trim();
        const loc = $(elem).find(".location, .loc").text().trim();
        const applyUrl = $(elem).find("a").attr("href") || "";
        const posted = $(elem).find(".postedDate, .posted").text().trim();

        if (title && (company || applyUrl)) {
          jobs.push({
            title,
            company: company || "Foundit Employer",
            location: loc || location,
            applyUrl: applyUrl.startsWith("http") ? applyUrl : `https://www.foundit.in${applyUrl}`,
            postedText: posted || "Recently listed",
            _isDirect: true,
          });
        }
      });

      console.log(`[Foundit Adapter Diagnostics] Provider: BrightData Proxy, HTML Size: ${html.length} bytes, Jobs Parsed: ${jobs.length}`);
      return jobs;
    } catch (err: any) {
      console.error(`[Foundit Adapter Error] Execution failed: ${err.message}`);
      throw err;
    }
  }

  mapToUnified(raw: any): PortalUnifiedJob {
    const title = (raw.title || "").trim();
    const company = (raw.company || "").trim();
    const location = (raw.location || "India").trim();

    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

    const descText = typeof raw.description === "string" ? raw.description : "";
    const extractedSkills = extractSkills(title + " " + descText).map((s) => s.name.toLowerCase());

    const isRemote =
      location.toLowerCase().includes("remote") ||
      location.toLowerCase().includes("work from home") ||
      location.toLowerCase().includes("wfh");

    let postedAt: Date = new Date();
    if (raw.postedText) {
      const parsed = parsePostedDate(String(raw.postedText));
      if (parsed) postedAt = parsed.timestamp;
    }

    return {
      sourceId: raw.sourceId || dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: raw.applyUrl || `https://www.foundit.in`,
      applyUrl: raw.applyUrl || null,
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
      description: descText || `Job listing from Foundit: ${title} at ${company}.`,
      postedDate: postedAt,
      skills: extractedSkills,
    };
  }
}
