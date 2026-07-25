/**
 * Conservative URL Canonicalization Helper
 * Strips non-identity tracking parameters (utm_*, ref, fbclid, gclid, etc.)
 * while strictly preserving identity-bearing ATS parameters (gh_jid, jobId, id, reqId, etc.)
 */

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "source",
  "trackingid",
  "fbclid",
  "gclid",
  "msclkid",
  "_ga",
  "_gl",
  "ncid",
]);

export function canonicalizeUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);

    // Filter query search parameters
    const params = new URLSearchParams();
    parsed.searchParams.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      // Remove only known non-identity tracking parameters
      if (!TRACKING_PARAMS.has(lowerKey)) {
        params.append(key, val);
      }
    });

    parsed.search = params.toString();

    // Strip trailing slash for consistency
    let clean = parsed.toString();
    if (clean.endsWith("/") && parsed.pathname !== "/") {
      clean = clean.slice(0, -1);
    }

    return clean;
  } catch {
    // If invalid URL structure, return trimmed original string without breaking
    return trimmed;
  }
}
