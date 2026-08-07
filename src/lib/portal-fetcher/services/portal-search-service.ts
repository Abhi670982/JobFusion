import { prisma } from "@/lib/prisma";
import { PortalSource, Prisma } from "@prisma/client";
import { PortalJobDTOV1, PortalJobsApiResponseV1 } from "../dto/v1";
import { sanitizeJobDescription, validateExternalUrl } from "../sanitizers/sanitizer";
import { ConsoleLogger } from "../observability/logger";

const logger = new ConsoleLogger("PortalSearchService");

export interface PortalSearchOptions {
  keyword?: string;
  location?: string;
  portal?: string; // "all" | "linkedin" | "indeed" | "internshala" | "wellfound"
  page?: number;
  limit?: number;
  userSkills?: string[];
  jobTypes?: string[];
  expLevels?: string[];
  remoteOnly?: boolean;
}

/**
 * Calculates dynamic relevance match score (0 - 100%) between job title/skills/description
 * and the requesting user's extracted profile skills.
 */
export function calculateDynamicMatchScore(
  jobTitle: string,
  jobSkills: string[],
  jobDescription: string | null,
  userSkills: string[]
): { score: number; matchedSkills: string[] } {
  if (!userSkills || userSkills.length === 0) {
    return { score: 75, matchedSkills: [] }; // Baseline score when no skills specified
  }

  const normalizedUserSkills = userSkills
    .map(s => s.toLowerCase().trim())
    .filter(Boolean);

  if (normalizedUserSkills.length === 0) {
    return { score: 75, matchedSkills: [] };
  }

  const matchedSet = new Set<string>();
  const titleLower = jobTitle.toLowerCase();
  const descLower = (jobDescription || "").toLowerCase();

  let matchWeight = 0;

  for (const userSkill of normalizedUserSkills) {
    let skillMatched = false;

    // Check direct match in job skills array
    if (jobSkills.some(js => js.toLowerCase().includes(userSkill) || userSkill.includes(js.toLowerCase()))) {
      matchWeight += 30;
      skillMatched = true;
    }

    // Check title match (high relevance)
    if (titleLower.includes(userSkill)) {
      matchWeight += 40;
      skillMatched = true;
    }

    // Check description match
    if (!skillMatched && descLower.includes(userSkill)) {
      matchWeight += 15;
      skillMatched = true;
    }

    if (skillMatched) {
      matchedSet.add(userSkill);
    }
  }

  // Normalize score into 50 - 99 range
  const rawScore = 50 + Math.min(49, Math.round((matchWeight / (normalizedUserSkills.length * 40)) * 49));
  const matchedSkills = Array.from(matchedSet);

  return {
    score: Math.max(50, Math.min(99, rawScore)),
    matchedSkills,
  };
}

/**
 * Encapsulated Service Layer for Job Portal queries.
 * Reads directly from dedicated `prisma.portalJob` PostgreSQL table,
 * applies dynamic relevance scoring against requesting user skills, and maps to DTO V1.
 */
export async function searchPortalJobs(options: PortalSearchOptions): Promise<PortalJobsApiResponseV1> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 10));
  const userSkills = options.userSkills || [];

  const now = new Date();
  const cutoff7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Build Prisma where clause
  const where: Prisma.PortalJobWhereInput = {
    isActive: true,
    postedAt: {
      gte: cutoff7Days,
    },
  };

  // Portal source filter
  const VALID_PORTALS = ["linkedin", "indeed", "internshala", "wellfound"];
  if (options.portal && options.portal.toLowerCase() !== "all") {
    const portalNorm = options.portal.toLowerCase().trim();
    if (VALID_PORTALS.includes(portalNorm)) {
      where.sourcePortal = portalNorm as PortalSource;
    }
  }

  // Keyword filter
  if (options.keyword && options.keyword.trim().length > 0) {
    const kw = options.keyword.trim();
    where.OR = [
      { title: { contains: kw, mode: "insensitive" } },
      { company: { contains: kw, mode: "insensitive" } },
      { description: { contains: kw, mode: "insensitive" } },
      { skills: { hasSome: [kw.toLowerCase()] } },
    ];
  }

  // Location filter
  if (options.location && options.location.trim().length > 0) {
    const loc = options.location.trim();
    if (loc.toLowerCase() === "remote") {
      where.isRemote = true;
    } else {
      where.location = { contains: loc, mode: "insensitive" };
    }
  }

  if (options.remoteOnly) {
    where.isRemote = true;
  }

  logger.info(`Executing DB search on portal_jobs table. Page=${page}, Limit=${limit}`);

  // Fetch active portal jobs from DB
  const rawJobs = await prisma.portalJob.findMany({
    where,
    orderBy: {
      postedAt: "desc",
    },
    take: 200, // Fetch top candidate pool for dynamic scoring & sorting
  });

  // Calculate dynamic relevance match score for each job
  const scoredJobs = rawJobs.map(job => {
    const { score, matchedSkills } = calculateDynamicMatchScore(
      job.title,
      job.skills,
      job.description,
      userSkills
    );

    return {
      job,
      dynamicMatchScore: score,
      matchedSkills,
    };
  });

  // Deterministically sort by dynamicMatchScore desc, then postedAt desc
  scoredJobs.sort((a, b) => {
    if (b.dynamicMatchScore !== a.dynamicMatchScore) {
      return b.dynamicMatchScore - a.dynamicMatchScore;
    }
    return b.job.postedAt.getTime() - a.job.postedAt.getTime();
  });

  // Paginate post-sort
  const totalCount = scoredJobs.length;
  const startIndex = (page - 1) * limit;
  const paginatedItems = scoredJobs.slice(startIndex, startIndex + limit);

  // Map to DTO V1 response
  const dtoJobs: PortalJobDTOV1[] = paginatedItems.map(({ job, dynamicMatchScore, matchedSkills }) => {
    const cleanDesc = sanitizeJobDescription(job.description || "");
    const cleanUrl = validateExternalUrl(job.applyUrl || job.sourceUrl || "#") || "#";

    return {
      id: job.id,
      title: job.title,
      company: job.company,
      companyLogo: job.companyLogo || null,
      location: job.location || "Remote",
      isRemote: job.isRemote,
      experienceLevel: job.experienceLevel || "mid",
      employmentType: job.employmentType || "full_time",
      salaryText: job.salaryText || "Salary Not Disclosed",
      salaryMin: job.salaryMin || null,
      salaryMax: job.salaryMax || null,
      description: cleanDesc,
      skills: job.skills,
      applyUrl: cleanUrl,
      sourcePortal: job.sourcePortal,
      postedAtISO: job.postedAt.toISOString(),
      isDateless: job.isDateless,
      matchedSkills: matchedSkills || [],
    };
  });

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    version: "v1",
    success: true,
    portal: options.portal || "all",
    keyword: options.keyword || "",
    location: options.location || "India",
    page,
    limit,
    totalFound: totalCount,
    totalPages,
    jobs: dtoJobs,
    cached: false,
  };
}
