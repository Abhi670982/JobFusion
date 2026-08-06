import { prisma } from "@/lib/prisma";
import { CrawlStatus } from "@prisma/client";
import { BOOTSTRAP_SEED_SKILLS } from "./config/seed-skills";
import { ConsoleLogger } from "./observability/logger";

const logger = new ConsoleLogger("SkillRegistry");

/**
 * Initializes the TrackedSkill registry with seed skills if no skills are currently tracked.
 */
export async function bootstrapSeedSkills(): Promise<number> {
  const existingCount = await prisma.trackedSkill.count();
  if (existingCount > 0) {
    return existingCount;
  }

  logger.info(`Bootstrapping TrackedSkill registry with ${BOOTSTRAP_SEED_SKILLS.length} seed skills.`);

  let created = 0;
  for (const skill of BOOTSTRAP_SEED_SKILLS) {
    const norm = skill.toLowerCase().trim();
    try {
      await prisma.trackedSkill.upsert({
        where: { name: norm },
        create: {
          name: norm,
          demandCount: 5, // Baseline seed demand
          isSeed: true,
          crawlStatus: CrawlStatus.idle,
        },
        update: {},
      });
      created++;
    } catch (err: any) {
      logger.warn(`Failed to seed skill "${norm}": ${err.message}`);
    }
  }

  return created;
}

/**
 * Records real user demand for skills (extracted from search queries or user resume profiles).
 * Increments `demandCount` and updates `lastDemandAt`.
 */
export async function recordSkillDemand(skills: string[]): Promise<void> {
  if (!skills || skills.length === 0) return;

  for (const rawSkill of skills) {
    const norm = rawSkill.toLowerCase().trim();
    if (!norm || norm.length < 2) continue;

    try {
      await prisma.trackedSkill.upsert({
        where: { name: norm },
        create: {
          name: norm,
          demandCount: 1,
          isSeed: false,
          lastDemandAt: new Date(),
          crawlStatus: CrawlStatus.idle,
        },
        update: {
          demandCount: { increment: 1 },
          lastDemandAt: new Date(),
        },
      });
    } catch (err: any) {
      logger.warn(`Failed to record skill demand for "${norm}": ${err.message}`);
    }
  }
}

/**
 * Retrieves top-demand skills for the daily crawler scheduler.
 */
export async function getSkillsToCrawl(limit = 10): Promise<string[]> {
  await bootstrapSeedSkills();

  const skills = await prisma.trackedSkill.findMany({
    where: {
      crawlStatus: {
        not: CrawlStatus.crawling,
      },
    },
    orderBy: [
      { demandCount: "desc" },
      { lastDemandAt: "desc" },
    ],
    take: limit,
  });

  return skills.map(s => s.name);
}

/**
 * Updates operational metadata for a skill crawl run.
 */
export async function updateSkillCrawlStatus(
  skillName: string,
  status: CrawlStatus
) {
  const norm = skillName.toLowerCase().trim();
  return prisma.trackedSkill.update({
    where: { name: norm },
    data: {
      crawlStatus: status,
      lastCrawledAt: status === CrawlStatus.success ? new Date() : undefined,
    },
  });
}
