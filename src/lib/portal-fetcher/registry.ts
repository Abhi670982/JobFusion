import { BasePortalAdapter, JobPortalSource } from "./adapters/base-adapter";
import { LinkedInPortalAdapter } from "./adapters/linkedin";
import { IndeedPortalAdapter } from "./adapters/indeed";
import { InternshalaPortalAdapter } from "./adapters/internshala";
import { WellfoundPortalAdapter } from "./adapters/wellfound";
import { Logger, defaultLogger } from "./observability/logger";
import { getCircuitBreaker } from "./resilience/circuit-breaker";

export type AdapterHealthStatus = "Healthy" | "Degraded" | "Offline";

class PortalAdapterRegistry {
  private registry = new Map<JobPortalSource, () => BasePortalAdapter>();
  private healthMap = new Map<JobPortalSource, AdapterHealthStatus>();

  constructor() {
    this.register("linkedin", () => new LinkedInPortalAdapter());
    this.register("indeed", () => new IndeedPortalAdapter());
    this.register("internshala", () => new InternshalaPortalAdapter());
    this.register("wellfound", () => new WellfoundPortalAdapter());
  }

  register(source: JobPortalSource, creator: () => BasePortalAdapter) {
    this.registry.set(source, creator);
    this.healthMap.set(source, "Healthy");
  }

  getAdapter(source: JobPortalSource, logger: Logger = defaultLogger): BasePortalAdapter {
    const creator = this.registry.get(source);
    if (!creator) {
      throw new Error(`Portal adapter not registered for source: ${source}`);
    }
    const adapter = creator();
    adapter.setLogger(logger);
    return adapter;
  }

  getAvailableSources(): JobPortalSource[] {
    return Array.from(this.registry.keys());
  }

  updateHealth(source: JobPortalSource, status: AdapterHealthStatus) {
    this.healthMap.set(source, status);
  }

  getHealthSummary(): Record<string, AdapterHealthStatus> {
    const summary: Record<string, AdapterHealthStatus> = {};
    for (const source of this.getAvailableSources()) {
      const cb = getCircuitBreaker(source);
      if (cb.getState() === "OPEN") {
        summary[source] = "Offline";
      } else {
        summary[source] = this.healthMap.get(source) || "Healthy";
      }
    }
    return summary;
  }
}

export const portalRegistry = new PortalAdapterRegistry();
