import { prisma } from "./prisma";

export const MAX_JOB_AGE_DAYS = 30;

export interface JobFreshnessInput {
  isActive?: boolean;
  postedAtDate?: Date | string | null;
  expiresAt?: Date | string | null;
  applyUrl?: string | null;
  title?: string | null;
  company?: string | null;
}

/**
 * Single reusable server-side active job validator.
 * Enforces strict freshness and expiration criteria across all endpoints.
 */
export function isJobActive(job: JobFreshnessInput | null | undefined): boolean {
  if (!job) return false;
  if (job.isActive === false) return false;

  const now = new Date();

  // 1. Check Explicit Expiration Date
  if (job.expiresAt) {
    const expDate = new Date(job.expiresAt);
    if (!isNaN(expDate.getTime()) && expDate <= now) {
      return false; // Job explicitly expired
    }
  }

  // 2. Check Posting Date Freshness & Future Date Suspicion
  if (job.postedAtDate) {
    const postDate = new Date(job.postedAtDate);
    if (!isNaN(postDate.getTime())) {
      // Reject suspicious future-dated jobs (> 1 hour in future)
      if (postDate.getTime() > now.getTime() + 60 * 60 * 1000) {
        return false;
      }

      // If expiresAt is null, check MAX_JOB_AGE_DAYS (30 days)
      if (!job.expiresAt) {
        const maxAgeCutoff = new Date(now.getTime() - MAX_JOB_AGE_DAYS * 24 * 60 * 60 * 1000);
        if (postDate < maxAgeCutoff) {
          return false; // Stale job older than 30 days
        }
      }
    }
  }

  return true;
}

/**
 * Returns a standardized Prisma WHERE clause to ensure expired/stale jobs are NEVER returned.
 */
export function getActiveJobWhereClause(additionalWhere: any = {}): any {
  const now = new Date();
  const maxAgeCutoff = new Date(now.getTime() - MAX_JOB_AGE_DAYS * 24 * 60 * 60 * 1000);
  const futureCutoff = new Date(now.getTime() + 60 * 60 * 1000);

  const activeCondition = {
    isActive: true,
    postedAtDate: {
      lte: futureCutoff,
    },
    OR: [
      { expiresAt: { gt: now } },
      {
        AND: [
          { expiresAt: null },
          { postedAtDate: { gte: maxAgeCutoff } }
        ]
      }
    ]
  };

  if (Object.keys(additionalWhere).length === 0) {
    return activeCondition;
  }

  return {
    AND: [
      activeCondition,
      additionalWhere
    ]
  };
}

/**
 * Periodically identifies and deactivates expired / stale jobs in PostgreSQL.
 * Returns the count of newly expired jobs marked inactive.
 */
export async function markExpiredJobsInactive(): Promise<number> {
  const now = new Date();
  const maxAgeCutoff = new Date(now.getTime() - MAX_JOB_AGE_DAYS * 24 * 60 * 60 * 1000);

  try {
    const res = await prisma.job.updateMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: { lte: now } },
          {
            AND: [
              { expiresAt: null },
              { postedAtDate: { lt: maxAgeCutoff } }
            ]
          }
        ]
      },
      data: {
        isActive: false,
      }
    });

    if (res.count > 0) {
      console.log(`[Job Freshness Cleanup] Marked ${res.count} expired/stale jobs as inactive.`);
    }
    return res.count;
  } catch (err: any) {
    console.error("[Job Freshness Cleanup Error]:", err.message || err);
    return 0;
  }
}
