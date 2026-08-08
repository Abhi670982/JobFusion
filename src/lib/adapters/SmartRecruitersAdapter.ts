import { AbstractAdapter } from "./AbstractAdapter";
import { SmartRecruitersAdapterOptions } from "./BaseAdapter";
import { NormalizedJob, AdapterSource } from "../types/normalizedJob";
import { parseJobLocation } from "../utils/parseLocation";
import { parsePostedDate } from "../utils/parsePostedDate";
import { normalizeEmploymentType } from "../utils/normalizeEmploymentType";
import { AdapterRegistry } from "./AdapterRegistry";
import { canonicalizeUrl } from "../url-cleaner";

export interface RawSmartRecruitersJob {
  id?: string;
  name?: string;
  location?: {
    fullLocation?: string;
    city?: string;
    country?: string;
  };
  releasedDate?: string;
  typeOfEmployment?: { label?: string };
  department?: { label?: string };
  [key: string]: unknown;
}

export class SmartRecruitersAdapter extends AbstractAdapter<SmartRecruitersAdapterOptions, RawSmartRecruitersJob> {
  readonly source: AdapterSource = "smartrecruiters";

  protected async fetchRawJobs(options: SmartRecruitersAdapterOptions): Promise<RawSmartRecruitersJob[]> {
    const results: RawSmartRecruitersJob[] = [];
    let offset = 0;
    const limit = 100;

    while (offset < 500) {
      const url = `https://api.smartrecruiters.com/v1/companies/${options.slug}/postings?limit=${limit}&offset=${offset}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "Gohyred-CrawlEngine/1.0" },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        if (offset > 0) break;
        throw new Error(`SmartRecruiters API responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data || !Array.isArray(data.content) || data.content.length === 0) break;

      results.push(...data.content);

      if (data.content.length < limit) break;
      offset += limit;
    }

    return results;
  }

  protected normalizeRawJob(raw: RawSmartRecruitersJob, options: SmartRecruitersAdapterOptions): NormalizedJob | null {
    if (!raw || !raw.name) return null;

    const title = String(raw.name).trim();
    const company = options.companyName;
    const rawLoc = raw.location?.fullLocation || raw.location?.city || "Remote";
    const { location, isIndiaMatch } = parseJobLocation(rawLoc, raw.location?.country);

    if (!isIndiaMatch) {
      return null;
    }

    const sourceJobId = raw.id ? String(raw.id) : "";
    const id = sourceJobId ? `smartrecruiters-${options.slug}-${sourceJobId}` : "";
    const rawUrl = `https://jobs.smartrecruiters.com/${options.slug}/${sourceJobId}`;
    const applyUrl = canonicalizeUrl(rawUrl) || rawUrl;
    const dateResult = parsePostedDate(raw.releasedDate);
    const department = raw.department?.label;

    return {
      normalizationVersion: 1,
      id,
      title,
      company,
      location,
      postedAt: dateResult.date,
      applyUrl,
      description: `${title} at ${company}. Location: ${rawLoc}`,
      employmentType: normalizeEmploymentType(raw.typeOfEmployment?.label, title),
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

// Self-register SmartRecruiters adapter instance
const smartRecruitersAdapter = new SmartRecruitersAdapter();
AdapterRegistry.register(smartRecruitersAdapter);
