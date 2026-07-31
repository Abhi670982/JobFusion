import { AbstractAdapter } from "./AbstractAdapter";
import { GreenhouseAdapterOptions } from "./BaseAdapter";
import { NormalizedJob, AdapterSource } from "../types/normalizedJob";
import { parseJobLocation } from "../utils/parseLocation";
import { parsePostedDate } from "../utils/parsePostedDate";
import { normalizeEmploymentType } from "../utils/normalizeEmploymentType";
import { AdapterRegistry } from "./AdapterRegistry";
import { canonicalizeUrl } from "../url-cleaner";

export interface RawGreenhouseJob {
  id?: number | string;
  title?: string;
  location?: { name?: string };
  absolute_url?: string;
  updated_at?: string;
  content?: string;
  departments?: Array<{ name?: string }>;
  [key: string]: unknown;
}

export class GreenhouseAdapter extends AbstractAdapter<GreenhouseAdapterOptions, RawGreenhouseJob> {
  readonly source: AdapterSource = "greenhouse";

  protected async fetchRawJobs(options: GreenhouseAdapterOptions): Promise<RawGreenhouseJob[]> {
    const url = `https://boards-api.greenhouse.io/v1/boards/${options.slug}/jobs?content=true`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "JobFusion-CrawlEngine/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Greenhouse API responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.jobs)) {
      return [];
    }

    return data.jobs;
  }

  protected normalizeRawJob(raw: RawGreenhouseJob, options: GreenhouseAdapterOptions): NormalizedJob | null {
    if (!raw || !raw.title) return null;

    const title = String(raw.title).trim();
    const company = options.companyName;
    const rawLoc = raw.location?.name || "Remote";
    const { location, isIndiaMatch } = parseJobLocation(rawLoc);

    if (!isIndiaMatch) {
      return null;
    }

    const sourceJobId = raw.id ? String(raw.id) : "";
    const id = sourceJobId ? `greenhouse-${options.slug}-${sourceJobId}` : "";
    const rawUrl = raw.absolute_url || "";
    const applyUrl = canonicalizeUrl(rawUrl) || rawUrl;
    const dateResult = parsePostedDate(raw.updated_at);
    const department = raw.departments && raw.departments[0] ? raw.departments[0].name : undefined;

    return {
      normalizationVersion: 1,
      id,
      title,
      company,
      location,
      postedAt: dateResult.date,
      applyUrl,
      description: raw.content || `${title} at ${company}. Location: ${rawLoc}`,
      employmentType: normalizeEmploymentType(undefined, title),
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

// Self-register Greenhouse adapter instance
const greenhouseAdapter = new GreenhouseAdapter();
AdapterRegistry.register(greenhouseAdapter);
