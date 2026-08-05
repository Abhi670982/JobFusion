import { PORTAL_CONFIG } from "../config";

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF-OPEN";

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: CircuitBreakerState = "CLOSED";

  constructor(
    private readonly portal: string,
    private readonly threshold = PORTAL_CONFIG.CIRCUIT_BREAKER_FAILURES,
    private readonly resetTimeoutMs = PORTAL_CONFIG.CIRCUIT_BREAKER_RESET_MS
  ) {}

  getState(): CircuitBreakerState {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = "HALF-OPEN";
      }
    }
    return this.state;
  }

  isCallAllowed(): boolean {
    const currentState = this.getState();
    return currentState !== "OPEN";
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = "OPEN";
    }
  }

  getPortal(): string {
    return this.portal;
  }
}

const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(portal: string): CircuitBreaker {
  if (!circuitBreakers.has(portal)) {
    circuitBreakers.set(portal, new CircuitBreaker(portal));
  }
  return circuitBreakers.get(portal)!;
}
