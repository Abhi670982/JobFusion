// ============================================================
// lib/analytics.ts — Monetization & Premium Portal Analytics
// ============================================================

export type MonetizationEventName =
  | 'Premium Job Click'
  | 'Premium Modal Opened'
  | 'Upgrade Clicked'
  | 'Pricing Clicked'
  | 'Modal Closed'
  | 'Portal Click Attempt';

export interface MonetizationEventPayload {
  userId?: string;
  jobId?: string;
  jobTitle?: string;
  company?: string;
  portal?: string;
  source?: string;
  sourceCategory?: string;
  userTier?: 'free' | 'pro';
  timestamp?: string;
  [key: string]: any;
}

/**
 * Track monetization and portal engagement events.
 */
export function trackMonetizationEvent(
  eventName: MonetizationEventName,
  payload: MonetizationEventPayload = {}
): void {
  const eventData = {
    event: eventName,
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  // 1. Console debug output in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Analytics] 📊 ${eventName}`, eventData);
  }

  // 2. Transmit to server activity logger if user / job details are attached
  if (typeof window !== 'undefined' && (payload.userId || payload.jobId)) {
    try {
      fetch('/api/admin/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: eventName,
          details: JSON.stringify(eventData),
        }),
      }).catch(() => {});
    } catch {
      // Non-blocking telemetry
    }
  }
}
