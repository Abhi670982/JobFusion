import { Queue } from "bullmq";
import IORedis from "ioredis";
import { JobSourceCategory } from "@prisma/client";
import { crawlPortalJobs } from "./portal-fetcher/crawler";
import { runSourceSync } from "./pipeline";
import { JobSource } from "./adapters/types";
import { classifySourceCategory } from "./source-category";

const REDIS_URL = process.env.REDIS_URL || "";

let redisClient: IORedis | null = null;
let crawlQueue: Queue | null = null;

export const CRAWL_QUEUE_NAME = "background-crawl-queue";
const devActiveLocks = new Set<string>();

export function getRedisClient(): IORedis | null {
  if (!redisClient && process.env.REDIS_URL) {
    try {
      redisClient = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        // Support Upstash rediss:// connections smoothly
        tls: process.env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
      });
      redisClient.on("error", (err) => {
        // Log clean error without exposing credentials
        console.warn(`[Redis Queue] Redis connection error: ${err.message}`);
      });
    } catch (err: any) {
      console.warn(`[Redis Queue] Failed to initialize Redis client: ${err.message}`);
      redisClient = null;
    }
  }
  return redisClient;
}

export function getCrawlQueue(): Queue | null {
  const redis = getRedisClient();
  if (redis && !crawlQueue) {
    crawlQueue = new Queue(CRAWL_QUEUE_NAME, { connection: redis as any });
  }
  return crawlQueue;
}

export interface EnqueueCrawlParams {
  category: JobSourceCategory;
  provider: string;
  keyword: string;
  location?: string;
  userId?: string;
}

/**
 * Normalizes query & location strings for deterministic BullMQ-safe job ID generation.
 * Replaces colons and special characters with hyphens to satisfy BullMQ custom ID requirements.
 */
export function normalizeCrawlKey(params: EnqueueCrawlParams): string {
  const normCategory = params.category;
  const normProvider = (params.provider || "ALL").toUpperCase().trim().replace(/[^A-Z0-9_-]/g, "_");
  const normKeyword = (params.keyword || "software engineer").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
  const normLocation = (params.location || "india").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
  
  // Safe BullMQ job ID format without colons
  return `crawl-${normCategory}-${normProvider}-${normKeyword}-${normLocation}`;
}

/**
 * Distributed BullMQ Crawl Enqueue with Deterministic Job IDs
 * Prevents 400 concurrent requests for the same query from creating 400 external crawls.
 */
export async function enqueueCrawlJob(params: EnqueueCrawlParams): Promise<{ enqueued: boolean; jobId: string }> {
  const jobId = normalizeCrawlKey(params);
  const queue = getCrawlQueue();

  if (queue) {
    try {
      // Check existing job status in Redis for deduplication
      const existingJob = await queue.getJob(jobId);
      if (existingJob) {
        const state = await existingJob.getState();
        if (state === "waiting" || state === "active" || state === "delayed") {
          console.log(`[Queue] Crawl job ${jobId} already active in BullMQ (${state}). Deduplicated.`);
          return { enqueued: false, jobId };
        }
      }

      // BullMQ deduplicates jobs with identical jobId if waiting/active
      await queue.add(
        "crawl-task",
        {
          category: params.category,
          provider: params.provider,
          keyword: params.keyword,
          location: params.location || "India",
          userId: params.userId,
        },
        {
          jobId, // Deterministic safe identity without colons
          deduplication: {
            id: jobId,
          },
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 3000,
          },
          removeOnComplete: { age: 900 }, // 15 mins retention
          removeOnFail: { age: 3600 },
        }
      );
      console.log(`[Queue] Successfully enqueued distributed BullMQ job: ${jobId}`);
      return { enqueued: true, jobId };
    } catch (err: any) {
      if (err.message?.includes("Job already exists") || err.message?.includes("id already exists")) {
        console.log(`[Queue] Crawl job ${jobId} already active/waiting in queue (deduplicated).`);
        return { enqueued: false, jobId };
      }
      
      // CRITICAL: If Redis is connected but BullMQ enqueue fails, DO NOT fall back to in-process execution!
      console.error(`[Queue Error] BullMQ enqueue failed for ${jobId}: ${err.message}`);
      return { enqueued: false, jobId };
    }
  }

  // Production Safety Policy: Never execute expensive crawls inside HTTP server process in Production!
  if (process.env.NODE_ENV === "production") {
    console.error(`[Queue Infrastructure Error] Production REDIS_URL unavailable. Cannot enqueue ${jobId}. HTTP response will serve existing database records.`);
    return { enqueued: false, jobId };
  }

  // Development Fallback Lock Check (Deduplication for offline dev without Redis)
  if (devActiveLocks.has(jobId)) {
    console.log(`[Queue Dev Dedupe] Crawl job ${jobId} already active in dev fallback queue.`);
    return { enqueued: false, jobId };
  }

  devActiveLocks.add(jobId);
  setTimeout(() => devActiveLocks.delete(jobId), 900000); // 15 mins lock

  // Explicit warning ONLY when REDIS_URL is genuinely absent in development
  console.warn(`[Queue Dev Warning] REDIS_URL not configured in environment. Running dev-only unawaited background task for ${jobId}. Start Redis & worker via 'npm run worker' for production execution.`);
  setTimeout(() => {
    executeBackgroundCrawl(params)
      .catch(e => console.error(`[Queue Dev Fallback] Crawl execution error:`, e.message))
      .finally(() => devActiveLocks.delete(jobId));
  }, 10);

  return { enqueued: true, jobId };
}

/**
 * Service function to execute background crawl task.
 * Called by BullMQ Worker in production and dev fallback when offline.
 */
export async function executeBackgroundCrawl(params: EnqueueCrawlParams): Promise<void> {
  const { category, provider, keyword, location } = params;

  // Strict Payload & Provider Validation
  const classified = classifySourceCategory(provider);

  // Non-destructive test job handler
  if (provider?.toUpperCase() === "TEST" || keyword?.toLowerCase().includes("test_dedupe") || keyword?.toLowerCase().includes("test_key")) {
    console.log(`[Worker Test Handler] Isolated test job "${keyword}" executed non-destructively.`);
    return;
  }

  if (category === JobSourceCategory.COMPANY_CAREER) {
    if (classified.category === JobSourceCategory.JOB_PORTAL) {
      throw new Error(`[Worker Security Violation] Rejected attempt to run JOB_PORTAL provider "${provider}" under COMPANY_CAREER category.`);
    }
    const sourceKey = (provider.toLowerCase() || "careers") as JobSource;
    await runSourceSync(sourceKey, [keyword]);
  } else if (category === JobSourceCategory.JOB_PORTAL) {
    if (classified.category === JobSourceCategory.COMPANY_CAREER) {
      throw new Error(`[Worker Security Violation] Rejected attempt to run COMPANY_CAREER provider "${provider}" under JOB_PORTAL category.`);
    }
    const portalSource = provider.toLowerCase();
    
    // Aggregator provider runs through pipeline aggregator adapter under JOB_PORTAL category
    if (portalSource === "aggregator") {
      await runSourceSync("aggregator", [keyword]);
    } else {
      await crawlPortalJobs({
        portal: portalSource === "all" ? "all" : (portalSource as any),
        keyword,
        location: location || "India",
        page: 1,
      });
    }
  } else {
    throw new Error(`[Worker Validation Error] Invalid sourceCategory "${category}". Must be COMPANY_CAREER or JOB_PORTAL.`);
  }
}
