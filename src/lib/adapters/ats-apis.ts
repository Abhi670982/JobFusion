import { AdapterRegistry } from "./AdapterRegistry";
import "./index"; // Ensures self-registration of all adapters
import { GreenhouseAdapter } from "./GreenhouseAdapter";
import { LeverAdapter } from "./LeverAdapter";
import { AshbyAdapter } from "./AshbyAdapter";
import { SmartRecruitersAdapter } from "./SmartRecruitersAdapter";
import { RecruiteeAdapter } from "./RecruiteeAdapter";

export interface ParsedLocation {
  rawLocation: string;
  countryCode: "IN" | "OTHER";
  city: string | null;
  remoteEligible: boolean;
  locationConfidence: "high" | "medium" | "low";
}

export interface RawATSJob {
  sourceJobId?: string;
  title: string;
  location: string;
  parsedLocation?: ParsedLocation;
  url: string;
  postedAt?: string;
  dateConfidence?: "exact" | "estimated" | "unknown";
  jobType?: string;
}

export function parseIndiaLocation(rawLocation: string, atsCountryObj?: string): ParsedLocation {
  const loc = (rawLocation || "").trim();
  const locLower = loc.toLowerCase();

  // 1. Structured country code check
  if (atsCountryObj) {
    const cLower = String(atsCountryObj).toLowerCase().trim();
    if (cLower === "in" || cLower === "ind" || cLower.includes("india")) {
      return {
        rawLocation: loc,
        countryCode: "IN",
        city: extractCity(locLower),
        remoteEligible: isRemote(locLower),
        locationConfidence: "high",
      };
    }
  }

  // 2. Structured text matching for Indian tech hubs & India-specific terms
  const indiaKeywords = [
    "india", "bengaluru", "bangalore", "hyderabad", "gurgaon", "gurugram", 
    "noida", "mumbai", "pune", "chennai", "delhi", "ncr", "kolkata", "ahmedabad"
  ];

  const hasIndiaKeyword = indiaKeywords.some(k => locLower.includes(k));
  const remoteEligible = isRemote(locLower);

  if (hasIndiaKeyword) {
    return {
      rawLocation: loc,
      countryCode: "IN",
      city: extractCity(locLower),
      remoteEligible,
      locationConfidence: "high",
    };
  }

  if (remoteEligible && (locLower.includes("global") || locLower.includes("worldwide") || locLower.includes("anywhere") || locLower.includes("asia"))) {
    return {
      rawLocation: loc,
      countryCode: "IN",
      city: "Remote",
      remoteEligible: true,
      locationConfidence: "medium",
    };
  }

  return {
    rawLocation: loc,
    countryCode: "OTHER",
    city: null,
    remoteEligible,
    locationConfidence: "low",
  };
}

function extractCity(locLower: string): string | null {
  if (locLower.includes("bengaluru") || locLower.includes("bangalore")) return "Bengaluru";
  if (locLower.includes("hyderabad")) return "Hyderabad";
  if (locLower.includes("gurgaon") || locLower.includes("gurugram")) return "Gurugram";
  if (locLower.includes("noida")) return "Noida";
  if (locLower.includes("mumbai")) return "Mumbai";
  if (locLower.includes("pune")) return "Pune";
  if (locLower.includes("chennai")) return "Chennai";
  if (locLower.includes("delhi")) return "Delhi";
  return null;
}

function isRemote(locLower: string): boolean {
  return locLower.includes("remote") || locLower.includes("anywhere") || locLower.includes("work from home");
}

// Legacy wrapper functions delegating to modern BaseAdapter architecture via AdapterRegistry

export async function fetchGreenhouseJobs(slug: string): Promise<RawATSJob[]> {
  const adapter = AdapterRegistry.getAdapter<GreenhouseAdapter>("greenhouse");
  if (!adapter) throw new Error("Greenhouse adapter is not registered");
  const normalized = await adapter.fetchJobs({ slug, companyName: slug });
  return normalized.map(job => ({
    sourceJobId: job.metadata?.sourceJobId || job.id,
    title: job.title,
    location: job.location.rawLocation || job.location.city || "Remote",
    parsedLocation: parseIndiaLocation(job.location.rawLocation || ""),
    url: job.applyUrl,
    postedAt: job.postedAt ? job.postedAt.toISOString() : undefined,
    dateConfidence: job.metadata?.dateConfidence || "unknown",
  }));
}

export async function fetchLeverJobs(slug: string): Promise<RawATSJob[]> {
  const adapter = AdapterRegistry.getAdapter<LeverAdapter>("lever");
  if (!adapter) throw new Error("Lever adapter is not registered");
  const normalized = await adapter.fetchJobs({ slug, companyName: slug });
  return normalized.map(job => ({
    sourceJobId: job.metadata?.sourceJobId || job.id,
    title: job.title,
    location: job.location.rawLocation || job.location.city || "Remote",
    parsedLocation: parseIndiaLocation(job.location.rawLocation || ""),
    url: job.applyUrl,
    postedAt: job.postedAt ? job.postedAt.toISOString() : undefined,
    dateConfidence: job.metadata?.dateConfidence || "unknown",
  }));
}

export async function fetchAshbyJobs(slug: string): Promise<RawATSJob[]> {
  const adapter = AdapterRegistry.getAdapter<AshbyAdapter>("ashby");
  if (!adapter) throw new Error("Ashby adapter is not registered");
  const normalized = await adapter.fetchJobs({ slug, companyName: slug });
  return normalized.map(job => ({
    sourceJobId: job.metadata?.sourceJobId || job.id,
    title: job.title,
    location: job.location.rawLocation || job.location.city || "Remote",
    parsedLocation: parseIndiaLocation(job.location.rawLocation || ""),
    url: job.applyUrl,
    postedAt: job.postedAt ? job.postedAt.toISOString() : undefined,
    dateConfidence: job.metadata?.dateConfidence || "unknown",
    jobType: job.employmentType,
  }));
}

export async function fetchSmartRecruitersJobs(slug: string): Promise<RawATSJob[]> {
  const adapter = AdapterRegistry.getAdapter<SmartRecruitersAdapter>("smartrecruiters");
  if (!adapter) throw new Error("SmartRecruiters adapter is not registered");
  const normalized = await adapter.fetchJobs({ slug, companyName: slug });
  return normalized.map(job => ({
    sourceJobId: job.metadata?.sourceJobId || job.id,
    title: job.title,
    location: job.location.rawLocation || job.location.city || "Remote",
    parsedLocation: parseIndiaLocation(job.location.rawLocation || ""),
    url: job.applyUrl,
    postedAt: job.postedAt ? job.postedAt.toISOString() : undefined,
    dateConfidence: job.metadata?.dateConfidence || "unknown",
    jobType: job.employmentType,
  }));
}

export async function fetchRecruiteeJobs(slug: string): Promise<RawATSJob[]> {
  const adapter = AdapterRegistry.getAdapter<RecruiteeAdapter>("recruitee");
  if (!adapter) throw new Error("Recruitee adapter is not registered");
  const normalized = await adapter.fetchJobs({ slug, companyName: slug });
  return normalized.map(job => ({
    sourceJobId: job.metadata?.sourceJobId || job.id,
    title: job.title,
    location: job.location.rawLocation || job.location.city || "Remote",
    parsedLocation: parseIndiaLocation(job.location.rawLocation || ""),
    url: job.applyUrl,
    postedAt: job.postedAt ? job.postedAt.toISOString() : undefined,
    dateConfidence: job.metadata?.dateConfidence || "unknown",
    jobType: job.employmentType,
  }));
}
