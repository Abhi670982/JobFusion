export interface RawAggregatorJob {
  id: string;
  title: string;
  company: string;
  companyLogoUrl?: string;
  location: string;
  url: string;
  postedAt?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  description?: string;
  descriptionHtml?: string;
  isRemote?: boolean;
}

// Helper to check if a text contains any of the search keywords
function matchesKeyword(text: string, keyword: string): boolean {
  if (!text) return false;
  const kw = keyword.toLowerCase().trim();
  const lowerText = text.toLowerCase();
  
  // Direct match
  if (lowerText.includes(kw)) return true;
  
  // Check common parts (e.g. "software engineer" vs "software developer")
  const parts = kw.split(/\s+/).filter(p => p.length > 2);
  if (parts.length > 0) {
    return parts.every(p => lowerText.includes(p));
  }
  return false;
}

// Himalayas API
export async function fetchHimalayasJobs(keyword: string): Promise<RawAggregatorJob[]> {
  try {
    const url = "https://himalayas.app/jobs/api?limit=50";
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) throw new Error(`Himalayas API responded with HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.jobs)) return [];
    
    // Filter client-side
    const filtered = data.jobs.filter((j: any) => 
      matchesKeyword(j.title, keyword) || 
      matchesKeyword(j.description, keyword)
    );
    
    return filtered.map((job: any) => {
      const salaryMin = job.minSalary ? Number(job.minSalary) : undefined;
      const salaryMax = job.maxSalary ? Number(job.maxSalary) : undefined;
      
      return {
        id: job.guid || String(Math.random()),
        title: job.title,
        company: job.companyName,
        companyLogoUrl: job.companyLogo || undefined,
        location: (job.locationRestrictions || []).join(", ") || "Remote",
        url: job.applicationLink || `https://himalayas.app/jobs/${job.companySlug}/${job.guid}`,
        postedAt: job.pubDate ? new Date(job.pubDate).toISOString() : undefined,
        jobType: job.employmentType || "full-time",
        salaryMin,
        salaryMax,
        salaryCurrency: job.currency || undefined,
        salaryPeriod: job.salaryPeriod || undefined,
        description: job.excerpt || job.description,
        descriptionHtml: job.description || undefined,
        isRemote: true,
      };
    });
  } catch (err: any) {
    console.error("[Aggregator API] Himalayas fetch failed:", err.message);
    return [];
  }
}

// Arbeitnow API
export async function fetchArbeitnowJobs(keyword: string): Promise<RawAggregatorJob[]> {
  try {
    const url = "https://www.arbeitnow.com/api/job-board-api";
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) throw new Error(`Arbeitnow API responded with HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.data)) return [];
    
    // Filter client-side
    const filtered = data.data.filter((j: any) => 
      matchesKeyword(j.title, keyword) || 
      matchesKeyword(j.description, keyword)
    );
    
    return filtered.map((job: any) => ({
      id: job.slug || String(Math.random()),
      title: job.title,
      company: job.company_name,
      location: job.location || "Remote",
      url: job.url,
      postedAt: job.created_at ? new Date(job.created_at * 1000).toISOString() : undefined,
      jobType: (job.job_types || [])[0] || "full-time",
      description: job.description ? job.description.replace(/<[^>]*>/g, " ").substring(0, 300) : undefined,
      descriptionHtml: job.description || undefined,
      isRemote: job.remote || false,
    }));
  } catch (err: any) {
    console.error("[Aggregator API] Arbeitnow fetch failed:", err.message);
    return [];
  }
}

// Jobicy API
export async function fetchJobicyJobs(keyword: string): Promise<RawAggregatorJob[]> {
  try {
    const url = `https://jobicy.com/api/v2/remote-jobs?count=30&tag=${encodeURIComponent(keyword)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) throw new Error(`Jobicy API responded with HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.jobs)) return [];
    
    return data.jobs.map((job: any) => ({
      id: String(job.id),
      title: job.jobTitle,
      company: job.companyName,
      companyLogoUrl: job.companyLogo || undefined,
      location: job.jobGeo || "Remote",
      url: job.url,
      postedAt: job.pubDate ? new Date(job.pubDate).toISOString() : undefined,
      jobType: (job.jobType || [])[0] || "full-time",
      description: job.jobDescription ? job.jobDescription.replace(/<[^>]*>/g, " ").substring(0, 300) : undefined,
      descriptionHtml: job.jobDescription || undefined,
      isRemote: true,
    }));
  } catch (err: any) {
    console.error("[Aggregator API] Jobicy fetch failed:", err.message);
    return [];
  }
}

// Remotive API
export async function fetchRemotiveJobs(keyword: string): Promise<RawAggregatorJob[]> {
  try {
    const url = `https://remotive.com/api/remote-jobs?category=software-dev&search=${encodeURIComponent(keyword)}&limit=30`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) throw new Error(`Remotive API responded with HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.jobs)) return [];
    
    return data.jobs.map((job: any) => {
      // Parse salary if possible (e.g. "$120k - $150k")
      let salaryMin: number | undefined;
      let salaryMax: number | undefined;
      const comp = job.salary || "";
      if (comp) {
        const cleanComp = comp.replace(/,/g, "").toLowerCase();
        const nums = cleanComp.match(/\d+/g);
        if (nums && nums.length > 0) {
          let min = parseInt(nums[0], 10);
          let max = nums.length > 1 ? parseInt(nums[1], 10) : min;
          if (cleanComp.includes("k")) {
            min *= 1000;
            max *= 1000;
          }
          salaryMin = min;
          salaryMax = max;
        }
      }

      return {
        id: String(job.id),
        title: job.title,
        company: job.company_name,
        companyLogoUrl: job.company_logo || undefined,
        location: job.candidate_required_location || "Remote",
        url: job.url,
        postedAt: job.publication_date ? new Date(job.publication_date).toISOString() : undefined,
        jobType: job.job_type || "full-time",
        salaryMin,
        salaryMax,
        salaryCurrency: comp.includes("$") ? "USD" : comp.includes("£") ? "GBP" : undefined,
        salaryPeriod: "annual",
        description: job.description ? job.description.replace(/<[^>]*>/g, " ").substring(0, 300) : undefined,
        descriptionHtml: job.description || undefined,
        isRemote: true,
      };
    });
  } catch (err: any) {
    console.error("[Aggregator API] Remotive fetch failed:", err.message);
    return [];
  }
}
