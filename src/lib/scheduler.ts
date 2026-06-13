import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import { runSourceSync } from "./pipeline";
import { JobSource } from "./adapters/types";
import { connectDB } from "./mongodb";
import Job from "../models/Job";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const FETCH_KEYWORDS = (process.env.FETCH_KEYWORDS || "software engineer,frontend developer,backend developer").split(",");

let redisClient: IORedis | null = null;
let isRedisConnected = false;

// Initialize Redis and test connection
export async function initRedis(): Promise<boolean> {
  if (redisClient) return isRedisConnected;

  return new Promise((resolve) => {
    try {
      console.log(`[Scheduler] Connecting to Redis at: ${REDIS_URL}`);
      redisClient = new IORedis(REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
      });

      redisClient.on("connect", () => {
        console.log("✅ Redis connected successfully. Enabling BullMQ queues.");
        isRedisConnected = true;
        resolve(true);
      });

      redisClient.on("error", (err) => {
        console.warn(`[Scheduler] Redis connection failed: ${err.message}. Using in-memory fallback scheduler.`);
        isRedisConnected = false;
        resolve(false);
      });
    } catch (err: any) {
      console.warn(`[Scheduler] Redis connection error: ${err.message}. Using in-memory fallback scheduler.`);
      isRedisConnected = false;
      resolve(false);
    }
  });
}

// Keep track of active intervals for in-memory scheduler
const activeIntervals: NodeJS.Timeout[] = [];

// Cleanup jobs older than 60 days
export async function cleanupExpiredJobs() {
  try {
    await connectDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60);

    console.log(`[Scheduler] Cleaning up jobs posted before: ${cutoffDate.toISOString()}`);
    const res = await Job.deleteMany({
      $or: [
        { postedAt: { $lt: cutoffDate } },
        { createdAt: { $lt: cutoffDate } }
      ]
    });
    console.log(`[Scheduler] Expired job cleanup completed. Deleted ${res.deletedCount} jobs.`);
  } catch (err: any) {
    console.error(`[Scheduler] Expired job cleanup failed:`, err.message);
  }
}

// Start the Scheduler
export async function startScheduler() {
  const useRedis = await initRedis();

  if (useRedis && redisClient) {
    // ─── BullMQ Scheduler Mode ───────────────────────────────────────────────
    console.log("[Scheduler] Initializing BullMQ queues and workers...");

    const sources: JobSource[] = ["linkedin", "indeed", "wellfound", "internshala"];
    
    // Define Queue and Workers
    for (const source of sources) {
      const queueName = `${source}-fetch`;
      const queue = new Queue(queueName, { connection: redisClient as any });

      // Worker to process the job
      const worker = new Worker(
        queueName,
        async (job) => {
          console.log(`[Scheduler Worker] Processing queue job for: ${source}`);
          await runSourceSync(source, FETCH_KEYWORDS);
        },
        { connection: redisClient as any }
      );

      worker.on("completed", (job) => {
        console.log(`[Scheduler Worker] Job ${job.id} completed for ${source}.`);
      });

      worker.on("failed", (job, err) => {
        console.error(`[Scheduler Worker] Job ${job?.id} failed for ${source}:`, err.message);
      });

      // Repeatable job configuration
      // LinkedIn: every 2h ('0 */2 * * *')
      // Indeed: every 2h offset by 30m ('30 */2 * * *')
      // Wellfound: every 4h ('0 */4 * * *')
      // Internshala: every 6h ('0 */6 * * *')
      let cronExpression = "0 */6 * * *"; // default
      if (source === "linkedin") cronExpression = "0 */2 * * *";
      else if (source === "indeed") cronExpression = "30 */2 * * *";
      else if (source === "wellfound") cronExpression = "0 */4 * * *";
      else if (source === "internshala") cronExpression = "0 */6 * * *";

      // Add repeatable job to queue
      await queue.add(
        `fetch-repeat-${source}`,
        {},
        {
          repeat: {
            pattern: cronExpression,
          },
        }
      );

      console.log(`[Scheduler] Configured BullMQ cron for ${source}: ${cronExpression}`);
    }

    // Cron queue for cleanup
    const cleanupQueue = new Queue("cleanup-expired-jobs", { connection: redisClient as any });
    new Worker(
      "cleanup-expired-jobs",
      async () => {
        await cleanupExpiredJobs();
      },
      { connection: redisClient as any }
    );
    await cleanupQueue.add("cleanup-repeat", {}, { repeat: { pattern: "0 0 * * *" } }); // daily at midnight
  } else {
    // ─── In-Memory Fallback Mode ─────────────────────────────────────────────
    console.log("[Scheduler] Starting in-memory fallback interval scheduler.");

    // Define intervals (cadence) in milliseconds
    const intervals = {
      linkedin: 2 * 60 * 60 * 1000,     // 2 hours
      indeed: 2 * 60 * 60 * 1000,       // 2 hours
      wellfound: 4 * 60 * 60 * 1000,    // 4 hours
      internshala: 6 * 60 * 60 * 1000,  // 6 hours
      cleanup: 24 * 60 * 60 * 1000      // 24 hours
    };

    // Helper to setup repeatable interval
    const setupInterval = (name: string, fn: () => Promise<any>, time: number) => {
      // Trigger once immediately
      fn().catch((e) => console.error(`[Scheduler Fallback] Initial run failed for ${name}:`, e.message));

      const intervalId = setInterval(async () => {
        console.log(`[Scheduler Fallback] Sync triggered for: ${name}`);
        await fn();
      }, time);

      activeIntervals.push(intervalId);
    };

    setupInterval("linkedin", () => runSourceSync("linkedin", FETCH_KEYWORDS), intervals.linkedin);
    // Offset indeed by 30 mins on first run, then repeat
    setTimeout(() => {
      setupInterval("indeed", () => runSourceSync("indeed", FETCH_KEYWORDS), intervals.indeed);
    }, 30 * 60 * 1000);

    setupInterval("wellfound", () => runSourceSync("wellfound", FETCH_KEYWORDS), intervals.wellfound);
    setupInterval("internshala", () => runSourceSync("internshala", FETCH_KEYWORDS), intervals.internshala);
    setupInterval("cleanup", cleanupExpiredJobs, intervals.cleanup);
  }
}

// Stop all scheduled tasks
export function stopScheduler() {
  console.log("[Scheduler] Shutting down all scheduler intervals...");
  activeIntervals.forEach((intervalId) => clearInterval(intervalId));
  activeIntervals.length = 0;
  if (redisClient) {
    redisClient.quit();
    redisClient = null;
  }
  isRedisConnected = false;
}
