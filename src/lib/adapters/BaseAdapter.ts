import { NormalizedJob, AdapterSource } from "../types/normalizedJob";

export interface BaseAdapterOptions {
  keyword?: string;
  location?: string;
}

export interface WorkdayAdapterOptions extends BaseAdapterOptions {
  host: string;
  tenant: string;
  siteId: string;
  companyName: string;
}

export interface SlugAdapterOptions extends BaseAdapterOptions {
  slug: string;
  companyName: string;
}

export type GreenhouseAdapterOptions = SlugAdapterOptions;
export type LeverAdapterOptions = SlugAdapterOptions;
export type AshbyAdapterOptions = SlugAdapterOptions;
export type SmartRecruitersAdapterOptions = SlugAdapterOptions;
export type RecruiteeAdapterOptions = SlugAdapterOptions;

export interface AdapterHealthMetrics {
  requestDurationMs: number;
  jobsFetched: number;
  jobsNormalized: number;
  jobsDiscarded: number;
  lastSuccessfulFetchAt?: Date;
  lastErrorMessage?: string;
}

export interface BaseAdapter<TOptions extends BaseAdapterOptions = BaseAdapterOptions> {
  readonly source: AdapterSource;
  fetchJobs(options: TOptions): Promise<NormalizedJob[]>;
  getHealthMetrics(): AdapterHealthMetrics;
}
