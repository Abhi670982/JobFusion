import { NextRequest, NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";
import { normalizeSearchInput } from "@/lib/portal-fetcher/sanitizers/sanitizer";
import { searchPortalJobs } from "@/lib/portal-fetcher/services/portal-search-service";
import { portalRegistry } from "@/lib/portal-fetcher/registry";

export const dynamic = "force-dynamic";

// Calculate rolling 168-hour (7-day) visibility window
function getRollingJobVisibilityWindow(now = new Date()) {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    from: sevenDaysAgo,
    to: new Date(now.getTime() + 5 * 60 * 1000), // 5-min clock skew tolerance
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function processAndPersistPortalJobs(userId: string, jobs: any[], userSkills: string[]): Promise<number> {
  if (!jobs || jobs.length === 0) return 0;
  
  let savedCount = 0;
  const lowerSkills = userSkills.map(s => s.toLowerCase().trim());
  const BATCH_SIZE = 50;

  // 1. In-Memory Deduplication and Classification
  const preparedJobs: any[] = [];
  const seenHashes = new Set<string>();

  for (const job of jobs) {
    const rawSource = job.source || "linkedin";
    const classified = classifySourceCategory(rawSource, job.sourceProvider);

    // GUARANTEE: Only process JOB_PORTAL jobs in this endpoint helper
    if (classified.category !== JobSourceCategory.JOB_PORTAL) {
      console.warn(`[Portal Jobs Pipeline] Skipping non-portal job category "${classified.category}" for source "${rawSource}".`);
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
    const hashInput = `job_portal-${rawSource}-${job.sourceId || ""}-${canonicalApplyUrl || ""}-${job.title}-${job.company}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(hashInput).digest("hex");

    if (seenHashes.has(dedupeHash)) continue;
    seenHashes.add(dedupeHash);

    const parsedPostedDate = job.postedDate && !isNaN(new Date(job.postedDate).getTime())
      ? new Date(job.postedDate)
      : null;

    preparedJobs.push({
      job,
      classified,
      dedupeHash,
      canonicalApplyUrl,
      parsedPostedDate,
      matchScore,
    });
  }

  // 2. Controlled Transaction Batching (No giant single transaction)
  for (let i = 0; i < preparedJobs.length; i += BATCH_SIZE) {
    const batch = preparedJobs.slice(i, i + BATCH_SIZE);

    try {
      await prisma.$transaction(async (tx) => {
        for (const item of batch) {
          const { job, classified, dedupeHash, canonicalApplyUrl, parsedPostedDate, matchScore } = item;

          const dbJob = await tx.job.upsert({
            where: { dedupeHash },
            update: {
              title: job.title,
              company: job.company,
              location: job.location,
              isRemote: job.isRemote,
              applyUrl: canonicalApplyUrl || job.applyUrl,
              postedAtDate: parsedPostedDate || undefined,
              sourceCategory: JobSourceCategory.JOB_PORTAL,
              sourceProvider: classified.provider,
              isActive: true,
              matchScore,
            },
            create: {
              title: job.title,
              company: job.company,
              location: job.location,
              isRemote: job.isRemote,
              applyUrl: canonicalApplyUrl || job.applyUrl,
              postedAtDate: parsedPostedDate || new Date(),
              source: job.source || "linkedin",
              sourceCategory: JobSourceCategory.JOB_PORTAL,
              sourceProvider: classified.provider,
              sourceId: job.sourceId,
              sourceUrl: canonicalizeUrl(job.sourceUrl) || job.applyUrl,
              dedupeHash,
              skills: job.skills || [],
              description: job.description || "",
              isActive: true,
              matchScore,
            }
          });

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

          savedCount++;
        }
      });
    } catch (err: any) {
      console.error(`[Portal Jobs Batch] Error persisting batch of ${batch.length} jobs:`, err.message);
    }
  }

  return savedCount;
}

// Retrieve cached JOB_PORTAL jobs from DB strictly matching sourceCategory = JOB_PORTAL
async function getUserCachedPortalJobs(userId: string, portal: string, visibilityFrom: Date, visibilityTo: Date, allowedSources: string[] | null = null) {
  const sourceFilter = allowedSources 
    ? (portal !== "all" && allowedSources.includes(portal) ? { source: portal } : { source: { in: allowedSources } })
    : (portal !== "all" ? { source: portal } : {});

  const userJobs = await prisma.userJob.findMany({
    where: {
      userId,
      job: {
        sourceCategory: JobSourceCategory.JOB_PORTAL, // STRICT ENFORCEMENT
        postedAtDate: {
          gte: visibilityFrom,
          lte: visibilityTo,
        },
        isActive: true,
        ...sourceFilter,
      }
    },
    include: {
      job: true
    },
    orderBy: {
      job: {
        postedAtDate: "desc"
      }
    }
  });

  return userJobs.map(uj => {
    const postedDateStr = uj.job.postedAtDate ? uj.job.postedAtDate.toISOString() : "";
    return {
      sourceId: uj.job.sourceId || uj.job.id,
      source: uj.job.source || "linkedin",
      sourceCategory: uj.job.sourceCategory,
      sourceProvider: uj.job.sourceProvider,
      sourceUrl: uj.job.sourceUrl || uj.job.applyUrl || "",
      applyUrl: uj.job.applyUrl,
      title: uj.job.title,
      company: uj.job.company,
      logo: uj.job.companyLogo || null,
      location: uj.job.location,
      isRemote: uj.job.isRemote,
      employmentType: uj.job.type === "full_time" ? "full-time" : (uj.job.type === "part_time" ? "part-time" : (uj.job.type as any)),
      experience: uj.job.experienceLevel as any,
      salary: uj.job.salary,
      salaryMin: uj.job.salaryMin || null,
      salaryMax: uj.job.salaryMax || null,
      description: uj.job.description || "",
      postedDate: postedDateStr,
      isDateless: false,
      skills: uj.job.skills,
    };
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rawPortal = searchParams.get("portal") || "all";
  const rawKeyword = searchParams.get("keyword") || "";
  const rawLocation = searchParams.get("location") || "India";
  const rawSkillsParam = searchParams.get("skills") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("pageLimit") || searchParams.get("limit") || "10", 10)));

  // Normalize search parameters
  const normalizedPortal = rawPortal.toLowerCase();
  const normalizedKeyword = normalizeSearchInput(rawKeyword, 200);
  const normalizedLocation = normalizeSearchInput(rawLocation, 100) || "India";
  const requestSkills = rawSkillsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    // Authenticate user & resolve user skills
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { skills: true }
    });
    const userSkills = profile?.skills ? profile.skills.map(s => s.name) : [];

    const { getPermittedJobSources } = await import("@/lib/subscription");
    const { allowedSources } = await getPermittedJobSources(userId);

    const forceRefresh = searchParams.get("refresh") === "true";
    let backgroundSyncQueued = false;

    // 2. Check Category-Isolated Redis Cache (unless forceRefresh)
    const cacheKey = buildCacheKey(JobSourceCategory.JOB_PORTAL, validatedKeyword || portal, validatedLocation, page);
    if (!forceRefresh) {
      const redisCached = await getCachedCategoryJobs<any[]>(cacheKey);
      if (redisCached) {
        const filteredRedis = allowedSources 
          ? redisCached.filter((j: any) => allowedSources.includes((j.source || "").toLowerCase()))
          : redisCached;

        return NextResponse.json({
          success: true,
          portal,
          keyword: validatedKeyword,
          location: validatedLocation,
          page,
          data: filteredRedis,
          jobs: filteredRedis,
          cached: true,
          sourceCategory: JobSourceCategory.JOB_PORTAL,
        });
      }
    }

    // 3. Query PostgreSQL for matching JOB_PORTAL jobs strictly within 168-hour rolling window
    let cachedJobs = await getUserCachedPortalJobs(userId, portal, visibilityFrom, visibilityTo, allowedSources);
    let crawlMetrics: any = null;

    // 4. If forceRefresh OR DB results empty, perform live crawl pass
    if (forceRefresh || cachedJobs.length === 0) {
      const { crawlPortalJobs } = await import("@/lib/portal-fetcher/crawler");
      const { persistPortalJobs } = await import("@/lib/portal-jobs-persist");

      const crawlRes = await crawlPortalJobs({
        portal: portal === "all" ? "all" : (portal as any),
        keyword: validatedKeyword || undefined,
        skills: userSkills,
        location: validatedLocation,
        page,
        maxPages: 5,
      });

      const persistRes = await persistPortalJobs(crawlRes.jobs, userId, userSkills);

      crawlMetrics = {
        totalPagesCrawled: crawlRes.metrics.totalPagesCrawled,
        jobsDiscovered: crawlRes.metrics.jobsDiscovered,
        jobsInserted: persistRes.jobsInserted,
        jobsUpdated: persistRes.jobsUpdated,
        duplicatesSkipped: crawlRes.metrics.duplicatesSkipped + persistRes.duplicatesSkipped,
        failedRequests: crawlRes.metrics.failedRequests,
        portalStats: crawlRes.metrics.portalStats,
      };

      // Re-fetch cached jobs from DB after persistence
      cachedJobs = await getUserCachedPortalJobs(userId, portal, visibilityFrom, visibilityTo, allowedSources);
    } else if (cachedJobs.length < 10) {
      const enqueueRes = await enqueueCrawlJob({
        category: JobSourceCategory.JOB_PORTAL,
        provider: portal,
        keyword: validatedKeyword || "software engineer",
        location: validatedLocation,
        userId,
      });
      backgroundSyncQueued = enqueueRes.enqueued;
    }

    // Save to category-aware Redis cache if data is present
    if (cachedJobs.length > 0) {
      await setCachedCategoryJobs(cacheKey, cachedJobs, 600);
    }

    return NextResponse.json({
      success: true,
      portal,
      keyword: validatedKeyword,
      location: validatedLocation,
      page,
      data: cachedJobs,
      jobs: cachedJobs,
      cached: !forceRefresh && !crawlMetrics,
      sourceCategory: JobSourceCategory.JOB_PORTAL,
      backgroundSyncQueued,
      metrics: crawlMetrics,
      message: crawlMetrics
        ? `Crawled ${crawlMetrics.totalPagesCrawled} pages. Discovered ${crawlMetrics.jobsDiscovered} jobs (${crawlMetrics.jobsInserted} new, ${crawlMetrics.jobsUpdated} updated, ${crawlMetrics.duplicatesSkipped} duplicates skipped).`
        : backgroundSyncQueued ? "Returning cached results. Refreshing background pool." : "Returned fresh cached jobs.",
    });
  } catch (error: unknown) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    console.error("[Portal Jobs API] Full Exception Details:", {
      message: errObj.message,
      name: errObj.name,
      stack: errObj.stack,
      cause: (errObj as any).cause,
    });
    return NextResponse.json(
      { success: false, error: errObj.message, stack: errObj.stack, version: "v1" },
      { status: 500 }
    );
  }
}
