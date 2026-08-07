export type JobPortalSource = "linkedin" | "indeed" | "internshala" | "wellfound" | "naukri" | "foundit";

export interface PortalFetchQuery {
  keywords: string[];
  location?: string;
  page?: number;
  limit?: number;
  logger?: Logger;
}

export interface PortalUnifiedJob {
  sourceId: string;
  source: JobPortalSource;
  sourceUrl: string;
  applyUrl: string | null;
  title: string;
  company: string;
  logo: string | null;
  location: string | null;
  isRemote: boolean;
  employmentType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null;
  experience: "entry" | "mid" | "senior" | "lead" | null;
  salary: string | null;     // normalized text description of salary
  salaryMin: number | null;  // numeric representation for filter calculations
  salaryMax: number | null;
  description: string;
  postedDate: string | null; // ISO 8601 string or null
  isDateless?: boolean;
  skills: string[];          // extracted skill tags
  dedupeHash?: string;
}

export abstract class BasePortalAdapter {
  abstract readonly source: JobPortalSource;
  protected logger: Logger = defaultLogger;

  setLogger(logger: Logger) {
    this.logger = logger;
  }

  abstract fetchJobs(query: PortalFetchQuery): Promise<any[]>;
  abstract mapToUnified(raw: any): PortalUnifiedJob;
}
