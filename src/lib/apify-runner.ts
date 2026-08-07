/**
 * Apify Integration Runner
 * Executes official Apify Actors for LinkedIn, Indeed, Wellfound, Naukri, and Foundit job extraction.
 * Features fast-bypass on HTTP 403 Quota Hard Limits, pre-flight verification, and fallback triggers.
 */

import { apifyActors, verifyApifyActor } from "./apify-config";

export interface ApifyCrawlParams {
  keyword: string;
  location?: string;
  maxItems?: number;
}

export async function runApifyActor(
  actorId: string,
  input: Record<string, any>,
  timeoutMs = 45000,
  maxRetries = 2
): Promise<any[]> {
  const token = process.env.APIFY_TOKEN || "";
  if (!token) {
    throw new Error("APIFY_NOT_CONFIGURED: APIFY_TOKEN environment variable is missing.");
  }

  // Pre-flight Verification: Verify actor exists and token has access before launching
  const verification = await verifyApifyActor(actorId, token);
  if (!verification.valid) {
    console.error(`[Apify Runner Verification Failed] Actor "${actorId}" cannot be executed: ${verification.error}`);
    throw new Error(`APIFY_PREFLIGHT_FAILED: ${verification.error}`);
  }

  console.log(`[Apify Runner Verified] Target Actor "${actorId}" (${verification.title}) verified. Launching run...`);

  const encodedActorId = encodeURIComponent(actorId);
  const url = `https://api.apify.com/v2/acts/${encodedActorId}/run-sync-get-dataset-items?token=${token}&memory=1024&timeout=${Math.floor(timeoutMs / 1000)}`;

  let attempt = 0;
  while (true) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[Apify Runner] Executing actor "${actorId}" (attempt ${attempt}/${maxRetries + 1}) for input:`, JSON.stringify(input));

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");

        // FAST BYPASS: Detect Apify Monthly Quota Hard Limit (HTTP 403) immediately on attempt 1!
        if (res.status === 403 || errorText.includes("Monthly usage hard limit exceeded") || errorText.includes("platform-feature-disabled")) {
          console.error(`[Apify Quota Exceeded] Apify monthly usage limit reached for actor "${actorId}" (HTTP 403). Bypassing retries immediately.`);
          throw new Error(`APIFY_QUOTA_EXCEEDED: Monthly usage hard limit exceeded for ${actorId}`);
        }

        throw new Error(`Apify Actor ${actorId} returned HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn(`[Apify Runner] Actor ${actorId} returned non-array dataset:`, data);
        return [];
      }

      console.log(`[Apify Runner Success] Actor "${actorId}" returned ${data.length} items successfully.`);
      return data;
    } catch (err: any) {
      clearTimeout(timer);

      // Immediately throw without retrying if Quota Limit was exceeded or Pre-flight failed
      if (err.message?.includes("APIFY_QUOTA_EXCEEDED") || err.message?.includes("APIFY_PREFLIGHT_FAILED")) {
        throw err;
      }

      if (attempt <= maxRetries) {
        const backoffMs = 1500 * Math.pow(2, attempt - 1);
        console.warn(`[Apify Runner Retry] Actor "${actorId}" execution failed (${err.message}). Retrying in ${backoffMs}ms...`);
        await new Promise((res) => setTimeout(res, backoffMs));
        continue;
      }

      console.error(`[Apify Runner Exhausted] Actor "${actorId}" failed after ${maxRetries + 1} attempts: ${err.message}`);
      throw err;
    }
  }
}

/**
 * Apify LinkedIn Jobs Scraper (`valig/linkedin-jobs-scraper`)
 */
export async function crawlLinkedInViaApify(params: ApifyCrawlParams): Promise<any[]> {
  const { keyword, location = "India", maxItems = 50 } = params;
  const actorId = apifyActors.linkedin;

  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
  const input = {
    urls: [searchUrl],
    maxJobs: maxItems,
  };

  try {
    const items = await runApifyActor(actorId, input, 45000);
    return items.map((item: any) => ({
      title: item.title || keyword,
      company: item.companyName || item.company || "LinkedIn Employer",
      location: item.location || location,
      applyUrl: item.applyUrl || item.url || "",
      description: typeof item.description === "string" ? item.description : "",
      postedText: item.postedDate || item.postedTimeAgo || "Recently listed",
      salary: item.salary || "Not disclosed",
      experience: item.experienceLevel || "mid",
      jobType: item.contractType || item.workType || "full-time",
      sourceId: item.id || item.url || String(Math.random()),
      _isApify: true,
      _source: "linkedin",
    }));
  } catch (err: any) {
    console.error(`[Apify LinkedIn Failed] Primary actor "${actorId}" failed: ${err.message}`);
    throw err;
  }
}

/**
 * Apify Indeed Jobs Scraper (`valig/indeed-jobs-scraper`)
 */
