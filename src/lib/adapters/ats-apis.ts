export interface RawATSJob {
  title: string;
  location: string;
  url: string;
  postedAt?: string;
  jobType?: string;
}

// Fetch jobs from Greenhouse public JSON API
export async function fetchGreenhouseJobs(slug: string): Promise<RawATSJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Greenhouse API responded with HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.jobs)) return [];
  
  return data.jobs.map((job: any) => ({
    title: job.title,
    location: job.location?.name || "Remote",
    url: job.absolute_url,
    postedAt: job.updated_at,
  }));
}

// Fetch jobs from Lever public JSON API
export async function fetchLeverJobs(slug: string): Promise<RawATSJob[]> {
  const url = `https://api.lever.co/v0/postings/${slug}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Lever API responded with HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data)) return [];
  
  return data.map((job: any) => ({
    title: job.text,
    location: job.categories?.location || "Remote",
    url: job.hostedUrl,
    postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
  }));
}

// Fetch jobs from Ashby public JSON API
export async function fetchAshbyJobs(slug: string): Promise<RawATSJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Ashby API responded with HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.jobs)) return [];
  
  return data.jobs.map((job: any) => ({
    title: job.title,
    location: job.location || "Remote",
    url: job.jobUrl || job.applyUrl,
    postedAt: job.publishedAt,
    jobType: job.employmentType,
  }));
}

// Fetch jobs from SmartRecruiters public JSON API
export async function fetchSmartRecruitersJobs(slug: string): Promise<RawATSJob[]> {
  const url = `https://api.smartrecruiters.com/v1/companies/${slug}/postings`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`SmartRecruiters API responded with HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.content)) return [];
  
  return data.content.map((job: any) => ({
    title: job.name,
    location: job.location?.fullLocation || job.location?.city || "Remote",
    url: `https://jobs.smartrecruiters.com/${slug}/${job.id}`,
    postedAt: job.releasedDate,
    jobType: job.typeOfEmployment?.label,
  }));
}

// Fetch jobs from Recruitee public JSON API
export async function fetchRecruiteeJobs(slug: string): Promise<RawATSJob[]> {
  const url = `https://${slug}.recruitee.com/api/offers`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Recruitee API responded with HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.offers)) return [];
  
  return data.offers.map((job: any) => ({
    title: job.title,
    location: job.location || job.city || "Remote",
    url: job.careers_url || job.careers_apply_url || `https://${slug}.recruitee.com`,
    postedAt: job.published_at || job.created_at,
    jobType: job.employment_type_code,
  }));
}
