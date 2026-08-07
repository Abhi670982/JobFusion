import { BasePortalAdapter, PortalFetchQuery, PortalUnifiedJob } from "./base-adapter";
import { crawlWellfoundViaApify } from "@/lib/apify-runner";
import { extractSkills } from "@/lib/skills-extractor";
import { parsePostedDate } from "@/lib/parse-posted-date";
import crypto from "crypto";

export class WellfoundPortalAdapter extends BasePortalAdapter {
  readonly source = "wellfound" as const;

  async fetchJobs(query: PortalFetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "software engineer";
    const location = query.location || "India";

    // 1. Try Primary: Apify Wellfound Jobs Scraper
    if (process.env.APIFY_TOKEN) {
      try {
        console.log(`[Wellfound Adapter] Sourcing Wellfound jobs via Apify Actor for "${keyword}"...`);
        const apifyJobs = await crawlWellfoundViaApify({ keyword, location, maxItems: 40 });
        if (apifyJobs && apifyJobs.length > 0) {
          return apifyJobs;
        }
      } catch (apifyErr: any) {
        console.warn(`[Wellfound Adapter] Apify fetch failed (${apifyErr.message}). Switching to remote feeds fallback...`);
      }
    }

    // 2. Fallback: Himalayas + Arbeitnow remote feeds
    try {
      console.log(`[Wellfound Adapter] Falling back to Himalayas + Arbeitnow remote feeds...`);
      const res = await fetch(`https://himalayas.app/jobs/api?limit=30`);
      if (res.ok) {
        const data = await res.json();
        return (data.jobs || []).map((j: any) => ({
          title: j.title,
          company: j.companyName,
          location: j.locationRestrictions?.join(", ") || "Remote",
          applyUrl: j.applicationLink || j.url || "",
          description: j.description || "",
          postedText: j.pubDate || "Recently listed",
          salary: j.parentCategory || "Not disclosed",
          thumbnail: j.companyLogo,
          sourceId: String(j.id || Math.random()),
          _isRemoteFeed: true,
        }));
      }
    } catch (feedErr: any) {
      console.warn(`[Wellfound Adapter] Remote feed fallback failed (${feedErr.message}). Returning empty list.`);
    }

    return [];
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

    const applyUrl = raw.applyUrl || "https://wellfound.com";

    return {
      sourceId: raw.sourceId || dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: applyUrl,
      applyUrl,
      title,
      company,
      logo: raw.thumbnail || null,
      location,
      isRemote,
      employmentType: "full-time",
      experience: title.toLowerCase().includes("senior") ? "senior" : "mid",
      salary: raw.salary || "Not disclosed",
      salaryMin: null,
      salaryMax: null,
      description: description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      postedDate: postedAt ? postedAt.toISOString() : null,
      skills: extractedSkills,
    };
  }
}
