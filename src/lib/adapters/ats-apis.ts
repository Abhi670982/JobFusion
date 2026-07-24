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

  // 1. Prefer structured ATS country code if present
  if (atsCountryObj) {
    const cLower = String(atsCountryObj).toLowerCase().trim();
    if (cLower === "in" || cLower === "ind" || cLower.includes("india")) {
      return {
        rawLocation: loc,
        countryCode: "IN",
        city: extractCity(locLower),
        remoteEligible: isRemote(locLower),
        locationConfidence: "high"
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
      locationConfidence: "high"
    };
  }

  if (remoteEligible && (locLower.includes("global") || locLower.includes("worldwide") || locLower.includes("anywhere") || locLower.includes("asia"))) {
    return {
      rawLocation: loc,
      countryCode: "IN",
      city: "Remote",
      remoteEligible: true,
      locationConfidence: "medium"
    };
  }

  return {
    rawLocation: loc,
    countryCode: "OTHER",
    city: null,
    remoteEligible,
    locationConfidence: "low"
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

// Fetch jobs from Greenhouse public JSON API with detailed posting payload
export async function fetchGreenhouseJobs(slug: string): Promise<RawATSJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`;
  const res = await fetch(url, { 
    headers: { "Accept": "application/json", "User-Agent": "JobFusion-CrawlEngine/1.0" },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error(`Greenhouse API responded with HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.jobs)) return [];
  
  const results: RawATSJob[] = [];
  for (const job of data.jobs) {
    const rawLoc = job.location?.name || "Remote";
    const parsedLoc = parseIndiaLocation(rawLoc);
    if (parsedLoc.countryCode !== "IN") continue; // Strict India Filter

    results.push({
      sourceJobId: job.id ? String(job.id) : undefined,
      title: job.title,
      location: rawLoc,
      parsedLocation: parsedLoc,
      url: job.absolute_url,
      postedAt: job.updated_at ? new Date(job.updated_at).toISOString() : undefined,
      dateConfidence: job.updated_at ? "estimated" : "unknown",
    });
  }
  return results;
}

// Fetch jobs from Lever public JSON API
export async function fetchLeverJobs(slug: string): Promise<RawATSJob[]> {
  const url = `https://api.lever.co/v0/postings/${slug}?mode=json`;
  const res = await fetch(url, { 
    headers: { "Accept": "application/json", "User-Agent": "JobFusion-CrawlEngine/1.0" },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error(`Lever API responded with HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data)) return [];
  
  const results: RawATSJob[] = [];
  for (const job of data) {
    const rawLoc = job.categories?.location || "Remote";
    const parsedLoc = parseIndiaLocation(rawLoc);
    if (parsedLoc.countryCode !== "IN") continue;

    results.push({
      sourceJobId: job.id ? String(job.id) : undefined,
      title: job.text,
      location: rawLoc,
      parsedLocation: parsedLoc,
      url: job.hostedUrl,
      postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
      dateConfidence: job.createdAt ? "exact" : "unknown",
    });
  }
  return results;
}

// Fetch jobs from Ashby public JSON API
export async function fetchAshbyJobs(slug: string): Promise<RawATSJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
  const res = await fetch(url, { 
    headers: { "Accept": "application/json", "User-Agent": "JobFusion-CrawlEngine/1.0" },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error(`Ashby API responded with HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.jobs)) return [];
  
  const results: RawATSJob[] = [];
  for (const job of data.jobs) {
    const rawLoc = job.location || "Remote";
    const parsedLoc = parseIndiaLocation(rawLoc);
    if (parsedLoc.countryCode !== "IN") continue;

    results.push({
      sourceJobId: job.id ? String(job.id) : undefined,
      title: job.title,
      location: rawLoc,
      parsedLocation: parsedLoc,
      url: job.jobUrl || job.applyUrl,
      postedAt: job.publishedAt ? new Date(job.publishedAt).toISOString() : undefined,
      dateConfidence: job.publishedAt ? "exact" : "unknown",
      jobType: job.employmentType,
    });
  }
  return results;
}

// Fetch jobs from SmartRecruiters public JSON API with pagination support
export async function fetchSmartRecruitersJobs(slug: string): Promise<RawATSJob[]> {
  const results: RawATSJob[] = [];
  let offset = 0;
  const limit = 100;

  while (offset < 500) {
    const url = `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { 
      headers: { "Accept": "application/json", "User-Agent": "JobFusion-CrawlEngine/1.0" },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) {
      if (offset > 0) break;
      throw new Error(`SmartRecruiters API responded with HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.content) || data.content.length === 0) break;
    
    for (const job of data.content) {
      const rawLoc = job.location?.fullLocation || job.location?.city || "Remote";
      const parsedLoc = parseIndiaLocation(rawLoc, job.location?.country);
      if (parsedLoc.countryCode !== "IN") continue;

      results.push({
        sourceJobId: job.id ? String(job.id) : undefined,
        title: job.name,
        location: rawLoc,
        parsedLocation: parsedLoc,
        url: `https://jobs.smartrecruiters.com/${slug}/${job.id}`,
        postedAt: job.releasedDate ? new Date(job.releasedDate).toISOString() : undefined,
        dateConfidence: job.releasedDate ? "exact" : "unknown",
        jobType: job.typeOfEmployment?.label,
      });
    }

    if (data.content.length < limit) break;
    offset += limit;
  }

  return results;
}

// Fetch jobs from Recruitee public JSON API
export async function fetchRecruiteeJobs(slug: string): Promise<RawATSJob[]> {
  const url = `https://${slug}.recruitee.com/api/offers`;
  const res = await fetch(url, { 
    headers: { "Accept": "application/json", "User-Agent": "JobFusion-CrawlEngine/1.0" },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error(`Recruitee API responded with HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.offers)) return [];
  
  const results: RawATSJob[] = [];
  for (const job of data.offers) {
    const rawLoc = job.location || job.city || "Remote";
    const parsedLoc = parseIndiaLocation(rawLoc, job.country_code);
    if (parsedLoc.countryCode !== "IN") continue;

    results.push({
      sourceJobId: job.id ? String(job.id) : undefined,
      title: job.title,
      location: rawLoc,
      parsedLocation: parsedLoc,
      url: job.careers_url || job.careers_apply_url || `https://${slug}.recruitee.com`,
      postedAt: job.published_at || job.created_at ? new Date(job.published_at || job.created_at).toISOString() : undefined,
      dateConfidence: (job.published_at || job.created_at) ? "exact" : "unknown",
      jobType: job.employment_type_code,
    });
  }
  return results;
}
