export type JobPortalSource = "linkedin" | "indeed" | "internshala" | "wellfound" | "naukri" | "foundit";

export type Logger = any;
export const defaultLogger: Logger = console;

export interface PortalFetchQuery {
  keywords: string[];
  location?: string;
  page?: number;
  limit?: number;
  logger?: Logger;
}

export interface PortalUnifiedJob {
  sourceId: string;
  id?: string;
  source: JobPortalSource;
  sourcePortal?: string;
  sourceUrl: string;
  applyUrl: string | null;
  title: string;
  company: string;
  logo: string | null;
  companyLogo?: string | null;
  location: string | null;
  isRemote: boolean;
  employmentType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null;
  experience: "entry" | "mid" | "senior" | "lead" | null;
  experienceLevel?: "entry" | "mid" | "senior" | "lead" | null;
  salary: string | null;
  salaryText?: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  postedDate: string | null;
  postedAtISO?: string | null;
  isDateless?: boolean;
  skills: string[];
  matchedSkills?: string[];
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
