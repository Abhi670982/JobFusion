import { NextRequest, NextResponse } from "next/server";

interface RateLimitStore {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitStore>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, store] of memoryStore.entries()) {
    store.timestamps = store.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
    if (store.timestamps.length === 0) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  limit: number;       // Maximum allowed requests
  windowMs: number;    // Time window in milliseconds
  identifier?: string; // Optional custom identifier (e.g. user ID)
}

/**
 * Server-side sliding-window rate limiter for API endpoints.
 * Returns null if request is allowed, or a 429 Too Many Requests response if limit is exceeded.
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const { limit, windowMs, identifier } = options;

  // Extract client IP address or use custom identifier
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const key = identifier ? `id:${identifier}` : `ip:${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();

  let store = memoryStore.get(key);
  if (!store) {
    store = { timestamps: [] };
    memoryStore.set(key, store);
  }

  // Filter timestamps within current window
  store.timestamps = store.timestamps.filter((ts) => now - ts < windowMs);

  if (store.timestamps.length >= limit) {
    const oldestTimestamp = store.timestamps[0];
    const resetTimeMs = oldestTimestamp + windowMs - now;
    const retryAfterSec = Math.ceil(resetTimeMs / 1000);

    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please try again later.",
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil((now + resetTimeMs) / 1000)),
        },
      }
    );
  }

  store.timestamps.push(now);
  return null;
}
