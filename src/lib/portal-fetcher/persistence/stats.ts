import { prisma } from "@/lib/prisma";

export interface PortalDatabaseStats {
  totalActivePortalJobs: number;
  totalInactivePortalJobs: number;
  portalCounts: Record<string, number>;
  oldestActiveJobDate: Date | null;
  newestActiveJobDate: Date | null;
}

/**
 * Telemetry service to fetch summary metrics of the dedicated `portal_jobs` dataset.
 */
export async function getPortalDatabaseStats(): Promise<PortalDatabaseStats> {
  const [activeCount, inactiveCount, grouped, bounds] = await Promise.all([
    prisma.portalJob.count({ where: { isActive: true } }),
    prisma.portalJob.count({ where: { isActive: false } }),
    prisma.portalJob.groupBy({
      by: ["sourcePortal"],
      where: { isActive: true },
      _count: { _all: true },
    }),
    prisma.portalJob.aggregate({
      where: { isActive: true },
      _min: { postedAt: true },
      _max: { postedAt: true },
    }),
  ]);

  const portalCounts: Record<string, number> = {};
  for (const group of grouped) {
    portalCounts[group.sourcePortal] = group._count._all;
  }

  return {
    totalActivePortalJobs: activeCount,
    totalInactivePortalJobs: inactiveCount,
    portalCounts,
    oldestActiveJobDate: bounds._min.postedAt,
    newestActiveJobDate: bounds._max.postedAt,
  };
}
