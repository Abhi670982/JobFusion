import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { executeBackgroundCrawl, EnqueueCrawlParams, CRAWL_QUEUE_NAME } from "../lib/queue";
import { registerCareersScheduler } from "../lib/scheduler";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CONCURRENCY = parseInt(process.env.CRAWL_WORKER_CONCURRENCY || "3", 10);

console.log("------------------------------------------------------------");
console.log("[Crawl Worker] Starting Dedicated BullMQ Background Crawler Worker Process...");
console.log(`[Crawl Worker] Connecting to Redis: ${REDIS_URL.replace(/:[^:@]+@/, ":****@")}`);
console.log(`[Crawl Worker] Concurrency limit: ${CONCURRENCY}`);
console.log("------------------------------------------------------------");

const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ Worker
  connectTimeout: 5000,
  tls: REDIS_URL.startsWith("rediss://") ? {} : undefined,
});

redisConnection.on("connect", () => {
  console.log(`✅ [Crawl Worker] Redis connected successfully. Listening on queue: "${CRAWL_QUEUE_NAME}"`);
  // Register recurring Company Careers 3x/day schedule idempotently
  registerCareersScheduler().catch((err) => {
    console.error("[Crawl Worker] Failed to register careers scheduler:", err.message);
  });
});

redisConnection.on("error", (err) => {
  console.error(`❌ [Crawl Worker] Redis connection error: ${err.message}`);
});

// Dedicated BullMQ Worker Instance
export const crawlWorker = new Worker<EnqueueCrawlParams>(
  CRAWL_QUEUE_NAME,
  async (job: Job<EnqueueCrawlParams>) => {
    console.log(`\n[Crawl Worker] Executing Job ID: "${job.id}" (Attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3})`);
    console.log(`[Crawl Worker] Payload:`, {
      category: job.data.category,
      provider: job.data.provider,
      keyword: job.data.keyword,
      location: job.data.location,
    });

    // Validate Payload
    if (!job.data.category || !job.data.provider || !job.data.keyword) {
      throw new Error(`[Crawl Worker] Invalid job payload: missing category, provider, or keyword.`);
    }

    // Execute Crawl Service
    await executeBackgroundCrawl(job.data);
  },
  {
    connection: redisConnection as any,
    concurrency: CONCURRENCY,
  }
);

// Worker Lifecycle & Transition Event Handlers
crawlWorker.on("active", (job: Job) => {
  console.log(`⚡ [Job Transition] Job "${job.id}" updated state: WAITING ➔ ACTIVE`);
});

crawlWorker.on("completed", (job: Job) => {
  console.log(`✅ [Job Transition] Job "${job.id}" updated state: ACTIVE ➔ COMPLETED`);
});

crawlWorker.on("failed", (job: Job | undefined, err: Error) => {
  console.error(`❌ [Job Transition] Job "${job?.id || 'unknown'}" updated state: ACTIVE ➔ FAILED`);
  console.error(`   Reason: ${err.message}`);
});

crawlWorker.on("error", (err: Error) => {
  // Only log unexpected internal errors without spamming connection errors
  if (!err.message?.includes("ECONNRESET")) {
    console.error(`💥 [Crawl Worker Internal Error]`, err.message);
  }
});

// Graceful Shutdown Handlers
async function shutdown(signal: string) {
  console.log(`\n[Crawl Worker] Received ${signal}. Initiating graceful shutdown...`);
  try {
    await crawlWorker.close();
    await redisConnection.quit();
    console.log(`[Crawl Worker] Worker and Redis connections closed cleanly. Exiting.`);
    process.exit(0);
  } catch (err: any) {
    console.error(`[Crawl Worker] Error during shutdown:`, err.message);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
