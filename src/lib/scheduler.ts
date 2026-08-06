import { JobSourceCategory } from "@prisma/client";
import { getCrawlQueue, enqueueCrawlJob } from "./queue";

/**
 * BullMQ Scheduler Configuration for Company Careers
 * Cadence: Every 8 hours (3 times per day)
 * Timezone/UTC behavior: BullMQ intervals and cron expressions evaluate in UTC system time.
 * An interval of 8 hours (28,800,000 ms) executes reliably 3 times per 24-hour cycle UTC.
 */
export const CAREERS_SCHEDULER_ID = "careers-scheduled-crawl-scheduler";
export const CAREERS_SCHEDULE_EVERY_MS = 8 * 60 * 60 * 1000; // 8 hours in ms

export interface SchedulerRegisterResult {
  registered: boolean;
  schedulerId: string;
  cadenceMs: number;
  cadenceHours: number;
  runsPerDay: number;
}

/**
 * Registers/upserts the recurring Company Careers background acquisition job into BullMQ.
 * Strictly idempotent: BullMQ's upsertJobScheduler API overwrites any existing scheduler
 * identified by CAREERS_SCHEDULER_ID, preventing duplicate recurring schedules across worker restarts.
 */
export async function registerCareersScheduler(): Promise<SchedulerRegisterResult> {
  const queue = getCrawlQueue();
  
  if (!queue) {
    console.warn("[Scheduler] Redis unavailable. Recurring Company Careers schedule could not be registered in BullMQ.");
    return {
      registered: false,
      schedulerId: CAREERS_SCHEDULER_ID,
      cadenceMs: CAREERS_SCHEDULE_EVERY_MS,
      cadenceHours: 8,
      runsPerDay: 3,
    };
  }

  try {
    await queue.upsertJobScheduler(
      CAREERS_SCHEDULER_ID,
      {
        every: CAREERS_SCHEDULE_EVERY_MS,
      },
      {
        name: "scheduled-careers-crawl",
        data: {
          category: JobSourceCategory.COMPANY_CAREER,
          provider: "CAREERS",
          keyword: "software engineer",
          location: "India",
        },
        opts: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 3000,
          },
          removeOnComplete: { age: 900 }, // 15 mins retention
          removeOnFail: { age: 3600 },
        },
      }
    );

    console.log(
      `[Scheduler] Idempotently registered recurring Company Careers acquisition scheduler: "${CAREERS_SCHEDULER_ID}" (Cadence: Every 8h / 3x daily UTC).`
    );

    return {
      registered: true,
      schedulerId: CAREERS_SCHEDULER_ID,
      cadenceMs: CAREERS_SCHEDULE_EVERY_MS,
      cadenceHours: 8,
      runsPerDay: 3,
    };
  } catch (err: any) {
    console.error(`[Scheduler Error] Failed to register careers scheduler: ${err.message}`);
    return {
      registered: false,
      schedulerId: CAREERS_SCHEDULER_ID,
      cadenceMs: CAREERS_SCHEDULE_EVERY_MS,
      cadenceHours: 8,
      runsPerDay: 3,
    };
  }
}

/**
 * Helper to safely trigger ONE scheduled-equivalent Company Careers crawl manually
 * for local testing/verification without waiting 8 hours.
 */
export async function triggerManualScheduledCrawl(): Promise<{ enqueued: boolean; jobId: string }> {
  console.log("[Scheduler] Manually triggering one scheduled-equivalent Company Careers crawl...");
  return enqueueCrawlJob({
    category: JobSourceCategory.COMPANY_CAREER,
    provider: "CAREERS",
    keyword: "software engineer",
    location: "India",
  });
}

/**
 * BullMQ Scheduler Configuration for Job Portals
 * Cadence: Daily at 12:00 AM IST (Asia/Kolkata timezone)
 */
export const PORTALS_SCHEDULER_ID = "portals-scheduled-crawl-scheduler";
export const PORTALS_SCHEDULE_EVERY_MS = 24 * 60 * 60 * 1000; // 24 hours in ms

export async function registerPortalsScheduler(): Promise<SchedulerRegisterResult> {
  const queue = getCrawlQueue();

  if (!queue) {
    console.warn("[Scheduler] Redis unavailable. Recurring Job Portals schedule could not be registered in BullMQ.");
    return {
      registered: false,
      schedulerId: PORTALS_SCHEDULER_ID,
      cadenceMs: PORTALS_SCHEDULE_EVERY_MS,
      cadenceHours: 24,
      runsPerDay: 1,
    };
  }

  try {
    await queue.upsertJobScheduler(
      PORTALS_SCHEDULER_ID,
      {
        pattern: "0 0 * * *",
        tz: "Asia/Kolkata",
      },
      {
        name: "scheduled-portals-crawl",
        data: {
          category: JobSourceCategory.JOB_PORTAL,
          provider: "ALL",
          keyword: "tech_roles_daily_crawl",
          location: "India",
        },
        opts: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 86400 },
        },
      }
    );

    console.log(
      `[Scheduler] Idempotently registered recurring Job Portals acquisition scheduler: "${PORTALS_SCHEDULER_ID}" (Cadence: Daily at 12:00 AM IST, Asia/Kolkata).`
    );

    return {
      registered: true,
      schedulerId: PORTALS_SCHEDULER_ID,
      cadenceMs: PORTALS_SCHEDULE_EVERY_MS,
      cadenceHours: 24,
      runsPerDay: 1,
    };
  } catch (err: any) {
    console.error(`[Scheduler Error] Failed to register portals scheduler: ${err.message}`);
    return {
      registered: false,
      schedulerId: PORTALS_SCHEDULER_ID,
      cadenceMs: PORTALS_SCHEDULE_EVERY_MS,
      cadenceHours: 24,
      runsPerDay: 1,
    };
  }
}

