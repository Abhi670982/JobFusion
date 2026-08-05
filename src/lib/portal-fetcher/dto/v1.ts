export interface PortalJobDTOV1 {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  isRemote: boolean;
  employmentType: string | null;
  experienceLevel: string | null;
  salaryText: string;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  applyUrl: string;
  sourcePortal: string;
  postedAtISO: string | null;
  isDateless: boolean;
  matchedSkills: string[];
}

export interface PortalJobsApiResponseV1 {
  version: "v1";
  success: boolean;
  portal: string;
  keyword: string;
  location: string;
  page: number;
  limit: number;
  totalFound: number;
  totalPages: number;
  jobs: PortalJobDTOV1[];
  cached: boolean;
  errors?: string[];
  backgroundSyncQueued?: boolean;
  healthStatus?: Record<string, "Healthy" | "Degraded" | "Offline">;
}
