import { AbstractAdapter } from "./AbstractAdapter";
import { LeverAdapterOptions } from "./BaseAdapter";
import { NormalizedJob, AdapterSource } from "../types/normalizedJob";
import { parseJobLocation } from "../utils/parseLocation";
import { parsePostedDate } from "../utils/parsePostedDate";
import { normalizeEmploymentType } from "../utils/normalizeEmploymentType";
import { AdapterRegistry } from "./AdapterRegistry";
import { canonicalizeUrl } from "../url-cleaner";

export interface RawLeverJob {
  id?: string;
  text?: string;
  categories?: {
    location?: string;
    team?: string;
    commitment?: string;
  };
  hostedUrl?: string;
  createdAt?: number | string;
  descriptionPlain?: string;
  [key: string]: unknown;
}

export class LeverAdapter extends AbstractAdapter<LeverAdapterOptions, RawLeverJob> {
  readonly source: AdapterSource = "lever";

  protected async fetchRawJobs(options: LeverAdapterOptions): Promise<RawLeverJob[]> {
    const url = `https://api.lever.co/v0/postings/${options.slug}?mode=json`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "JobFusion-CrawlEngine/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Lever API responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data;
  }

  protected normalizeRawJob(raw: RawLeverJob, options: LeverAdapterOptions): NormalizedJob | null {
    if (!raw || !raw.text) return null;

    const title = String(raw.text).trim();
    const company = options.companyName;
    const rawLoc = raw.categories?.location || "Remote";
    const { location, isIndiaMatch } = parseJobLocation(rawLoc);

    if (!isIndiaMatch) {
      return null;
    }

    const sourceJobId = raw.id ? String(raw.id) : "";
    const id = sourceJobId ? `lever-${options.slug}-${sourceJobId}` : "";
    const rawUrl = raw.hostedUrl || "";
    const applyUrl = canonicalizeUrl(rawUrl) || rawUrl;
    const dateResult = parsePostedDate(raw.createdAt);
    const department = raw.categories?.team;

    return {
      normalizationVersion: 1,
      id,
      title,
      company,
      location,
      postedAt: dateResult.date,
      applyUrl,
      description: raw.descriptionPlain || `${title} at ${company}. Location: ${rawLoc}`,
      employmentType: normalizeEmploymentType(raw.categories?.commitment, title),
      department,
      source: this.source,
      metadata: {
        sourceJobId,
        dateConfidence: dateResult.confidence,
        department,
        providerRawPayload: raw as Record<string, unknown>,
      },
    };
  }
}

// Self-register Lever adapter instance
const leverAdapter = new LeverAdapter();
AdapterRegistry.register(leverAdapter);
