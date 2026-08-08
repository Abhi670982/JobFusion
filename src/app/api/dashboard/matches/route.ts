import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

function mapJob(job: any, matchScore: number) {
  if (!job) return null;
  return {
    _id: job.id,
    title: job.title,
    company: job.company,
    companyLogo: job.companyLogo,
    companyColor: job.companyColor,
    location: job.location,
    locationType: job.locationType,
    salary: job.salary,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    experience: job.experience,
    experienceLevel: job.experienceLevel,
    type: job.type === "full_time" ? "full-time" : (job.type === "part_time" ? "part-time" : job.type),
    skills: job.skills,
    matchScore,
    postedAt: job.postedAt,
    postedAtDate: job.postedAtDate,
    description: job.description,
    requirements: job.requirements,
    responsibilities: job.responsibilities,
    benefits: job.benefits,
    applicants: job.applicants,
    featured: job.featured,
    category: job.category,
    source: job.source,
    applyUrl: job.applyUrl,
    sourceId: job.sourceId,
    sourceUrl: job.sourceUrl,
    city: job.city,
    country: job.country,
    isRemote: job.isRemote,
    jobType: job.jobType,
    salaryCurrency: job.salaryCurrency,
    salaryPeriod: job.salaryPeriod,
    descriptionHtml: job.descriptionHtml,
    expiresAt: job.expiresAt,
    fetchedAt: job.fetchedAt,
    dedupeHash: job.dedupeHash,
    isActive: job.isActive,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
}

export async function GET() {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const pgProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: { skills: true }
    });

    const hasResume = Boolean(pgProfile?.resumeUrl || pgProfile?.resumeText);
    const userSkills = (pgProfile?.skills || []).map(s => s.name);

    // Section 13 Requirement: If user has no uploaded resume or no skills, matches found MUST be 0
    if (!hasResume || userSkills.length === 0) {
      return NextResponse.json({
        success: true,
        totalMatches: 0,
        averageMatchPercentage: 0,
        topMatchedJobs: [],
      });
    }

    const { getPermittedJobSources } = await import("@/lib/subscription");
    const { allowedSources } = await getPermittedJobSources(user.id);

    const now = new Date();
    const jobWhere: any = {
      isActive: true,
      OR: [
        { expiresAt: { gt: now } },
        { expiresAt: null }
      ]
    };

    if (allowedSources && allowedSources.length > 0) {
      jobWhere.AND = [
        {
          OR: [
            { sourceCategory: "company_career" },
            { source: { in: allowedSources, mode: "insensitive" } },
            { sourceCategory: { in: allowedSources, mode: "insensitive" } },
          ]
        }
      ];
    }

    const activeJobs = await prisma.job.findMany({
      where: jobWhere,
      take: 200,
      orderBy: { postedAtDate: "desc" }
    });

    if (activeJobs.length === 0) {
      return NextResponse.json({
        success: true,
        totalMatches: 0,
        averageMatchPercentage: 0,
        topMatchedJobs: [],
      });
    }

    const { calculateDetailedRelevance } = await import("@/lib/relevance");

    const matchedJobs = activeJobs.map((job) => {
      const result = calculateDetailedRelevance(
        {
          title: job.title,
          company: job.company,
          skills: job.skills,
          description: job.description,
          requirements: job.requirements
        },
        userSkills
      );
      return {
        job,
        matchScore: result.score,
        tier: result.tier
      };
    }).filter((jm) => jm.matchScore > 0);

    matchedJobs.sort((a, b) => b.matchScore - a.matchScore);

    const topMatches = matchedJobs.slice(0, 10).map(jm => mapJob(jm.job, jm.matchScore));
    const avgScore = matchedJobs.length > 0
      ? Math.round(matchedJobs.reduce((acc, jm) => acc + jm.matchScore, 0) / matchedJobs.length)
      : 0;

    return NextResponse.json({
      success: true,
      totalMatches: matchedJobs.length,
      averageMatchPercentage: avgScore,
      topMatchedJobs: topMatches,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to calculate job matches");
  }
}
