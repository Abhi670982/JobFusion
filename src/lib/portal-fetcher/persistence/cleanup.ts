import { prisma } from "@/lib/prisma";
import { ConsoleLogger } from "../observability/logger";

const logger = new ConsoleLogger("PortalCleanupPersistence");

export interface LifecycleCleanupResult {
  deactivatedCount: number;
  purgedCount: number;
  cutoffDate7Days: Date;
  cutoffDate14Days: Date;
}

/**
 * Soft Lifecycle Management Strategy:
 * 1. Soft Expiration: Marks portal jobs posted older than 7 days as `isActive = false`.
 *    Excluded from API search queries while preserving historical data.
 * 2. Hard Retention Purge: Deletes inactive portal jobs older than 14 days to bound table size.
 */
export async function applyPortalJobLifecycleCleanup(): Promise<LifecycleCleanupResult> {
  const now = new Date();
  
  // 7-day rolling window cutoff date
  const cutoff7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // 14-day retention purge cutoff date
  const cutoff14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  logger.info(`Starting portal job lifecycle cleanup. 7-day cutoff: ${cutoff7Days.toISOString()}`);

  // Stage 1: Soft expire jobs older than 7 days
  const deactivateResult = await prisma.portalJob.updateMany({
    where: {
      isActive: true,
      postedAt: {
        lt: cutoff7Days,
      },
    },
    data: {
      isActive: false,
    },
  });

  logger.info(`Soft expired ${deactivateResult.count} portal jobs older than 7 days.`);

  // Stage 2: Purge inactive records older than 14 days
  const purgeResult = await prisma.portalJob.deleteMany({
    where: {
      isActive: false,
      updatedAt: {
        lt: cutoff14Days,
      },
    },
  });

  logger.info(`Hard purged ${purgeResult.count} inactive portal jobs older than 14 days.`);

  return {
    deactivatedCount: deactivateResult.count,
    purgedCount: purgeResult.count,
    cutoffDate7Days: cutoff7Days,
    cutoffDate14Days: cutoff14Days,
  };
}
