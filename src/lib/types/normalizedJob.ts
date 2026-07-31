export type AdapterSource =
  | "workday"
  | "greenhouse"
  | "lever"
  | "ashby"
  | "smartrecruiters"
  | "recruitee";

export interface JobLocation {
  city?: string;
  state?: string;
  country?: string;
  remoteType?: "remote" | "hybrid" | "onsite";
  rawLocation?: string;
}

export interface JobMetadata {
  sourceJobId?: string;
  dateConfidence?: "exact" | "estimated" | "unknown";
  department?: string;
  providerRawPayload?: Record<string, unknown>;
  customAttributes?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface NormalizedJob {
  readonly normalizationVersion: 1;
  id: string;
  title: string;
  company: string;
  location: JobLocation;
  postedAt?: Date;
  applyUrl: string;
  description?: string;
  employmentType?: string;
  department?: string;
  salary?: string;
  skills?: string[];
  source: AdapterSource;
  metadata?: JobMetadata;
}
