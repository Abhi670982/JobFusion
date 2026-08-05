import { NextRequest, NextResponse } from "next/server";
import { JobSourceCategory } from "@prisma/client";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";
import { buildCacheKey, getCachedCategoryJobs, setCachedCategoryJobs } from "@/lib/redis-cache";
import { normalizeSearchInput } from "@/lib/portal-fetcher/sanitizers/sanitizer";
import { crawlPortalJobs } from "@/lib/portal-fetcher/crawler";
import { portalRegistry } from "@/lib/portal-fetcher/registry";
import { JobPortalSource } from "@/lib/portal-fetcher/adapters/base-adapter";
import { PortalJobDTOV1, PortalJobsApiResponseV1 } from "@/lib/portal-fetcher/dto/v1";

export const dynamic = "force-dynamic";

function getRollingJobVisibilityWindow(now = new Date()) {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    from: sevenDaysAgo,
    to: new Date(now.getTime() + 5 * 60 * 1000),
  };
}

async function getUserCachedPortalJobs(
  userId: string,
  portal: string,
  keyword: string,
  location: string,
  visibilityFrom: Date,
  visibilityTo: Date,
  allowedSources: string[] | null = null
): Promise<PortalJobDTOV1[]> {
  const portalLower = portal.toLowerCase();
  
  // Defensive case-insensitive source filter
  let sourceConditions: any = {};
  if (allowedSources) {
    if (portalLower !== "all" && allowedSources.includes(portalLower)) {
      sourceConditions = {
        OR: [
          { source: { equals: portalLower, mode: "insensitive" } },
          { sourceProvider: { equals: portalLower, mode: "insensitive" } },
        ]
      };
    } else {
      sourceConditions = {
        OR: [
          { source: { in: allowedSources } },
          { sourceProvider: { in: allowedSources } },
        ]
      };
    }
  } else if (portalLower !== "all") {
    sourceConditions = {
      OR: [
        { source: { equals: portalLower, mode: "insensitive" } },
        { sourceProvider: { equals: portalLower, mode: "insensitive" } },
      ]
    };
  }

  // Mandatory keyword & location DB filters
  const filterConditions: any[] = [];

  if (keyword.trim()) {
    const k = keyword.trim();
    filterConditions.push({
      OR: [
        { title: { contains: k, mode: "insensitive" } },
        { company: { contains: k, mode: "insensitive" } },
        { description: { contains: k, mode: "insensitive" } },
        { skills: { has: k.toLowerCase() } },
      ]
    });
  }

  if (location.trim() && location.toLowerCase() !== "india") {
    const l = location.trim();
    filterConditions.push({
      location: { contains: l, mode: "insensitive" }
    });
  }

  const userJobs = await prisma.userJob.findMany({
    where: {
      userId,
      job: {
        sourceCategory: JobSourceCategory.JOB_PORTAL,
        postedAtDate: {
          gte: visibilityFrom,
          lte: visibilityTo,
        },
        isActive: true,
        ...sourceConditions,
        AND: filterConditions.length > 0 ? filterConditions : undefined,
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
    const postedDateStr = uj.job.postedAtDate ? uj.job.postedAtDate.toISOString() : null;
    return {
      id: uj.job.sourceId || uj.job.id,
      title: uj.job.title,
      company: uj.job.company,
      companyLogo: uj.job.companyLogo || null,
      location: uj.job.location || "Remote",
      isRemote: uj.job.isRemote,
      employmentType: uj.job.type === "full_time" ? "full-time" : (uj.job.type === "part_time" ? "part-time" : (uj.job.type as any)),
      experienceLevel: uj.job.experienceLevel as any,
      salaryText: uj.job.salary || "Not disclosed",
      salaryMin: uj.job.salaryMin || null,
      salaryMax: uj.job.salaryMax || null,
      description: uj.job.description || "",
      applyUrl: uj.job.applyUrl || uj.job.sourceUrl || "https://jobfusion.com",
      sourcePortal: uj.job.source || "linkedin",
      postedAtISO: postedDateStr,
      isDateless: false,
      matchedSkills: uj.job.skills,
    };
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  let requestNow = new Date();
  if (process.env.NODE_ENV !== "production") {
    const mockNowParam = searchParams.get("mockNow");
    if (mockNowParam) {
      const parsedMock = new Date(mockNowParam);
      if (!isNaN(parsedMock.getTime())) {
        requestNow = parsedMock;
      }
    }
  }

  const { from: visibilityFrom, to: visibilityTo } = getRollingJobVisibilityWindow(requestNow);

  const rawPortal = searchParams.get("portal") || "all";
  const rawKeyword = searchParams.get("keyword") || "";
  const rawLocation = searchParams.get("location") || "India";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("pageLimit") || searchParams.get("limit") || "10", 10)));

  // Stage 0: Search Input Normalization
  const normalizedPortal = rawPortal.toLowerCase();
  const normalizedKeyword = normalizeSearchInput(rawKeyword, 200);
  const normalizedLocation = normalizeSearchInput(rawLocation, 100) || "India";

  try {
    // 1. Authenticate user & resolve permitted job sources
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const { getPermittedJobSources } = await import("@/lib/subscription");
    const { allowedSources } = await getPermittedJobSources(userId);

    // 2. Check Category-Isolated Redis Cache
    const cacheKey = buildCacheKey(
      JobSourceCategory.JOB_PORTAL,
      normalizedKeyword || normalizedPortal,
      normalizedLocation,
      page
    );
    const redisCached = await getCachedCategoryJobs<PortalJobDTOV1[]>(cacheKey);
    if (redisCached && Array.isArray(redisCached) && redisCached.length > 0) {
      const filteredRedis = allowedSources 
        ? redisCached.filter((j: any) => allowedSources.includes((j.sourcePortal || j.source || "").toLowerCase()))
        : redisCached;

      const totalFound = filteredRedis.length;
      const totalPages = Math.ceil(totalFound / limit) || 1;
      const paginatedSlice = filteredRedis.slice((page - 1) * limit, page * limit);

      const responsePayload = {
        version: "v1" as const,
        success: true,
        portal: normalizedPortal,
        keyword: normalizedKeyword,
        location: normalizedLocation,
        page,
        limit,
        totalFound,
        totalPages,
        jobs: paginatedSlice,
        data: paginatedSlice, // Alias for backward compatibility
        cached: true,
        healthStatus: portalRegistry.getHealthSummary(),
      };

      return NextResponse.json(responsePayload);
    }

    // 3. Query PostgreSQL for matching JOB_PORTAL jobs strictly within 168-hour rolling window
    const cachedDbJobs = await getUserCachedPortalJobs(
      userId,
      normalizedPortal,
      normalizedKeyword,
      normalizedLocation,
      visibilityFrom,
      visibilityTo,
      allowedSources
    );

    // 4. Live Scrape Fallback via 10-Stage Pipeline if DB jobs are sparse
    let pipelineResultJobs: PortalJobDTOV1[] = cachedDbJobs;
    let errors: string[] = [];

    if (cachedDbJobs.length < 5) {
      const crawlRes = await crawlPortalJobs({
        portal: (normalizedPortal === "all" ? "all" : normalizedPortal) as JobPortalSource | "all",
        keyword: normalizedKeyword,
        location: normalizedLocation,
        page,
        limit,
      });

      if (crawlRes.dtoJobs && crawlRes.dtoJobs.length > 0) {
        pipelineResultJobs = crawlRes.dtoJobs;
      }
      if (crawlRes.errors) {
        errors = crawlRes.errors;
      }
    }

    // Save to category-aware Redis cache if data is present
    if (pipelineResultJobs.length > 0) {
      await setCachedCategoryJobs(cacheKey, pipelineResultJobs, 600);
    }

    const totalFound = pipelineResultJobs.length;
    const totalPages = Math.max(1, Math.ceil(totalFound / limit));
    const paginatedJobs = pipelineResultJobs.slice((page - 1) * limit, page * limit);

    const responsePayload: PortalJobsApiResponseV1 & { data: PortalJobDTOV1[] } = {
      version: "v1",
      success: true,
      portal: normalizedPortal,
      keyword: normalizedKeyword,
      location: normalizedLocation,
      page,
      limit,
      totalFound,
      totalPages,
      jobs: paginatedJobs,
      data: paginatedJobs, // Backward compatible alias
      cached: false,
      errors: errors.length > 0 ? errors : undefined,
      healthStatus: portalRegistry.getHealthSummary(),
    };

    return NextResponse.json(responsePayload);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed retrieving portal jobs";
    console.error("[Portal Jobs API] Handler failed:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage, version: "v1" },
      { status: 500 }
    );
  }
}
