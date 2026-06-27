import { SourceAdapter, FetchQuery, UnifiedJob } from "./types";
import { extractSkills } from "@/lib/skills-extractor";
import {
  fetchHimalayasJobs,
  fetchArbeitnowJobs,
  fetchJobicyJobs,
  fetchRemotiveJobs,
  RawAggregatorJob
} from "./aggregator-apis";
import crypto from "crypto";

export class AggregatorAdapter implements SourceAdapter {
  source = "aggregator" as const;

  async fetchJobs(query: FetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "software engineer";
    console.log(`[Aggregator Adapter] Fetching jobs for keyword: "${keyword}" from all 4 free APIs`);

    try {
      const [himalayas, arbeitnow, jobicy, remotive] = await Promise.all([
        fetchHimalayasJobs(keyword),
        fetchArbeitnowJobs(keyword),
        fetchJobicyJobs(keyword),
        fetchRemotiveJobs(keyword)
      ]);

      const allJobs = [...himalayas, ...arbeitnow, ...jobicy, ...remotive];
      console.log(`[Aggregator Adapter] Aggregated ${allJobs.length} raw jobs (Himalayas: ${himalayas.length}, Arbeitnow: ${arbeitnow.length}, Jobicy: ${jobicy.length}, Remotive: ${remotive.length})`);
      return allJobs;
    } catch (err: any) {
      console.error("[Aggregator Adapter] Fetch failed:", err.message);
      return [];
    }
  }

  mapToUnified(raw: RawAggregatorJob): UnifiedJob {
    const title = (raw.title || "").trim();
    const company = (raw.company || "").trim();
    const location = (raw.location || "Remote").trim();

    // Deduplication Hash
    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

    const description = raw.description || `${title} at ${company}. Location: ${location}`;
    const extractedSkills = extractSkills(description + " " + title).map(s => s.name.toLowerCase());

    let salaryMin = raw.salaryMin || null;
    let salaryMax = raw.salaryMax || null;
    let salaryCurrency = (raw.salaryCurrency || "INR") as "INR" | "USD" | "GBP";
    const salaryPeriod = (raw.salaryPeriod || "annual") as "monthly" | "annual" | "hourly";

    // Convert non-INR currencies to INR for consistent display
    if (salaryCurrency && ["USD", "GBP"].includes(salaryCurrency.toUpperCase())) {
      const conversionRate = salaryCurrency.toUpperCase() === "USD" ? 83 : 105;
      if (salaryMin) salaryMin = Math.round(salaryMin * conversionRate);
      if (salaryMax) salaryMax = Math.round(salaryMax * conversionRate);
    }

    const isRemote = raw.isRemote === true ||
      location.toLowerCase().includes("remote") ||
      location.toLowerCase().includes("anywhere") ||
      location.toLowerCase().includes("work from home");

    // Experience Level heuristics
    let experienceLevel: "entry" | "mid" | "senior" | "lead" | null = null;
    const textToSearch = (title + " " + description).toLowerCase();
    if (textToSearch.includes("senior") || textToSearch.includes("sr.")) experienceLevel = "senior";
    else if (textToSearch.includes("lead") || textToSearch.includes("principal") || textToSearch.includes("staff")) experienceLevel = "lead";
    else if (textToSearch.includes("junior") || textToSearch.includes("entry") || textToSearch.includes("intern")) experienceLevel = "entry";
    else experienceLevel = "mid";

    // Job Type
    let jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null = "full-time";
    const rawType = String(raw.jobType || "").toLowerCase();
    if (rawType.includes("part")) jobType = "part-time";
    else if (rawType.includes("contract") || rawType.includes("temp")) jobType = "contract";
    else if (rawType.includes("intern")) jobType = "internship";
    else if (rawType.includes("free") || rawType.includes("gig")) jobType = "freelance";

    const postedAt = raw.postedAt ? new Date(raw.postedAt) : new Date();

    return {
      sourceId: raw.id || dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: raw.url || `https://remotive.com`,
      applyUrl: raw.url || null,
      title,
      company,
      companyLogoUrl: raw.companyLogoUrl || null,
      location,
      city: location.split(",")[0]?.trim() || null,
      country: location.split(",").pop()?.trim() || null,
      isRemote,
      jobType,
      experienceLevel,
      skills: extractedSkills,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryPeriod,
      description,
      descriptionHtml: raw.descriptionHtml || `<p>${description}</p>`,
      postedAt,
      expiresAt: null,
      fetchedAt: new Date(),
      dedupeHash,
    };
  }
}
