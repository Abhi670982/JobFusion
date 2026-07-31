import { AbstractAdapter } from "./AbstractAdapter";
import { WorkdayAdapterOptions } from "./BaseAdapter";
import { NormalizedJob, AdapterSource } from "../types/normalizedJob";
import { parseJobLocation } from "../utils/parseLocation";
import { parsePostedDate } from "../utils/parsePostedDate";
import { normalizeEmploymentType } from "../utils/normalizeEmploymentType";
import { AdapterRegistry } from "./AdapterRegistry";
import { canonicalizeUrl } from "../url-cleaner";

export interface RawWorkdayJob {
  title?: string;
  externalPath?: string;
  locationsText?: string;
  postedOn?: string;
  bulletFields?: string[];
  [key: string]: unknown;
}

export class WorkdayAdapter extends AbstractAdapter<WorkdayAdapterOptions, RawWorkdayJob> {
  readonly source: AdapterSource = "workday";

  protected async fetchRawJobs(options: WorkdayAdapterOptions): Promise<RawWorkdayJob[]> {
    const url = `https://${options.host}/wday/cxs/${options.tenant}/${options.siteId}/jobs`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "JobFusion-CrawlEngine/1.0",
      },
      body: JSON.stringify({
        searchText: options.keyword || "",
        appliedFacets: {},
        limit: 50,
        offset: 0,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      throw new Error(`Workday API responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.jobPostings)) {
      return [];
    }

    return data.jobPostings;
  }

  protected normalizeRawJob(raw: RawWorkdayJob, options: WorkdayAdapterOptions): NormalizedJob | null {
    if (!raw || !raw.title) return null;

    const title = String(raw.title).trim();
    const company = options.companyName;
    const rawLoc = raw.locationsText || "Remote";
    const { location, isIndiaMatch } = parseJobLocation(rawLoc);

    // Apply strict India filter constraint
    if (!isIndiaMatch) {
      return null;
    }

    const path = raw.externalPath || "";
    const sourceJobId = path.split("/").pop() || path.replace(/[^a-zA-Z0-9_-]/g, "_");
    const id = sourceJobId ? `workday-${options.companyName.toLowerCase()}-${sourceJobId}` : "";

    const rawApplyUrl = path ? `https://${options.host}${path}` : `https://${options.host}/wday/cxs/${options.tenant}/${options.siteId}/jobs`;
    const applyUrl = canonicalizeUrl(rawApplyUrl) || rawApplyUrl;

    const dateResult = parsePostedDate(raw.postedOn);

    return {
      normalizationVersion: 1,
      id,
      title,
      company,
      location,
      postedAt: dateResult.date,
      applyUrl,
      description: `${title} at ${company}. Location: ${rawLoc}`,
      employmentType: normalizeEmploymentType(undefined, title),
      source: this.source,
      metadata: {
        sourceJobId,
        dateConfidence: dateResult.confidence,
        providerRawPayload: raw as Record<string, unknown>,
      },
    };
  }
}

// Self-register Workday adapter instance
const workdayAdapter = new WorkdayAdapter();
AdapterRegistry.register(workdayAdapter);
