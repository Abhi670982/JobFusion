import { SourceAdapter, FetchQuery, UnifiedJob } from "./types";
import { extractSkills } from "@/lib/skills-extractor";
import crypto from "crypto";

export class WellfoundAdapter implements SourceAdapter {
  source = "wellfound" as const;

  private sessionToken: string;

  constructor() {
    this.sessionToken = process.env.WELLFOUND_SESSION_TOKEN || "";
  }

  private async crawlYahoo(keyword: string, location: string): Promise<any[]> {
    const cheerio = require("cheerio");
    const query = `site:wellfound.com/jobs "${keyword}" "${location}"`;
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
    
    console.log(`[Wellfound Adapter] Crawling Yahoo: ${url}`);
    
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

      console.log(`[Wellfound Adapter] Scraped ${jobs.length} jobs successfully from Yahoo search.`);
      return jobs;
    } catch (err: any) {
      console.error("[Wellfound Adapter] Yahoo crawl failed:", err.message);
      return [];
    }
  }

  async fetchJobs(query: FetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "software engineer";
    const location = query.location || "India";

    if (!this.sessionToken) {
      console.log("[Wellfound Adapter] Session token is not set. Crawling live Wellfound jobs via Yahoo...");
      return this.crawlYahoo(keyword, location);
    }

    const url = "https://wellfound.com/api/graphql";
    console.log(`[Wellfound Adapter] Querying Wellfound GraphQL API for keyword: ${keyword}`);

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

      if (!response.ok) {
        throw new Error(`Wellfound GraphQL responded with status: ${response.status}`);
      }

      const body = await response.json();
      if (body.errors) {
        throw new Error(`Wellfound GraphQL errors: ${JSON.stringify(body.errors)}`);
      }

      const rawJobs = body.data?.jobListings || [];
      if (rawJobs.length === 0) {
        console.log("[Wellfound Adapter] GraphQL returned 0 jobs. Crawling live Wellfound jobs via Yahoo...");
        return this.crawlYahoo(keyword, location);
      }
      return rawJobs;
    } catch (error: any) {
      console.warn(`[Wellfound Adapter] GraphQL fetch failed (${error.message}). Trying Yahoo crawl fallback...`);
      return this.crawlYahoo(keyword, location);
    }
  }

  mapToUnified(raw: any): UnifiedJob {
    if (raw._isYahooScraped) {
      const title = (raw.title || "").trim();
      const company = (raw.company || "").trim();
      const location = (raw.location || "Remote").trim();

      const rawHashInput = `${title}${company}${location}`.toLowerCase();
      const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

      const isRemote =
        location.toLowerCase().includes("remote") ||
        location.toLowerCase().includes("work from home") ||
        location.toLowerCase().includes("wfh");

      let jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null = "full-time";
      const rawType = title.toLowerCase();
      if (rawType.includes("part")) jobType = "part-time";
      else if (rawType.includes("contract")) jobType = "contract";
      else if (rawType.includes("intern")) jobType = "internship";
      else if (rawType.includes("free") || rawType.includes("gig")) jobType = "freelance";

      let experienceLevel: "entry" | "mid" | "senior" | "lead" | null = null;
      if (title.toLowerCase().includes("senior") || title.toLowerCase().includes("sr.")) experienceLevel = "senior";
      else if (title.toLowerCase().includes("lead") || title.toLowerCase().includes("principal")) experienceLevel = "lead";
      else if (title.toLowerCase().includes("junior") || title.toLowerCase().includes("entry") || title.toLowerCase().includes("intern")) experienceLevel = "entry";
      else experienceLevel = "mid";

      const plainDescription = (raw.description || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return {
        sourceId: dedupeHash.substring(0, 12),
        source: this.source,
        sourceUrl: raw.applyUrl || `https://wellfound.com`,
        applyUrl: raw.applyUrl || null,
        title,
        company,
        companyLogoUrl: null,
        location,
        city: location.split(",")[0] || null,
        country: "India",
        isRemote,
        jobType,
        experienceLevel,
        skills: raw.description ? extractSkills(raw.description).map(s => s.name.toLowerCase()) : [],
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "INR",
        salaryPeriod: "annual",
        description: plainDescription,
        descriptionHtml: raw.description ? `<div>${raw.description}</div>` : null,
        postedAt: new Date(),
        expiresAt: null,
        fetchedAt: new Date(),
        dedupeHash,
      };
    }
    const title = (raw.title || "").trim();
    const company = (raw.company?.name || "").trim();
    const location = (raw.locationNames && raw.locationNames.length > 0)
      ? raw.locationNames.join(", ")
      : (raw.remote ? "Remote" : "India");

    // Deduplication Hash
    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

    const description = raw.description || "";
    const extractedSkills = extractSkills(description).map(s => s.name.toLowerCase());

    // Compensation parsing
    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    let salaryCurrency: "INR" | "USD" | "GBP" | null = "INR";
    let salaryPeriod: "monthly" | "annual" | "hourly" | null = "annual";

    const comp = raw.compensation || "";
    if (comp && comp !== "Not disclosed") {
      // e.g. "$80k - $120k" or "₹12L - ₹20L" or "80000 - 120000"
      const cleanComp = comp.replace(/,/g, "").toLowerCase();
      const nums = cleanComp.match(/\d+/g);

      if (nums && nums.length > 0) {
        let min = parseInt(nums[0], 10);
        let max = nums.length > 1 ? parseInt(nums[1], 10) : min;

        // Multiply by 1000 if 'k' is present
        if (cleanComp.includes("k")) {
          min *= 1000;
          max *= 1000;
        } else if (cleanComp.includes("l")) {
          // Multiply by 100000 if 'l' (lakhs) is present
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

    // Remote flag
    const isRemote = raw.remote === true || location.toLowerCase().includes("remote");

    // Normalize job type
    let jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null = null;
    const rawType = (raw.jobType || "").toLowerCase();
    if (rawType.includes("full")) jobType = "full-time";
    else if (rawType.includes("part")) jobType = "part-time";
    else if (rawType.includes("contract")) jobType = "contract";
    else if (rawType.includes("intern")) jobType = "internship";
    else if (rawType.includes("free") || rawType.includes("gig")) jobType = "freelance";

    // Experience Level heuristics
    let experienceLevel: "entry" | "mid" | "senior" | "lead" | null = null;
    const textToSearch = (title + " " + description).toLowerCase();
    if (textToSearch.includes("senior") || textToSearch.includes("sr.")) experienceLevel = "senior";
    else if (textToSearch.includes("lead") || textToSearch.includes("principal")) experienceLevel = "lead";
    else if (textToSearch.includes("junior") || textToSearch.includes("entry") || textToSearch.includes("intern")) experienceLevel = "entry";
    else experienceLevel = "mid";

    // HTML stripping from description
    const plainDescription = description
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      sourceId: raw.id || dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: raw.applyUrl || `https://wellfound.com/jobs/${raw.id}`,
      applyUrl: raw.applyUrl || `https://wellfound.com/jobs/${raw.id}`,
      title,
      company,
      companyLogoUrl: raw.company?.logoUrl || null,
      location,
      city: raw.locationNames?.[0] || null,
      country: raw.locationNames && raw.locationNames.length > 1 ? raw.locationNames[raw.locationNames.length - 1] : "India",
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
      postedAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
      expiresAt: null,
      fetchedAt: new Date(),
      dedupeHash,
    };
  }
}
