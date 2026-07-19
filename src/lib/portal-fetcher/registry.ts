import { BasePortalAdapter, JobPortalSource } from "./adapters/base-adapter";
import { LinkedInPortalAdapter } from "./adapters/linkedin";
import { IndeedPortalAdapter } from "./adapters/indeed";
import { InternshalaPortalAdapter } from "./adapters/internshala";
import { WellfoundPortalAdapter } from "./adapters/wellfound";

class PortalAdapterRegistry {
  private registry = new Map<JobPortalSource, () => BasePortalAdapter>();

  constructor() {
    this.register("linkedin", () => new LinkedInPortalAdapter());
    this.register("indeed", () => new IndeedPortalAdapter());
    this.register("internshala", () => new InternshalaPortalAdapter());
    this.register("wellfound", () => new WellfoundPortalAdapter());
  }

  register(source: JobPortalSource, creator: () => BasePortalAdapter) {
    this.registry.set(source, creator);
  }

  getAdapter(source: JobPortalSource): BasePortalAdapter {
    const creator = this.registry.get(source);
    if (!creator) {
      throw new Error(`Portal adapter not registered for source: ${source}`);
    }
    return creator();
  }

  getAvailableSources(): JobPortalSource[] {
    return Array.from(this.registry.keys());
  }
}

export const portalRegistry = new PortalAdapterRegistry();
