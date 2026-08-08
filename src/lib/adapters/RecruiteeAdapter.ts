import { AbstractAdapter } from "./AbstractAdapter";
import { RecruiteeAdapterOptions } from "./BaseAdapter";
import { NormalizedJob, AdapterSource } from "../types/normalizedJob";
import { parseJobLocation } from "../utils/parseLocation";
import { parsePostedDate } from "../utils/parsePostedDate";
import { normalizeEmploymentType } from "../utils/normalizeEmploymentType";
import { AdapterRegistry } from "./AdapterRegistry";
import { canonicalizeUrl } from "../url-cleaner";

export interface RawRecruiteeJob {
  id?: number | string;
  title?: string;
  location?: string;
  city?: string;
  country_code?: string;
  careers_url?: string;
  careers_apply_url?: string;
  published_at?: string;
  created_at?: string;
  employment_type_code?: string;
  department?: string;
  description?: string;
  [key: string]: unknown;
}

export class RecruiteeAdapter extends AbstractAdapter<RecruiteeAdapterOptions, RawRecruiteeJob> {
  readonly source: AdapterSource = "recruitee";

  protected async fetchRawJobs(options: RecruiteeAdapterOptions): Promise<RawRecruiteeJob[]> {
    const url = `https://${options.slug}.recruitee.com/api/offers`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Gohyred-CrawlEngine/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Recruitee API responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.offers)) {
      return [];
    }

    return data.offers;
  }

  protected normalizeRawJob(raw: RawRecruiteeJob, options: RecruiteeAdapterOptions): NormalizedJob | null {
    if (!raw || !raw.title) return null;

    const title = String(raw.title).trim();
    const company = options.companyName;
    const rawLoc = raw.location || raw.city || "Remote";
    const { location, isIndiaMatch } = parseJobLocation(rawLoc, raw.country_code);

    if (!isIndiaMatch) {
      return null;
    }

    const sourceJobId = raw.id ? String(raw.id) : "";
    const id = sourceJobId ? `recruitee-${options.slug}-${sourceJobId}` : "";
    const rawUrl = raw.careers_url || raw.careers_apply_url || `https://${options.slug}.recruitee.com`;
    const applyUrl = canonicalizeUrl(rawUrl) || rawUrl;
    const dateResult = parsePostedDate(raw.published_at || raw.created_at);

    return {
      normalizationVersion: 1,
      id,
      title,
      company,
      location,
      postedAt: dateResult.date,
      applyUrl,
      description: raw.description || `${title} at ${company}. Location: ${rawLoc}`,
      employmentType: normalizeEmploymentType(raw.employment_type_code, title),
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

// Self-register Recruitee adapter instance
const recruiteeAdapter = new RecruiteeAdapter();
AdapterRegistry.register(recruiteeAdapter);
