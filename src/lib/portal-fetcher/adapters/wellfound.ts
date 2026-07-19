import { BasePortalAdapter, PortalFetchQuery, PortalUnifiedJob } from "./base-adapter";
import { extractSkills } from "@/lib/skills-extractor";
import { fetchHimalayasJobs, fetchArbeitnowJobs } from "@/lib/adapters/aggregator-apis";
import crypto from "crypto";

export class WellfoundPortalAdapter extends BasePortalAdapter {
  readonly source = "wellfound" as const;
  private sessionToken: string;

  constructor() {
    super();
    this.sessionToken = process.env.WELLFOUND_SESSION_TOKEN || "";
  }

  private async crawlYahoo(keyword: string, location: string): Promise<any[]> {
    const cheerio = require("cheerio");
    const query = `site:wellfound.com/jobs "${keyword}" "${location}"`;
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
    
    console.log(`[Wellfound Portal Adapter] Crawling Yahoo: ${url}`);
    
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      });

      if (!res.ok) {
        throw new Error(`Yahoo Search responded with status ${res.status}`);
      }

      const html = await res.text();
      const $ = cheerio.load(html);
      const jobs: any[] = [];

      $("div.algo").each((_: number, elem: any) => {
        const card = $(elem);
        const anchor = card.find("a").first();
        const href = anchor.attr("href") || "";

        let destinationUrl = "";
        if (href.includes("/RU=")) {
          const ruParts = href.split("/RU=");
          if (ruParts.length > 1) {
            const rawUrl = ruParts[1].split("/RK=")[0];
            try {
              destinationUrl = decodeURIComponent(rawUrl);
            } catch (e) {}
          }
        } else {
          destinationUrl = href;
        }

        if (destinationUrl.includes("wellfound.com/jobs/")) {
          const titleText = card.find("h3.title").text().trim();
          const snippetText = card.find(".compText").text().trim();

          let jobTitle = titleText;
          let company = "Wellfound Company";
          let jobLocation = location;
          
          const cleanTitle = titleText.replace(/\.\.\.$/, "").trim();
          const atIndex = cleanTitle.lastIndexOf(" at ");
          if (atIndex !== -1) {
            jobTitle = cleanTitle.substring(0, atIndex).trim();
            company = cleanTitle.substring(atIndex + 4).trim();
          } else {
            const splitters = [" - ", " | ", " • "];
            for (const splitter of splitters) {
              const splitIndex = cleanTitle.indexOf(splitter);
              if (splitIndex !== -1) {
                jobTitle = cleanTitle.substring(0, splitIndex).trim();
                company = cleanTitle.substring(splitIndex + splitter.length).trim();
                break;
              }
            }
          }

          if (company.includes(" • ")) {
            const dotIndex = company.indexOf(" • ");
            jobLocation = company.substring(dotIndex + 3).trim();
            company = company.substring(0, dotIndex).trim();
          } else {
            const locationMatch = snippetText.match(/ in (.*?) - Apply/i);
            if (locationMatch && locationMatch[1]) {
              jobLocation = locationMatch[1].trim();
            }
          }

          jobLocation = jobLocation.replace(/\.\.\./g, "").trim();

          jobs.push({
            title: jobTitle,
            company: company,
            location: jobLocation,
            applyUrl: destinationUrl,
            sourceUrl: destinationUrl,
            description: snippetText,
            _isYahooScraped: true,
          });
        }
      });

      console.log(`[Wellfound Portal Adapter] Scraped ${jobs.length} jobs successfully from Yahoo search.`);
      return jobs;
    } catch (err: any) {
      console.error("[Wellfound Portal Adapter] Yahoo crawl failed:", err.message);
      return [];
    }
  }

  async fetchJobs(query: PortalFetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "software engineer";
    const location = query.location || "India";

    let rawListings: any[] = [];

    if (this.sessionToken) {
      const url = "https://wellfound.com/api/graphql";
      const graphqlQuery = {
        query: `
          query JobListings($role: String, $location: String) {
            jobListings(filter: { role: $role, location: $location }) {
              id
              title
              company {
                name
                logoUrl
                description
              }
              locationNames
              compensation
              jobType
              description
              remote
              applyUrl
              createdAt
            }
          }
        `,
        variables: {
          role: keyword,
          location: location,
        },
      };

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Authorization": `Bearer ${this.sessionToken}`,
          "Cookie": `session=${this.sessionToken}`,
        };

        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(graphqlQuery),
        });

        if (response.ok) {
          const body = await response.json();
          if (!body.errors) {
            rawListings = body.data?.jobListings || [];
          }
        }
      } catch (error: any) {
        console.warn(`[Wellfound Portal Adapter] GraphQL fetch failed (${error.message}). Trying fallback...`);
      }
    }

    if (rawListings.length === 0) {
      console.log("[Wellfound Portal Adapter] Session token is not set or API failed. Crawling live Wellfound jobs via Yahoo...");
      rawListings = await this.crawlYahoo(keyword, location);
    }

    if (rawListings.length === 0) {
      console.log("[Wellfound Portal Adapter] Yahoo crawl returned 0. Falling back to Himalayas + Arbeitnow remote feeds...");
      try {
        const [himalayas, arbeitnow] = await Promise.all([
          fetchHimalayasJobs(keyword),
          fetchArbeitnowJobs(keyword)
        ]);
        const combined = [...himalayas, ...arbeitnow];
        return combined.map(j => ({ ...j, _isFallback: true }));
      } catch (err: any) {
        console.error("[Wellfound Portal Adapter] Fallback fetch failed:", err.message);
        return [];
      }
    }

    return rawListings;
  }

  mapToUnified(raw: any): PortalUnifiedJob {
    if (raw._isYahooScraped) {
      const title = (raw.title || "").trim();
      const company = (raw.company || "").trim();
      const location = (raw.location || "Remote").trim();

      const rawHashInput = `${title}${company}${location}`.toLowerCase();
      const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

      const isRemote = location.toLowerCase().includes("remote") ||
                       location.toLowerCase().includes("work from home") ||
                       location.toLowerCase().includes("wfh");

      let employmentType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null = "full-time";
      const rawType = title.toLowerCase();
      if (rawType.includes("part")) employmentType = "part-time";
      else if (rawType.includes("contract")) employmentType = "contract";
      else if (rawType.includes("intern")) employmentType = "internship";
      else if (rawType.includes("free") || rawType.includes("gig")) employmentType = "freelance";

      return {
        sourceId: dedupeHash.substring(0, 12),
        source: this.source,
        sourceUrl: raw.applyUrl || `https://wellfound.com`,
        applyUrl: raw.applyUrl || null,
        title,
        company,
        logo: null,
        location,
        isRemote,
        employmentType,
        experience: title.toLowerCase().includes("senior") ? "senior" : "mid",
        salary: "Not disclosed",
        salaryMin: null,
        salaryMax: null,
        description: raw.description || "",
        postedDate: null,
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

      const targetUrl = raw.url || raw.applyUrl || `https://wellfound.com/jobs?keyword=${encodeURIComponent(title)}`;

      return {
        sourceId: raw.id || dedupeHash.substring(0, 12),
        source: this.source,
        sourceUrl: targetUrl,
        applyUrl: targetUrl,
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
        postedDate: raw.postedAt ? new Date(raw.postedAt) : null,
        skills: raw.description ? extractSkills(raw.description).map(s => s.name.toLowerCase()) : [],
      };
    }

    const title = (raw.title || "").trim();
    const company = (raw.company?.name || "").trim();
    const location = (raw.locationNames && raw.locationNames.length > 0)
      ? raw.locationNames.join(", ")
      : (raw.remote ? "Remote" : "India");

    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

    const description = raw.description || "";
    const extractedSkills = extractSkills(description).map(s => s.name.toLowerCase());

    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    let salaryCurrency: "INR" | "USD" | "GBP" | null = "INR";
    let salaryPeriod: "monthly" | "annual" | "hourly" | null = "annual";

    const comp = raw.compensation || "";
    if (comp && comp !== "Not disclosed") {
      const cleanComp = comp.replace(/,/g, "").toLowerCase();
      const nums = cleanComp.match(/\d+/g);

      if (nums && nums.length > 0) {
        let min = parseInt(nums[0], 10);
        let max = nums.length > 1 ? parseInt(nums[1], 10) : min;

        if (cleanComp.includes("k")) {
          min *= 1000;
          max *= 1000;
        } else if (cleanComp.includes("l")) {
          min *= 100000;
          max *= 100000;
        }

        salaryMin = min;
        salaryMax = max;

        if (cleanComp.includes("$")) {
          salaryCurrency = "USD";
          salaryMin = salaryMin * 83;
          salaryMax = salaryMax * 83;
        } else if (cleanComp.includes("£")) {
          salaryCurrency = "GBP";
          salaryMin = salaryMin * 105;
          salaryMax = salaryMax * 105;
        }
      }
    }

    const isRemote = raw.remote === true || location.toLowerCase().includes("remote");

    let employmentType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null = null;
    const rawType = (raw.jobType || "").toLowerCase();
    if (rawType.includes("full")) employmentType = "full-time";
    else if (rawType.includes("part")) employmentType = "part-time";
    else if (rawType.includes("contract")) employmentType = "contract";
    else if (rawType.includes("intern")) employmentType = "internship";
    else if (rawType.includes("free") || rawType.includes("gig")) employmentType = "freelance";

    let experience: "entry" | "mid" | "senior" | "lead" | null = null;
    const textToSearch = (title + " " + description).toLowerCase();
    if (textToSearch.includes("senior") || textToSearch.includes("sr.")) experience = "senior";
    else if (textToSearch.includes("lead") || textToSearch.includes("principal")) experience = "lead";
    else if (textToSearch.includes("junior") || textToSearch.includes("entry") || textToSearch.includes("intern")) experience = "entry";
    else experience = "mid";

    const salaryString = salaryMin && salaryMax
      ? `₹${Math.round(salaryMin / 100000)}L – ₹${Math.round(salaryMax / 100000)}L`
      : comp || "Not disclosed";

    return {
      sourceId: raw.id || dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: raw.applyUrl || `https://wellfound.com/jobs/${raw.id}`,
      applyUrl: raw.applyUrl || `https://wellfound.com/jobs/${raw.id}`,
      title,
      company,
      logo: raw.company?.logoUrl || null,
      location,
      isRemote,
      employmentType,
      experience,
      salary: salaryString,
      salaryMin,
      salaryMax,
      description: description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      postedDate: raw.createdAt ? new Date(raw.createdAt) : null,
      skills: extractedSkills,
    };
  }
}
