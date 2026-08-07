import { BasePortalAdapter, PortalFetchQuery, PortalUnifiedJob } from "./base-adapter";
import { crawlWellfoundViaApify } from "@/lib/apify-runner";
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

  async fetchJobs(query: PortalFetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "software engineer";
    const location = query.location || "India";

    let rawListings: any[] = [];

    // 1. Primary: Direct GraphQL API if session token is provided
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
        variables: { role: keyword, location },
      };

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Authorization: `Bearer ${this.sessionToken}`,
            Cookie: `session=${this.sessionToken}`,
          },
          body: JSON.stringify(graphqlQuery),
        });

        if (response.ok) {
          const body = await response.json();
          if (!body.errors) {
            rawListings = body.data?.jobListings || [];
          }
        }
      } catch (error: any) {
        console.warn(`[Wellfound Adapter] GraphQL fetch failed (${error.message || "error"}). Switching to Apify actor...`);
      }
    }

    // 2. Secondary: Apify Wellfound Actor
    if (rawListings.length === 0 && process.env.APIFY_TOKEN) {
      console.log(`[Wellfound Adapter] Sourcing Wellfound jobs via Apify Actor for "${keyword}"...`);
      try {
        rawListings = await crawlWellfoundViaApify({ keyword, location, maxItems: 40 });
      } catch (apifyErr: any) {
        console.warn(`[Wellfound Adapter] Apify fetch failed (${apifyErr.message}). Switching to remote feeds fallback...`);
      }
    }

    // 3. Tertiary: Fallback to Himalayas + Arbeitnow remote startup feeds (Zero Yahoo dependency!)
    if (rawListings.length === 0) {
      console.log("[Wellfound Adapter] Falling back to Himalayas + Arbeitnow remote feeds...");
      try {
        const [himalayas, arbeitnow] = await Promise.all([
          fetchHimalayasJobs(keyword),
          fetchArbeitnowJobs(keyword),
        ]);
        const combined = [...himalayas, ...arbeitnow];
        return combined.map((j) => ({ ...j, _isFallback: true }));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Fallback fetch failed";
        console.error("[Wellfound Adapter] Remote feeds fallback failed:", errorMessage);
        return [];
      }
    }

    return rawListings;
  }

  mapToUnified(raw: any): PortalUnifiedJob {
    if (raw._isApify) {
      const title = (raw.title || "").trim();
      const company = (raw.company || "").trim();
      const location = (raw.location || "Remote").trim();

      const rawHashInput = `${title}${company}${location}`.toLowerCase();
      const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

      const isRemote =
        location.toLowerCase().includes("remote") ||
        location.toLowerCase().includes("work from home") ||
        location.toLowerCase().includes("wfh");

      return {
        sourceId: raw.sourceId || dedupeHash.substring(0, 12),
        source: this.source,
        sourceUrl: raw.applyUrl || `https://wellfound.com`,
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
        description: raw.description || "",
        postedDate: null,
        skills: raw.description ? extractSkills(raw.description).map((s) => s.name.toLowerCase()) : [],
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

      const salaryString =
        raw.salaryMin && raw.salaryMax
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
        skills: raw.description ? extractSkills(raw.description).map((s) => s.name.toLowerCase()) : [],
      };
    }

    const title = (raw.title || "").trim();
    const company = (raw.company?.name || "").trim();
    const location =
      raw.locationNames && raw.locationNames.length > 0
        ? raw.locationNames.join(", ")
        : raw.remote ? "Remote" : "India";

    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

    const description = raw.description || "";
    const extractedSkills = extractSkills(description).map((s) => s.name.toLowerCase());

    const isRemote = raw.remote === true || location.toLowerCase().includes("remote");

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
      employmentType: "full-time",
      experience: title.toLowerCase().includes("senior") ? "senior" : "mid",
      salary: raw.compensation || "Not disclosed",
      salaryMin: null,
      salaryMax: null,
      description: description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      postedDate: raw.createdAt ? new Date(raw.createdAt) : null,
      skills: extractedSkills,
    };
  }
}