export async function crawlIndeedViaApify(params: ApifyCrawlParams): Promise<any[]> {
  const { keyword, location = "India", maxItems = 50 } = params;
  const actorId = apifyActors.indeed;

  const indeedUrl = `https://in.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;
  const input = {
    urls: [indeedUrl],
    maxJobs: maxItems,
  };

  try {
    const items = await runApifyActor(actorId, input, 45000);
    return items.map((item: any) => {
      let company = "Indeed Employer";
      if (typeof item.employer === "string") company = item.employer;
      else if (item.employer && typeof item.employer === "object") company = item.employer.name || "Indeed Employer";

      let loc = location;
      if (typeof item.location === "string") loc = item.location;
      else if (item.location && typeof item.location === "object") loc = item.location.formattedLocation || item.location.city || location;

      let salary = "Not disclosed";
      if (typeof item.baseSalary === "string") salary = item.baseSalary;
      else if (item.baseSalary && typeof item.baseSalary === "object") salary = item.baseSalary.formattedAmount || "Not disclosed";

      return {
        title: item.title || keyword,
        company,
        location: loc,
        applyUrl: item.jobUrl || item.url || "",
        description: typeof item.description === "string" ? item.description : "",
        postedText: item.datePublished || item.dateOnIndeed || "Recently listed",
        salary,
        jobType: (item.jobTypes && item.jobTypes[0]) || "full-time",
        sourceId: item.key || item.refNum || String(Math.random()),
        _isApify: true,
        _source: "indeed",
      };
    });
  } catch (err: any) {
    console.error(`[Apify Indeed Failed] Primary actor "${actorId}" failed: ${err.message}`);
    throw err;
  }
}

/**
 * Apify Wellfound Jobs Scraper (`orgupdate/wellfound-jobs-scraper`)
 */
export async function crawlWellfoundViaApify(params: ApifyCrawlParams): Promise<any[]> {
  const { keyword, location = "India", maxItems = 40 } = params;
  const actorId = apifyActors.wellfound;

  const input = {
    role: keyword,
    location: location,
    maxJobs: maxItems,
  };

  try {
    const items = await runApifyActor(actorId, input, 40000);
    return items.map((item: any) => ({
      title: item.job_title || item.title || keyword,
      company: item.company_name || item.company || "Wellfound Employer",
      location: item.location || location,
      applyUrl: item.URL || item.url || item.applyUrl || "",
      description: typeof item.description === "string" ? item.description : "",
      postedText: item.date || item.posted_via || "Recently listed",
      salary: item.salary || "Not disclosed",
      sourceId: item.URL || item.job_title || String(Math.random()),
      _isApify: true,
      _source: "wellfound",
    }));
  } catch (err: any) {
    console.error(`[Apify Wellfound Failed] Primary actor "${actorId}" failed: ${err.message}`);
    throw err;
  }
}

/**
 * Apify Naukri Jobs Scraper (`valig/naukri-jobs-scraper`)
 */
export async function crawlNaukriViaApify(params: ApifyCrawlParams): Promise<any[]> {
  const { keyword, location = "India", maxItems = 30 } = params;
  const actorId = apifyActors.naukri;

  const naukriUrl = `https://www.naukri.com/${encodeURIComponent(keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}-jobs-in-india`;
  const input = {
    urls: [naukriUrl],
    maxJobs: maxItems,
  };

  try {
    const items = await runApifyActor(actorId, input, 40000);
    return items.map((item: any) => ({
      title: item.title || item.jobTitle || keyword,
      company: item.companyName || item.company || "Naukri Employer",
      location: item.location || location,
      applyUrl: item.url || item.applyUrl || "",
      description: typeof item.description === "string" ? item.description : "",
      postedText: item.postedDate || "Recently listed",
      salary: item.salary || "Not disclosed",
      sourceId: item.jobId || item.url || String(Math.random()),
      _isApify: true,
      _source: "naukri",
    }));
  } catch (err: any) {
    console.error(`[Apify Naukri Failed] Primary actor "${actorId}" failed: ${err.message}`);
    throw err;
  }
}

/**
 * Apify Foundit Jobs Scraper (`easyapi/foundit-jobs-scraper`)
 */
export async function crawlFounditViaApify(params: ApifyCrawlParams): Promise<any[]> {
  const { keyword, location = "India", maxItems = 30 } = params;
  const actorId = apifyActors.foundit;

  const founditUrl = `https://www.foundit.in/seeker/job-search?query=${encodeURIComponent(keyword)}&locations=${encodeURIComponent(location)}`;
  const input = {
    searchUrl: founditUrl,
    maxJobs: maxItems,
  };

  try {
    const items = await runApifyActor(actorId, input, 40000);
    return items.map((item: any) => ({
      title: item.title || item.jobTitle || keyword,
      company: item.company || item.companyName || "Foundit Employer",
      location: item.location || location,
      applyUrl: item.url || item.applyUrl || "",
      description: typeof item.description === "string" ? item.description : "",
      postedText: item.posted || item.postedDate || "Recently listed",
      salary: item.salary || "Not disclosed",
      sourceId: item.id || item.url || String(Math.random()),
      _isApify: true,
      _source: "foundit",
    }));
  } catch (err: any) {
    console.error(`[Apify Foundit Failed] Primary actor "${actorId}" failed: ${err.message}`);
    throw err;
  }
}
