import { BasePortalAdapter, PortalFetchQuery, PortalUnifiedJob } from "./base-adapter";
import { crawlNaukriViaApify } from "@/lib/apify-runner";
import { fetchWithBrightDataProxy, inspectHtmlForAntiBot } from "@/lib/brightdata-proxy";
import { extractSkills } from "@/lib/skills-extractor";
import { parsePostedDate } from "@/lib/parse-posted-date";
import crypto from "crypto";

export class NaukriPortalAdapter extends BasePortalAdapter {
  readonly source = "naukri" as const;

  async fetchJobs(query: PortalFetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "software engineer";
    const location = query.location || "India";
    const page = query.page || 1;

    if (process.env.APIFY_TOKEN) {
      try {
        console.log(`[Naukri Adapter] Sourcing jobs via Apify Actor for keyword: "${keyword}"`);
        const apifyJobs = await crawlNaukriViaApify({ keyword, location, maxItems: 30 });
        if (apifyJobs && apifyJobs.length > 0) {
          return apifyJobs;
        }
      } catch (apifyErr: any) {
        console.warn(`[Naukri Adapter Warning] Apify actor failed (${apifyErr.message}). Switching to Bright Data Proxy fallback...`);
      }
    }

    const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const url = page === 1
      ? `https://www.naukri.com/${slug}-jobs-in-india`
      : `https://www.naukri.com/${slug}-jobs-in-india-${page}`;

    try {
      const res = await fetchWithBrightDataProxy(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP_STATUS_${res.status}: Naukri returned status ${res.status}`);
      }

      const html = await res.text();
      const antiBot = inspectHtmlForAntiBot(html);
      if (antiBot.isBlocked) {
        throw new Error(`ANTI_BOT_BLOCKED: ${antiBot.reason}`);
      }

      const cheerio = require("cheerio");
      const $ = cheerio.load(html);
      const jobs: any[] = [];

      const scripts = $("script").toArray();
      for (const script of scripts) {
        const text = $(script).html() || "";
        if (text.includes("window._INITIAL_STATE")) {
          const match = text.match(/window\._INITIAL_STATE\s*=\s*(\{.*?\});/s);
          if (match && match[1]) {
            try {
              const state = JSON.parse(match[1]);
              const rawJobs = state?.noTuple?.jobDetails || state?.jobDetails || [];
              for (const j of rawJobs) {
                if (j.title && (j.companyName || j.company)) {
                  jobs.push({
                    title: j.title,
                    company: j.companyName || j.company,
                    location: j.placeholders?.find((p: any) => p.type === "location")?.label || location,
                    applyUrl: j.staticUrl ? `https://www.naukri.com${j.staticUrl}` : "",
                    postedText: j.footerPlaceholder || "Recently listed",
                    salary: j.placeholders?.find((p: any) => p.type === "salary")?.label || "Not disclosed",
                    description: j.jobDescription || "",
                    sourceId: j.jobId || String(Math.random()),
                    _isDirect: true,
                  });
                }
              }
            } catch (err: any) {
              console.warn("[Naukri Adapter JSON State Warning]:", err.message);
            }
          }
        }
      }

      if (jobs.length === 0) {
        $(".srp-jobtuple-wrapper, article.jobTuple").each((_: number, elem: any) => {
          const title = $(elem).find("a.title, .title").text().trim();
          const company = $(elem).find("a.subTitle, .comp-name").text().trim();
          const loc = $(elem).find(".locWdth, .location").text().trim();
          const applyUrl = $(elem).find("a.title").attr("href") || "";
          const posted = $(elem).find(".job-post-day, .post-date").text().trim();

          if (title && company) {
            jobs.push({
              title,
              company,
              location: loc || location,
              applyUrl: applyUrl.startsWith("http") ? applyUrl : `https://www.naukri.com${applyUrl}`,
              postedText: posted || "Recently listed",
              _isDirect: true,
            });
          }
        });
      }

      return jobs;
    } catch (err: any) {
      console.error(`[Naukri Adapter Error] Execution failed: ${err.message}`);
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

    let postedAt: Date | null = new Date();
    if (raw.postedText) {
      const parsed = parsePostedDate(String(raw.postedText));
      if (parsed) postedAt = parsed.timestamp;
    }

    return {
      sourceId: raw.sourceId || dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: raw.applyUrl || `https://www.naukri.com`,
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
      description: descText || `Job listing from Naukri: ${title} at ${company}.`,
      postedDate: postedAt ? postedAt.toISOString() : null,
      skills: extractedSkills,
    };
  }
}
