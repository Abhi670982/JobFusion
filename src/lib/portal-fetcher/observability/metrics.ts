export interface AdapterMetric {
  portal: string;
  durationMs: number;
  success: boolean;
  itemCount: number;
  error?: string;
}

export class MetricsCollector {
  private metrics: AdapterMetric[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;

  recordAdapterExecution(metric: AdapterMetric): void {
    this.metrics.push(metric);
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  getSummary() {
    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const avgDurationMs = totalRequests > 0 
      ? Math.round(this.metrics.reduce((acc, m) => acc + m.durationMs, 0) / totalRequests)
      : 0;

    return {
      totalAdapterRequests: totalRequests,
      successfulRequests,
      failedRequests,
      avgDurationMs,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      adapterDetails: this.metrics,
    };
  }
}

export const createMetricsCollector = () => new MetricsCollector();
