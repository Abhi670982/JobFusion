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

    if (!pgProfile) {
      return NextResponse.json({
        success: true,
        totalMatches: 0,
        averageMatchPercentage: 0,
        topMatchedJobs: [],
      });
    }

    const userSkills = (pgProfile.skills || []).map(s => s.name.toLowerCase());
    const userDomain = (pgProfile.resumeCategory || "").toLowerCase().trim();

    const { getPermittedJobSources } = await import("@/lib/subscription");
    const { allowedSources } = await getPermittedJobSources(user.id);

    const jobWhere: any = { isActive: true };
    if (allowedSources && allowedSources.length > 0) {
      jobWhere.OR = [
        { sourceCategory: "company_career" },
        { source: { in: allowedSources, mode: "insensitive" } },
        { sourceCategory: { in: allowedSources, mode: "insensitive" } },
      ];
    }

    const allJobs = await prisma.job.findMany({
      where: jobWhere
    });

    if (allJobs.length === 0) {
      return NextResponse.json({
        success: true,
        totalMatches: 0,
        averageMatchPercentage: 0,
        topMatchedJobs: [],
      });
    }

    const matchedJobs = allJobs.map((job) => {
      const jobSkills = (job.skills || []).map(s => s.toLowerCase());
      const overlap = jobSkills.filter(s => userSkills.includes(s));
      
      let score = 0;
      if (jobSkills.length > 0) {
        score = (overlap.length / jobSkills.length) * 80;
      }

      if (userDomain && job.category && job.category.toLowerCase().includes(userDomain)) {
        score += 20;
      } else if (userDomain && job.title && job.title.toLowerCase().includes(userDomain)) {
        score += 15;
      }

      if (userSkills.length === 0) {
        score = userDomain && job.category && job.category.toLowerCase().includes(userDomain) ? 75 : 50;
      }

      const matchScore = Math.min(100, Math.max(45, Math.round(score)));

      return {
        job,
        matchScore,
      };
    });

    const threshold = userSkills.length > 0 ? 60 : 50;
    const filteredMatches = matchedJobs.filter((jm) => jm.matchScore >= threshold);
    
    filteredMatches.sort((a, b) => b.matchScore - a.matchScore);

    const topMatches = filteredMatches.slice(0, 10).map(jm => mapJob(jm.job, jm.matchScore));
    const avgScore = filteredMatches.length > 0
      ? Math.round(filteredMatches.reduce((acc, jm) => acc + jm.matchScore, 0) / filteredMatches.length)
      : 0;

    return NextResponse.json({
      success: true,
      totalMatches: filteredMatches.length,
      averageMatchPercentage: avgScore,
      topMatchedJobs: topMatches,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to calculate job matches");
  }
}
