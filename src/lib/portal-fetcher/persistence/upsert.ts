import { prisma } from "@/lib/prisma";
import { PortalSource, PortalEmploymentType, PortalExperienceLevel } from "@prisma/client";
import { PortalUnifiedJob } from "../adapters/base-adapter";
import { ConsoleLogger } from "../observability/logger";
import { createHash } from "crypto";

const logger = new ConsoleLogger("PortalUpsertPersistence");

/**
 * Maps raw portal string sources to Prisma PortalSource Enum
 */
function mapPortalSource(source: string): PortalSource {
  const norm = (source || "").toLowerCase().trim();
  if (norm.includes("linkedin")) return PortalSource.linkedin;
  if (norm.includes("indeed")) return PortalSource.indeed;
  if (norm.includes("internshala")) return PortalSource.internshala;
  if (norm.includes("wellfound")) return PortalSource.wellfound;
  return PortalSource.linkedin; // Default fallback
}

/**
 * Maps raw job type string to Prisma PortalEmploymentType Enum
 */
function mapEmploymentType(type?: string | null): PortalEmploymentType | null {
  if (!type) return null;
  const norm = type.toLowerCase().trim();
  if (norm.includes("full")) return PortalEmploymentType.full_time;
  if (norm.includes("part")) return PortalEmploymentType.part_time;
  if (norm.includes("contract")) return PortalEmploymentType.contract;
  if (norm.includes("intern")) return PortalEmploymentType.internship;
  if (norm.includes("free")) return PortalEmploymentType.freelance;
  return null;
}

/**
 * Maps experience level string to Prisma PortalExperienceLevel Enum
 */
function mapExperienceLevel(level?: string | null): PortalExperienceLevel | null {
  if (!level) return null;
  const norm = level.toLowerCase().trim();
  if (norm.includes("entry") || norm.includes("junior") || norm.includes("0-")) return PortalExperienceLevel.entry;
  if (norm.includes("mid") || norm.includes("1-") || norm.includes("2-") || norm.includes("3-")) return PortalExperienceLevel.mid;
  if (norm.includes("senior") || norm.includes("5+") || norm.includes("sr")) return PortalExperienceLevel.senior;
  if (norm.includes("lead") || norm.includes("principal") || norm.includes("head")) return PortalExperienceLevel.lead;
  return null;
}

/**
 * Normalizes skill strings to lowercased, trimmed values
 */
function normalizeSkills(skills: string[]): string[] {
  if (!Array.isArray(skills)) return [];
  const set = new Set<string>();
  for (const s of skills) {
    if (typeof s === "string") {
      const clean = s.toLowerCase().trim();
      if (clean.length > 0) set.add(clean);
    }
  }
  return Array.from(set);
}

/**
 * Generates deterministic dedupe hash if not provided on raw object
 */
function computeDedupeHash(job: PortalUnifiedJob): string {
  if (job.dedupeHash && job.dedupeHash.trim().length > 0) {
    return job.dedupeHash;
  }
  const rawKey = `job_portal-${job.source}-${job.title}-${job.company}-${job.applyUrl || job.sourceUrl}`;
  return createHash("sha256").update(rawKey.toLowerCase()).digest("hex");
}

export interface UpsertPortalJobsResult {
  totalReceived: number;
  upsertedCount: number;
  errorCount: number;
}

/**
 * Batch upserts normalized portal jobs into dedicated `prisma.portalJob` table.
 * Preserves dedupeHash uniqueness and updates postedAt, active status, and metadata.
 */
export async function upsertPortalJobs(jobs: PortalUnifiedJob[]): Promise<UpsertPortalJobsResult> {
  if (!jobs || jobs.length === 0) {
    return { totalReceived: 0, upsertedCount: 0, errorCount: 0 };
  }

  let upsertedCount = 0;
  let errorCount = 0;

  logger.info(`Starting DB batch upsert for ${jobs.length} portal jobs into portal_jobs table.`);

  for (const job of jobs) {
    try {
      const sourceEnum = mapPortalSource(job.source);
      const empTypeEnum = mapEmploymentType(job.employmentType);
      const expLevelEnum = mapExperienceLevel(job.experience);
      const cleanSkills = normalizeSkills(job.skills || []);
      const hash = computeDedupeHash(job);

      const postedAtDate = job.postedDate ? new Date(job.postedDate) : new Date();

      await prisma.portalJob.upsert({
        where: { dedupeHash: hash },
        create: {
          sourceId: job.sourceId || null,
          sourcePortal: sourceEnum,
          sourceUrl: job.sourceUrl || null,
          applyUrl: job.applyUrl || null,
          title: job.title,
          company: job.company,
          companyLogo: job.logo || null,
          location: job.location || "Remote",
          isRemote: Boolean(job.isRemote),
          employmentType: empTypeEnum,
          experienceLevel: expLevelEnum,
          salaryText: job.salary || null,
          salaryMin: job.salaryMin || null,
          salaryMax: job.salaryMax || null,
          description: job.description || null,
          skills: cleanSkills,
          postedAt: postedAtDate,
          isDateless: Boolean(job.isDateless),
          dedupeHash: hash,
          isActive: true,
          fetchedAt: new Date(),
        },
        update: {
          title: job.title,
          company: job.company,
          location: job.location || "Remote",
          applyUrl: job.applyUrl || null,
          salaryText: job.salary || null,
          description: job.description || null,
          skills: cleanSkills,
          postedAt: postedAtDate,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      upsertedCount++;
    } catch (err: any) {
      errorCount++;
      logger.warn(`Failed to upsert portal job "${job.title}" at "${job.company}": ${err.message}`);
    }
  }

  logger.info(`Batch upsert completed: ${upsertedCount} upserted, ${errorCount} failed out of ${jobs.length} total.`);

  return {
    totalReceived: jobs.length,
    upsertedCount,
    errorCount,
  };
}
