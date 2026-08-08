import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

function mapJob(j: any) {
  if (!j) return null;
  return {
    _id: j.id,
    title: j.title,
    company: j.company,
    companyLogo: j.companyLogo,
    companyColor: j.companyColor,
    location: j.location,
    locationType: j.locationType === "remote" ? "remote" : (j.locationType === "onsite" ? "onsite" : "hybrid"),
    salary: j.salary,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    experience: j.experience,
    experienceLevel: j.experienceLevel,
    type: j.type === "full_time" ? "full-time" : (j.type === "part_time" ? "part-time" : j.type),
    skills: j.skills,
    matchScore: j.matchScore,
    postedAt: j.postedAt,
    postedAtDate: j.postedAtDate,
    description: j.description,
    requirements: j.requirements,
    responsibilities: j.responsibilities,
    benefits: j.benefits,
    applicants: j.applicants,
    featured: j.featured,
    category: j.category,
    source: j.source,
    applyUrl: j.applyUrl,
    dedupeHash: j.dedupeHash,
    isActive: j.isActive,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt
  };
}

export async function POST(req: NextRequest) {
  try {
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    // Check if user has uploaded a resume (Section 1 requirement)
    const profile = await prisma.profile.findUnique({
      where: { userId: mongoUser.id },
      select: { resumeUrl: true, resumeText: true, skills: true }
    });

    const hasResume = Boolean(profile?.resumeUrl || profile?.resumeText);
    if (!hasResume) {
      return NextResponse.json(
        {
          success: false,
          code: "RESUME_REQUIRED",
          error: "Upload your resume to unlock personalized job matching."
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const userSkills: string[] = (body.skills && Array.isArray(body.skills) && body.skills.length > 0)
      ? body.skills
      : (profile?.skills?.map((s: any) => s.name) || []);

    // Database-first matching: query active PostgreSQL jobs (Section 10 & 12 requirement)
    const activeJobs = await prisma.job.findMany({
      where: { isActive: true },
      orderBy: { postedAtDate: "desc" },
      take: 100
    });

    const { calculateDetailedRelevance } = await import("@/lib/relevance");
    const matched = activeJobs.map(j => {
      const result = calculateDetailedRelevance(
        {
          title: j.title,
          company: j.company,
          skills: j.skills,
          description: j.description,
          requirements: j.requirements
        },
        userSkills
      );
      return {
        job: j,
        matchScore: result.score,
        matchedSkills: result.matchedSkills
      };
    }).filter(m => m.matchScore > 0);

    matched.sort((a, b) => b.matchScore - a.matchScore);
    const matchedJobsList = matched.map(m => ({
      ...mapJob(m.job),
      matchScore: m.matchScore
    }));

    return NextResponse.json({
      success: true,
      data: matchedJobsList,
      matchedCount: matchedJobsList.length
    });

  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to match jobs");
  }
}
