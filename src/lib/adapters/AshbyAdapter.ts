import { AbstractAdapter } from "./AbstractAdapter";
import { AshbyAdapterOptions } from "./BaseAdapter";
import { NormalizedJob, AdapterSource } from "../types/normalizedJob";
import { parseJobLocation } from "../utils/parseLocation";
import { parsePostedDate } from "../utils/parsePostedDate";
import { normalizeEmploymentType } from "../utils/normalizeEmploymentType";
import { AdapterRegistry } from "./AdapterRegistry";
import { canonicalizeUrl } from "../url-cleaner";

export interface RawAshbyJob {
  id?: string;
  title?: string;
  location?: string;
  jobUrl?: string;
  applyUrl?: string;
  publishedAt?: string;
  employmentType?: string;
  department?: string;
  descriptionPlain?: string;
  [key: string]: unknown;
}

export class AshbyAdapter extends AbstractAdapter<AshbyAdapterOptions, RawAshbyJob> {
  readonly source: AdapterSource = "ashby";

  protected async fetchRawJobs(options: AshbyAdapterOptions): Promise<RawAshbyJob[]> {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${options.slug}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "JobFusion-CrawlEngine/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Ashby API responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.jobs)) {
      return [];
    }

    return data.jobs;
  }

  protected normalizeRawJob(raw: RawAshbyJob, options: AshbyAdapterOptions): NormalizedJob | null {
    if (!raw || !raw.title) return null;

    const title = String(raw.title).trim();
    const company = options.companyName;
    const rawLoc = raw.location || "Remote";
    const { location, isIndiaMatch } = parseJobLocation(rawLoc);

    if (!isIndiaMatch) {
      return null;
    }

    const sourceJobId = raw.id ? String(raw.id) : "";
    const id = sourceJobId ? `ashby-${options.slug}-${sourceJobId}` : "";
    const rawUrl = raw.jobUrl || raw.applyUrl || "";
    const applyUrl = canonicalizeUrl(rawUrl) || rawUrl;
    const dateResult = parsePostedDate(raw.publishedAt);

    return {
      normalizationVersion: 1,
      id,
      title,
      company,
      location,
      postedAt: dateResult.date,
      applyUrl,
      description: raw.descriptionPlain || `${title} at ${company}. Location: ${rawLoc}`,
      employmentType: normalizeEmploymentType(raw.employmentType, title),
      department: raw.department,
      source: this.source,
      metadata: {
        sourceJobId,
        dateConfidence: dateResult.confidence,
        department: raw.department,
        providerRawPayload: raw as Record<string, unknown>,
      },
    };
  }
}

// Self-register Ashby adapter instance
const ashbyAdapter = new AshbyAdapter();
AdapterRegistry.register(ashbyAdapter);
