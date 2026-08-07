/**
 * Provider Health & Diagnostics Service
 * Tracks live operational status, last success, last error, latency, and quota state
 * for all external crawlers, proxies, and API providers.
 */

export interface ProviderHealthRecord {
  provider: string;
  status: "healthy" | "degraded" | "quota_exceeded" | "error";
  lastSuccess: string | null;
  lastError: string | null;
  latencyMs: number | null;
  quotaStatus: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

class ProviderHealthMonitor {
  private records: Map<string, ProviderHealthRecord> = new Map();

  constructor() {
    this.initProvider("apify");
    this.initProvider("brightdata");
    this.initProvider("serpapi");
    this.initProvider("direct_scraper");
  }

  private initProvider(name: string) {
    if (!this.records.has(name)) {
      this.records.set(name, {
        provider: name,
        status: "healthy",
        lastSuccess: null,
        lastError: null,
        latencyMs: null,
        quotaStatus: "ACTIVE",
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
      });
    }
  }

  public recordSuccess(name: string, latencyMs: number) {
    this.initProvider(name);
    const rec = this.records.get(name)!;
    rec.totalRequests++;
    rec.successfulRequests++;
    rec.lastSuccess = new Date().toISOString();
    rec.latencyMs = latencyMs;
    if (rec.status !== "quota_exceeded") {
      rec.status = "healthy";
    }
  }

  public recordFailure(name: string, errorMsg: string, isQuotaExceeded = false) {
    this.initProvider(name);
    const rec = this.records.get(name)!;
    rec.totalRequests++;
    rec.failedRequests++;
    rec.lastError = `${new Date().toLocaleTimeString()} — ${errorMsg}`;
    
    if (isQuotaExceeded) {
      rec.status = "quota_exceeded";
      rec.quotaStatus = "EXCEEDED";
    } else {
      rec.status = rec.successfulRequests > 0 ? "degraded" : "error";
    }
  }

  public getHealthReport(): ProviderHealthRecord[] {
    return Array.from(this.records.values()).map((r) => {
      // Dynamic quota checks based on env
      if (r.provider === "apify" && !process.env.APIFY_TOKEN) {
        return { ...r, status: "error", quotaStatus: "MISSING_TOKEN" };
      }
      if (r.provider === "serpapi" && !process.env.SERPAPI_KEY) {
        return { ...r, status: "error", quotaStatus: "MISSING_KEY" };
      }
      if (r.provider === "brightdata" && !process.env.BRIGHTDATA_API_KEY) {
        return { ...r, status: "degraded", quotaStatus: "NO_PROXY_KEY" };
      }
      return r;
    });
  }
}

export const providerHealth = new ProviderHealthMonitor();
