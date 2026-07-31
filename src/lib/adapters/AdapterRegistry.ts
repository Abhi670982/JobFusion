import { AdapterSource } from "../types/normalizedJob";
import { BaseAdapter } from "./BaseAdapter";

class AdapterRegistryImpl {
  private registry = new Map<AdapterSource, BaseAdapter>();

  /**
   * Self-registration entry point for ATS adapters.
   */
  register(adapter: BaseAdapter): void {
    if (!adapter || !adapter.source) {
      throw new Error("Invalid adapter instance provided for registration.");
    }
    this.registry.set(adapter.source, adapter);
  }

  getAdapter<T extends BaseAdapter = BaseAdapter>(source: AdapterSource): T | undefined {
    return this.registry.get(source) as T | undefined;
  }

  getAllAdapters(): BaseAdapter[] {
    return Array.from(this.registry.values());
  }

  hasAdapter(source: AdapterSource): boolean {
    return this.registry.has(source);
  }

  clear(): void {
    this.registry.clear();
  }
}

export const AdapterRegistry = new AdapterRegistryImpl();
