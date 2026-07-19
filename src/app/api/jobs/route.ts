import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
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
        where: { id }
      });
      if (!job) {
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 }
        );
      }
      
      const mappedJob = {
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
        matchScore: job.matchScore,
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

      return NextResponse.json({ success: true, data: mappedJob });
    }

    // Get filtered jobs
    const q = searchParams.get("q") || "";
    const source = searchParams.get("source") || "";
    const location = searchParams.get("location") || "";
    const jobType = searchParams.get("jobType") || "";
    const experienceLevel = searchParams.get("experienceLevel") || "";
    const remote = searchParams.get("remote") || "";
    const salaryMin = searchParams.get("salaryMin") || "";
    const salaryMax = searchParams.get("salaryMax") || "";
    const skills = searchParams.get("skills") || "";
    const postedAfter = searchParams.get("postedAfter") || "";
    const category = searchParams.get("category") || "";
    
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const sortBy = searchParams.get("sortBy") || "postedAt";
    const order = searchParams.get("order") || "desc";

    const andConditions: any[] = [];

    // 1. Full-text search
    if (q) {
      andConditions.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ]
      });
    }

    // 2. Multi-source filter
    if (source) {
      const sources = source.split(",").map((s) => s.trim().toLowerCase());
      andConditions.push({
        source: { in: sources }
      });
    }

    // 3. Location filter
    if (location) {
      andConditions.push({
        OR: [
          { location: { contains: location, mode: "insensitive" } },
          { city: { contains: location, mode: "insensitive" } },
          { country: { contains: location, mode: "insensitive" } },
        ]
      });
    }

    // 4. Job type filter
    if (jobType) {
      const types = jobType.split(",").map((t) => t.trim().toLowerCase());
      const mappedTypes = types.map(t => {
        if (t === "full-time") return "full_time";
        if (t === "part-time") return "part_time";
        return t;
      });
      andConditions.push({
        OR: [
          { type: { in: mappedTypes as any } },
          { jobType: { in: types } }
        ]
      });
    }

    // 5. Experience level filter
    if (experienceLevel) {
      const levels = experienceLevel.split(",").map((l) => l.trim().toLowerCase());
      andConditions.push({
        experienceLevel: { in: levels as any }
      });
    }

    // 6. Remote toggle
    if (remote === "true") {
      andConditions.push({
        OR: [
          { isRemote: true },
          { locationType: "remote" },
          { location: { contains: "remote", mode: "insensitive" } }
        ]
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
            { salaryMin: null }
          ]
        });
      }
      if (salaryMax) {
        andConditions.push({
          OR: [
            { salaryMin: { lte: parseInt(salaryMax, 10) } },
            { salaryMax: { lte: parseInt(salaryMax, 10) } },
            { salaryMin: 0 },
            { salaryMin: null }
          ]
        });
      }
    }

    // 8. Skills filter
    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim().toLowerCase());
      andConditions.push({
        skills: { hasSome: skillList }
      });
    }

    // 9. Date posted filter
    const datePosted = searchParams.get("datePosted") || "";
    let dateLimit: Date | null = null;
    if (datePosted) {
      const now = new Date();
      if (datePosted === "24h") now.setHours(now.getHours() - 24);
      else if (datePosted === "3d") now.setDate(now.getDate() - 3);
      else if (datePosted === "7d") now.setDate(now.getDate() - 7);
      else if (datePosted === "30d") now.setDate(now.getDate() - 30);
      dateLimit = now;
    } else if (postedAfter) {
      const parsed = new Date(postedAfter);
      if (!isNaN(parsed.getTime())) {
        dateLimit = parsed;
      }
    }

    if (dateLimit) {
      andConditions.push({
        OR: [
          { postedAtDate: { gte: dateLimit } },
          { createdAt: { gte: dateLimit } }
        ]
      });
    }

    // 10. Category filter
    if (category) {
      andConditions.push({
        category: { contains: category, mode: "insensitive" }
      });
    }

    // 11. Filter out closed jobs
    const now = new Date();
    andConditions.push({
      OR: [
        { expiresAt: { gt: now } },
        { expiresAt: null }
      ]
    });

    // 12. Only show active jobs
    andConditions.push({
      isActive: true
    });

    const queryConditions = andConditions.length > 0 ? { AND: andConditions } : {};

    // Construct sorting
    const sortField = sortBy === "salaryMin" ? "salaryMin" : "postedAtDate";
    const sortDirection = order === "asc" ? "asc" : "desc";
    const orderBy = [
      { [sortField]: sortDirection },
      { createdAt: "desc" as const }
    ];

    // Execute query with pagination
    const total = await prisma.job.count({ where: queryConditions });
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const pgJobs = await prisma.job.findMany({
      where: queryConditions,
      orderBy,
      skip: offset,
      take: limit
    });

    // Map Postgres model to Mongo-like representation for frontend
    const jobs = pgJobs.map(job => ({
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
      matchScore: job.matchScore,
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
    }));

    // Dynamic counts per source
    const getSourceCount = async (src: string) => {
      const baseConditions = andConditions.filter(c => !c.source);
      baseConditions.push({ source: src });
      return prisma.job.count({
        where: baseConditions.length > 0 ? { AND: baseConditions } : {}
      });
    };

    const [wellfoundCount, careersCount, aggregatorCount] = await Promise.all([
      getSourceCount("wellfound"),
      getSourceCount("careers"),
      getSourceCount("aggregator")
    ]);

    const sourceCounts = {
      wellfound: wellfoundCount,
      careers: careersCount,
      aggregator: aggregatorCount
    };

    return NextResponse.json({
      success: true,
      data: jobs,
      total,
      page,
      totalPages,
      sourceCounts
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
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

    const { _id, ...updateData } = body;

    // Map enums if present
    const dataToUpdate: any = { ...updateData };
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
