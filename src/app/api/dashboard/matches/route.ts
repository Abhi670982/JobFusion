import { NextRequest, NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";

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
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pgProfile = await prisma.profile.findUnique({
      where: { userId: user._id.toString() },
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

    // Fetch active jobs from Postgres
    const allJobs = await prisma.job.findMany({
      where: { isActive: true }
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
        score = (overlap.length / jobSkills.length) * 80; // Up to 80% based on skill overlap
      }

      // Add up to 20% if job category matches user domain
      if (userDomain && job.category && job.category.toLowerCase().includes(userDomain)) {
        score += 20;
      } else if (userDomain && job.title && job.title.toLowerCase().includes(userDomain)) {
        score += 15;
      }

      // If user has no skills at all, base it on domain or a baseline match score
      if (userSkills.length === 0) {
        score = userDomain && job.category && job.category.toLowerCase().includes(userDomain) ? 75 : 50;
      }

      const matchScore = Math.min(100, Math.max(45, Math.round(score)));

      return {
        job,
        matchScore,
      };
    });

    // Filter jobs with a decent match score (>= 60%) or all if total matches is small
    const threshold = userSkills.length > 0 ? 60 : 50;
    const filteredMatches = matchedJobs.filter((jm) => jm.matchScore >= threshold);
    
    // Sort by match score descending
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
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/matches:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate matches" },
      { status: 500 }
    );
  }
}
