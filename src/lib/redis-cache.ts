import { JobSourceCategory } from "@prisma/client";
import { getRedisClient } from "./queue";

/**
 * Category-Aware Redis Caching System
 * Ensures cache keys strictly isolate COMPANY_CAREER and JOB_PORTAL entries to prevent cross-category leakage.
 */

export function buildCacheKey(
  category: JobSourceCategory,
  query: string,
  location: string,
  page: number,
  extraFilter = ""
): string {
  const normCategory = category;
  const normQuery = (query || "all").toLowerCase().trim().replace(/\s+/g, "_");
  const normLoc = (location || "india").toLowerCase().trim().replace(/\s+/g, "_");
  const filterHash = extraFilter ? `:${extraFilter}` : "";

  return `jobs:${normCategory}:${normQuery}:${normLoc}:p${page}${filterHash}`;
}

export async function getCachedCategoryJobs<T>(cacheKey: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const cachedData = await redis.get(cacheKey);
    if (!cachedData) return null;
    return JSON.parse(cachedData) as T;
  } catch (err: any) {
    console.warn(`[Redis Cache] Error reading cache key "${cacheKey}":`, err.message);
    return null;
  }
}

export async function setCachedCategoryJobs<T>(
  cacheKey: string,
  data: T,
  ttlSeconds = 900 // 15 minutes TTL
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.set(cacheKey, JSON.stringify(data), "EX", ttlSeconds);
  } catch (err: any) {
    console.warn(`[Redis Cache] Error writing cache key "${cacheKey}":`, err.message);
  }
}
