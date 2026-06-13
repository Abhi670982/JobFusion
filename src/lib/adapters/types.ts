export type JobSource = "linkedin" | "indeed" | "wellfound" | "internshala";

export interface FetchQuery {
  keywords: string[];   // e.g. ["software engineer", "react developer"]
  location?: string;
  page?: number;
  limit?: number;
}

export interface UnifiedJob {
  // Identity
  sourceId: string;            // Original ID from the source portal
  source: JobSource;
  sourceUrl: string;           // Direct URL to the job on source portal
  applyUrl: string | null;     // External application link

  // Core info
  title: string;               // Normalized: lowercase, trimmed
  company: string;             // Company name, trimmed
  companyLogoUrl: string | null;

  // Location
  location: string | null;     // Human-readable, e.g. "Bangalore, India"
  city: string | null;
  country: string | null;
  isRemote: boolean;

  // Role metadata
  jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null;
  experienceLevel: "entry" | "mid" | "senior" | "lead" | null;
  skills: string[];            // Extracted from description, normalized to lowercase

  // Compensation
  salaryMin: number | null;    // Always in INR. Convert if currency is USD/GBP.
  salaryMax: number | null;
  salaryCurrency: "INR" | "USD" | "GBP" | null;
  salaryPeriod: "monthly" | "annual" | "hourly" | null;

  // Content
  description: string;         // Plain text, stripped of HTML
  descriptionHtml: string | null;

  // Timestamps
  postedAt: Date | null;       // UTC ISO 8601
  expiresAt: Date | null;
  fetchedAt: Date;             // When we pulled it — always set

  // Deduplication
  dedupeHash: string;          // SHA-256 of (title + company + location).toLowerCase()
}

export interface SourceAdapter {
  source: JobSource;
  fetchJobs(query: FetchQuery): Promise<any[]>;
  mapToUnified(raw: any): UnifiedJob;
}
