import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateJobsQuery } from "@/lib/api-validators";
import { Prisma, Job, JobType, ExperienceLevel } from "@prisma/client";

export const dynamic = "force-dynamic";

function mapJob(job: Job | null) {
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
    type:
      job.type === "full_time"
        ? "full-time"
        : job.type === "part_time"
          ? "part-time"
          : job.type,
    skills: job.skills,
    matchScore: job.matchScore,
    matchedSkill: job.matchedSkill,
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
    updatedAt: job.updatedAt,
  };
}

// 1. POST - Create a Job
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, company, location, salary, description, source, applyUrl } = body;

    // Validate required fields
    if (!title || !company) {
      return NextResponse.json(
        { success: false, error: "title and company are required fields" },
        { status: 400 }
      );
    }

    // Create in PostgreSQL
    const job = await prisma.job.create({
      data: {
        title,
        company,
        location: location || null,
        salary: salary || null,
        description: description || null,
        source: source || null,
        applyUrl: applyUrl || null,
        postedAt: "Just now",
        postedAtDate: new Date(),
        fetchedAt: new Date()
      }
    });

    // Map output to MongoDB-like payload
    const mappedJob = {
      _id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      description: job.description,
      source: job.source,
      applyUrl: job.applyUrl,
      postedAt: job.postedAt,
      postedAtDate: job.postedAtDate,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    };

    return NextResponse.json(
      { success: true, data: mappedJob },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// 2. GET - Read Jobs (Single, Specific, or Filtered Search)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Get specific job
    if (id) {
      const job = await prisma.job.findUnique({
        where: { id },
      });
      if (!job) {
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: mapJob(job) });
    }

    // Get filtered jobs

    const validated = validateJobsQuery(searchParams);
    const q = validated.q || searchParams.get("q") || "";
    const source = searchParams.get("source") || "";
    const location = validated.location || searchParams.get("location") || "";
    const jobType = searchParams.get("jobType") || "";
    const experienceLevel = searchParams.get("experienceLevel") || "";
    const remote = searchParams.get("remote") || "";
    const salaryMin = searchParams.get("salaryMin") || "";
    const salaryMax = searchParams.get("salaryMax") || "";
    const skills = validated.skills || searchParams.get("skills") || "";
    const postedAfter = searchParams.get("postedAfter") || "";
    const category = searchParams.get("category") || "";

    const page = validated.page;
    const limit = validated.limit;
    const sortBy = validated.sortBy;
    const order = validated.order;

    const andConditions: Prisma.JobWhereInput[] = [];

    // 1. Full-text search
    if (q) {
      andConditions.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    // 2. Multi-source filter
    if (source) {
      const sources = source.split(",").map((s) => s.trim().toLowerCase());
      andConditions.push({
        source: { in: sources },
      });
    }

    // 3. Location filter
    if (location) {
      andConditions.push({
        OR: [
          { location: { contains: location, mode: "insensitive" } },
          { city: { contains: location, mode: "insensitive" } },
          { country: { contains: location, mode: "insensitive" } },
        ],
      });
    }

    // 4. Job type filter
    if (jobType) {
      const types = jobType.split(",").map((t) => t.trim().toLowerCase());
      const mappedTypes = types.map((t) => {
        if (t === "full-time") return "full_time";
        if (t === "part-time") return "part_time";
        return t;
      });
      andConditions.push({
        OR: [{ type: { in: mappedTypes as JobType[] } }, { jobType: { in: types } }],
      });
    }

    // 5. Experience level filter
    if (experienceLevel) {
      const levels = experienceLevel
        .split(",")
        .map((l) => l.trim().toLowerCase());
      andConditions.push({
        experienceLevel: { in: levels as ExperienceLevel[] },
      });
    }

    // 6. Remote toggle
    if (remote === "true") {
      andConditions.push({
        OR: [
          { isRemote: true },
          { locationType: "remote" },
          { location: { contains: "remote", mode: "insensitive" } },
        ],
      });
    }

    // 7. Salary range filter
    if (salaryMin || salaryMax) {
      if (salaryMin) {
        andConditions.push({
          OR: [
            { salaryMax: { gte: parseInt(salaryMin, 10) } },
            { salaryMin: { gte: parseInt(salaryMin, 10) } },
            { salaryMin: 0 },
          ],
        });
      }
      if (salaryMax) {
        andConditions.push({
          OR: [
            { salaryMin: { lte: parseInt(salaryMax, 10) } },
            { salaryMax: { lte: parseInt(salaryMax, 10) } },
            { salaryMin: 0 },
          ],
        });
      }
    }

    // 8. Skills filter
    if (skills) {
      const skillList = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillList.length > 0) {
        const skillVariations = [];
        for (const skill of skillList) {
          skillVariations.push(skill);
          skillVariations.push(skill.toLowerCase());
          skillVariations.push(skill.toUpperCase());
          const capitalized = skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
          skillVariations.push(capitalized);
        }
        const uniqueVariations = Array.from(new Set(skillVariations));

        andConditions.push({
          OR: [
            ...skillList.map((skill) => ({
              matchedSkill: { equals: skill, mode: "insensitive" as const },
            })),
            { skills: { hasSome: uniqueVariations } },
          ],
        });
      }
    }

    // 9. Date posted filter + Rule 1 (careers always 24h)
    const datePosted = searchParams.get("datePosted") || "";
    let dateLimit: Date | null = null;
    if (datePosted) {
      const d = new Date();
      if (datePosted === "24h") d.setHours(d.getHours() - 24);
      else if (datePosted === "3d") d.setDate(d.getDate() - 3);
      else if (datePosted === "7d") d.setDate(d.getDate() - 7);
      else if (datePosted === "30d") d.setDate(d.getDate() - 30);
      dateLimit = d;
    } else if (postedAfter) {
      const parsed = new Date(postedAfter);
      if (!isNaN(parsed.getTime())) {
        dateLimit = parsed;
      }
    }

    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
    const cutoffCareers = new Date(Date.now() - TEN_DAYS_MS);

    if (dateLimit) {
      // User applied an explicit date filter — apply to all sources
      const effectiveDateLimit = dateLimit > cutoffCareers ? dateLimit : cutoffCareers;
      andConditions.push({
        OR: [
          {
            AND: [{ source: "careers" }, { postedAtDate: { gte: effectiveDateLimit } }],
          },
          {
            AND: [
              { OR: [{ source: { not: "careers" } }, { source: null }] },
              {
                OR: [
                  { postedAtDate: { gte: dateLimit } },
                  { createdAt: { gte: dateLimit } },
                ],
              },
            ],
          },
        ],
      });
    } else {
      // No user filter — careers: max 10 days; other sources: unrestricted
      andConditions.push({
        OR: [
          {
            AND: [{ source: "careers" }, { postedAtDate: { gte: cutoffCareers } }],
          },
          { OR: [{ source: { not: "careers" } }, { source: null }] },
        ],
      });
    }

    // 10. Category filter
    if (category) {
      andConditions.push({
        category: { contains: category, mode: "insensitive" },
      });
    }

    // 11. Filter out closed jobs
    const now = new Date();
    andConditions.push({
      OR: [{ expiresAt: { gt: now } }, { expiresAt: null }],
    });

    // 12. Only show active jobs
    andConditions.push({
      isActive: true,
    });

    const queryConditions: Prisma.JobWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    // Construct sorting
    const sortField = sortBy === "salaryMin" ? "salaryMin" : "postedAtDate";
    const sortDirection = order === "asc" ? "asc" : "desc";
    const orderBy: Prisma.JobOrderByWithRelationInput[] = [
      { [sortField]: sortDirection },
      { createdAt: "desc" },
    ];

    // Execute query with pagination
    const total = await prisma.job.count({ where: queryConditions });
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const pgJobs = await prisma.job.findMany({
      where: queryConditions,
      orderBy,
      skip: offset,
      take: limit,
    });

    const jobs = pgJobs.map(mapJob);

    // Dynamic counts per source
    const getSourceCount = async (src: string) => {
      const baseConditions = andConditions.filter((c) => !c.source);
      baseConditions.push({ source: src });
      return prisma.job.count({
        where: baseConditions.length > 0 ? { AND: baseConditions } : {},
      });
    };

    const [wellfoundCount, careersCount, aggregatorCount] = await Promise.all([
      getSourceCount("wellfound"),
      getSourceCount("careers"),
      getSourceCount("aggregator"),
    ]);

    const sourceCounts = {
      wellfound: wellfoundCount,
      careers: careersCount,
      aggregator: aggregatorCount,
    };

    return NextResponse.json({
      success: true,
      data: jobs,
      total,
      page,
      totalPages,
      sourceCounts,
      meta: {
        careersFreshnessWindowHours: 240, // Hard 10-day window
        oldestJobAt: jobs[jobs.length - 1]?.postedAtDate ?? null,
        newestJobAt: jobs[0]?.postedAtDate ?? null,
        skillsUsed: skills ? skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : [],
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// 3. PUT - Update a Job
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || body.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Job id is required to update a job" },
        { status: 400 }
      );
    }

    const updateData = { ...body };
    delete updateData._id;

    // Map enums if present
    const dataToUpdate: Prisma.JobUpdateInput = { ...updateData };
    if (updateData.type === "full-time") dataToUpdate.type = "full_time";
    else if (updateData.type === "part-time") dataToUpdate.type = "part_time";

    // Update in Postgres
    const updatedJob = await prisma.job.update({
      where: { id },
      data: dataToUpdate
    });

    // Map output to MongoDB-like payload
    const mappedJob = {
      _id: updatedJob.id,
      title: updatedJob.title,
      company: updatedJob.company,
      location: updatedJob.location,
      salary: updatedJob.salary,
      description: updatedJob.description,
      source: updatedJob.source,
      applyUrl: updatedJob.applyUrl,
      postedAt: updatedJob.postedAt,
      postedAtDate: updatedJob.postedAtDate,
      createdAt: updatedJob.createdAt,
      updatedAt: updatedJob.updatedAt
    };

    return NextResponse.json({ success: true, data: mappedJob });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// 4. DELETE - Delete a Job
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Job id is required to delete a job" },
        { status: 400 }
      );
    }

    // Delete in PostgreSQL
    const deletedJob = await prisma.job.delete({
      where: { id }
    });

    const mappedJob = {
      _id: deletedJob.id,
      title: deletedJob.title,
      company: deletedJob.company,
      location: deletedJob.location,
      salary: deletedJob.salary,
      description: deletedJob.description,
      source: deletedJob.source,
      applyUrl: deletedJob.applyUrl,
      postedAt: deletedJob.postedAt,
      postedAtDate: deletedJob.postedAtDate,
      createdAt: deletedJob.createdAt,
      updatedAt: deletedJob.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: mappedJob,
      message: "Job deleted successfully",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
