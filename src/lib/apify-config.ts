import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local" });

export interface ApifyActorConfig {
  linkedin: string;
  wellfound: string;
  indeed: string;
  naukri: string;
  foundit: string;
}

/**
 * Centralized Apify Actor Configuration
 * Configured with verified Apify Store actors.
 * Overridable via environment variables.
 */
export const apifyActors: ApifyActorConfig = {
  linkedin: process.env.APIFY_LINKEDIN_ACTOR || "valig/linkedin-jobs-scraper",
  wellfound: process.env.APIFY_WELLFOUND_ACTOR || "orgupdate/wellfound-jobs-scraper",
  indeed: process.env.APIFY_INDEED_ACTOR || "valig/indeed-jobs-scraper",
  naukri: process.env.APIFY_NAUKRI_ACTOR || "valig/naukri-jobs-scraper",
  foundit: process.env.APIFY_FOUNDIT_ACTOR || "easyapi/foundit-jobs-scraper",
};

/**
 * Secondary backup Apify actors when primary actor fails or hits limits.
 */
export const backupApifyActors: ApifyActorConfig = {
  linkedin: "cheap_scraper/linkedin-job-scraper",
  wellfound: "crawlerbros/wellfound-scraper",
  indeed: "misceres/indeed-scraper",
  naukri: "easyapi/naukri-jobs-scraper",
  foundit: "themineworks/foundit-jobs-scraper",
};

/**
 * Cache for actor verification statuses to avoid redundant HTTP calls.
 */
const actorVerificationCache = new Map<string, { valid: boolean; title?: string; error?: string }>();

/**
 * Verifies that a target Apify actor exists and the token has access.
 * Fails loudly with clear diagnostic message if actor ID is invalid or returns HTTP 404.
 */
export async function verifyApifyActor(
  actorId: string,
  token: string
): Promise<{ valid: boolean; title?: string; error?: string }> {
  if (!actorId) {
    return { valid: false, error: "Actor ID is empty in configuration." };
  }
  if (!token) {
    return { valid: false, error: "APIFY_TOKEN environment variable is missing." };
  }

  const cacheKey = `${actorId}:${token}`;
  if (actorVerificationCache.has(cacheKey)) {
    return actorVerificationCache.get(cacheKey)!;
  }

  const encodedActorId = encodeURIComponent(actorId);
  const url = `https://api.apify.com/v2/acts/${encodedActorId}?token=${token}`;

  try {
    const res = await fetch(url, { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      const title = data.data?.title || data.data?.name || actorId;
      const result = { valid: true, title };
      actorVerificationCache.set(cacheKey, result);
      return result;
    }

    if (res.status === 404) {
      const result = {
        valid: false,
        error: `INVALID_ACTOR_ID: Apify actor "${actorId}" does not exist or was deleted/misspelled (HTTP 404).`,
      };
      actorVerificationCache.set(cacheKey, result);
      return result;
    }

    if (res.status === 401 || res.status === 403) {
      const result = {
        valid: false,
        error: `APIFY_AUTH_FAILED: Token unauthorized to access actor "${actorId}" (HTTP ${res.status}).`,
      };
      actorVerificationCache.set(cacheKey, result);
      return result;
    }

    const result = {
      valid: false,
      error: `APIFY_ACTOR_ERROR: Verification returned HTTP ${res.status}`,
    };
    actorVerificationCache.set(cacheKey, result);
    return result;
  } catch (err: any) {
    return { valid: false, error: `NETWORK_ERROR: Failed verifying Apify actor "${actorId}": ${err.message}` };
  }
}
