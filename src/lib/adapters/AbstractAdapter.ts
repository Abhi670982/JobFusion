import { NormalizedJob, AdapterSource } from "../types/normalizedJob";
import { BaseAdapter, BaseAdapterOptions, AdapterHealthMetrics } from "./BaseAdapter";
import { validateNormalizedJob } from "../utils/validateJob";

export abstract class AbstractAdapter<
  TOptions extends BaseAdapterOptions = BaseAdapterOptions,
  TRaw = any
> implements BaseAdapter<TOptions> {
  abstract readonly source: AdapterSource;

  protected healthMetrics: AdapterHealthMetrics = {
    requestDurationMs: 0,
    jobsFetched: 0,
    jobsNormalized: 0,
    jobsDiscarded: 0,
  };

  /**
   * Abstract methods to be implemented by provider adapters.
   */
  protected abstract fetchRawJobs(options: TOptions): Promise<TRaw[]>;
  protected abstract normalizeRawJob(raw: TRaw, options: TOptions): NormalizedJob | null;

  async fetchJobs(options: TOptions): Promise<NormalizedJob[]> {
    const startTime = Date.now();
    const normalizedJobs: NormalizedJob[] = [];

    try {
      const rawJobs = await this.fetchRawJobs(options);
      this.healthMetrics.jobsFetched = rawJobs.length;

      let normalizedCount = 0;
      let discardedCount = 0;

      for (const raw of rawJobs) {
        const candidate = this.normalizeRawJob(raw, options);
        if (!candidate) {
          discardedCount++;
          continue;
        }

        const validation = validateNormalizedJob(candidate);
        if (!validation.isValid) {
          discardedCount++;
          if (process.env.NODE_ENV !== "production" || process.env.DEBUG) {
            console.debug(
              `[${this.source.toUpperCase()} Adapter] Discarded job "${candidate.title || "Unknown"}" missing fields: [${validation.missingFields.join(", ")}]`
            );
          }
          continue;
        }

        normalizedJobs.push(candidate);
        normalizedCount++;
      }

      const duration = Date.now() - startTime;
      this.healthMetrics.requestDurationMs = duration;
      this.healthMetrics.jobsNormalized = normalizedCount;
      this.healthMetrics.jobsDiscarded = discardedCount;
      this.healthMetrics.lastSuccessfulFetchAt = new Date();

      return normalizedJobs;
    } catch (err: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : "Fetch failed";
      this.healthMetrics.requestDurationMs = duration;
      this.healthMetrics.lastErrorMessage = errorMessage;
      console.error(`[${this.source.toUpperCase()} Adapter Error]: ${errorMessage}`);
      return [];
    }
  }

  getHealthMetrics(): AdapterHealthMetrics {
    return { ...this.healthMetrics };
  }
}
