import { JobSourceCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { classifySourceCategory } from "@/lib/source-category";
import { calculateRelevanceScore } from "@/lib/relevance";
import { canonicalizeUrl } from "@/lib/url-cleaner";
import crypto from "crypto";

export interface PersistMetrics {
  jobsDiscovered: number;
  jobsInserted: number;
  jobsUpdated: number;
  duplicatesSkipped: number;
}

export async function persistPortalJobs(
  jobs: any[],
  userId?: string,
  userSkills: string[] = []
): Promise<PersistMetrics> {
  if (!jobs || jobs.length === 0) {
    return { jobsDiscovered: 0, jobsInserted: 0, jobsUpdated: 0, duplicatesSkipped: 0 };
  }

  let jobsInserted = 0;
  let jobsUpdated = 0;
  let duplicatesSkipped = 0;

  const lowerSkills = userSkills.map(s => s.toLowerCase().trim());
  const BATCH_SIZE = 50;

  // 1. In-Memory Multi-Field Deduplication
  const preparedJobs: any[] = [];
  const seenHashes = new Set<string>();

  for (const job of jobs) {
    const rawSource = job.source || "linkedin";
    const classified = classifySourceCategory(rawSource, job.sourceProvider);

    // Enforce JOB_PORTAL category
    if (classified.category !== JobSourceCategory.JOB_PORTAL) {
      continue;
    }

    const matchScore = calculateRelevanceScore(
      {
        title: job.title,
        skills: job.skills,
        description: job.description,
        requirements: job.requirements,
      },
      userSkills
    );

    const canonicalApplyUrl = canonicalizeUrl(job.applyUrl);
    const canonicalSourceUrl = canonicalizeUrl(job.sourceUrl) || canonicalApplyUrl;
    
    // Multi-field deduplication hash
    const hashInput = `job_portal-${rawSource}-${job.sourceId || ""}-${canonicalApplyUrl || ""}-${canonicalSourceUrl || ""}-${job.title}-${job.company}-${job.location || ""}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(hashInput).digest("hex");

    if (seenHashes.has(dedupeHash)) {
      duplicatesSkipped++;
      continue;
    }
    seenHashes.add(dedupeHash);

    const parsedPostedDate = job.postedDate && !isNaN(new Date(job.postedDate).getTime())
      ? new Date(job.postedDate)
      : null;

    preparedJobs.push({
      job,
      classified,
      dedupeHash,
      canonicalApplyUrl,
      canonicalSourceUrl,
      parsedPostedDate,
      matchScore,
    });
  }

  // 2. Controlled Transaction Batching
  for (let i = 0; i < preparedJobs.length; i += BATCH_SIZE) {
    const batch = preparedJobs.slice(i, i + BATCH_SIZE);

    try {
      await prisma.$transaction(async (tx) => {
        for (const item of batch) {
          const { job, classified, dedupeHash, canonicalApplyUrl, canonicalSourceUrl, parsedPostedDate, matchScore } = item;

          const existing = await tx.job.findUnique({ where: { dedupeHash } });

          const dbJob = await tx.job.upsert({
            where: { dedupeHash },
            update: {
              title: job.title,
              company: job.company,
              location: job.location,
              isRemote: job.isRemote,
              applyUrl: canonicalApplyUrl || job.applyUrl,
              sourceUrl: canonicalSourceUrl || job.sourceUrl,
              postedAtDate: parsedPostedDate || undefined,
              sourceCategory: JobSourceCategory.JOB_PORTAL,
              sourceProvider: classified.provider,
              isActive: true,
              matchScore,
              fetchedAt: new Date(),
            },
            create: {
              title: job.title,
              company: job.company,
              location: job.location,
              isRemote: job.isRemote,
              applyUrl: canonicalApplyUrl || job.applyUrl,
              sourceUrl: canonicalSourceUrl || job.sourceUrl,
              postedAtDate: parsedPostedDate || new Date(),
              source: job.source || "linkedin",
              sourceCategory: JobSourceCategory.JOB_PORTAL,
              sourceProvider: classified.provider,
              sourceId: job.sourceId,
              dedupeHash,
              skills: job.skills || [],
              description: job.description || "",
              isActive: true,
              matchScore,
              fetchedAt: new Date(),
            }
          });

          if (existing) {
            jobsUpdated++;
          } else {
            jobsInserted++;
          }

          if (userId) {
            await tx.userJob.upsert({
              where: {
                userId_jobId: {
                  userId,
                  jobId: dbJob.id,
                }
              },
              update: {
                matchedSkills: lowerSkills,
                matchScore,
              },
              create: {
                userId,
                jobId: dbJob.id,
                matchedSkills: lowerSkills,
                matchScore,
                discoveredAt: new Date(),
              }
            });
          }
        }
      });
    } catch (err: any) {
      console.error(`[Portal Jobs Persist] Error persisting batch of ${batch.length} jobs:`, err.message);
    }
  }

  return {
    jobsDiscovered: jobs.length,
    jobsInserted,
    jobsUpdated,
    duplicatesSkipped,
  };
}
