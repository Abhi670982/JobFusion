import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { safeErrorResponse } from "@/lib/security";
import { prisma } from "@/lib/prisma";
import { Prisma, Job, JobType, LocationType } from "@prisma/client";

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
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const source = searchParams.get("source") || "";
    const company = searchParams.get("company") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const andConditions: Prisma.JobWhereInput[] = [];

    // Apply text search
    if (query) {
      andConditions.push({
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { company: { contains: query, mode: "insensitive" } },
        ]
      });
    }

    // Filter by source
    if (source) {
      andConditions.push({ source });
    }

    // Filter by company name
    if (company) {
      andConditions.push({
        company: { contains: company, mode: "insensitive" }
      });
    }

    // Filter by active/expired status
    if (status === "active") {
      andConditions.push({ isActive: true });
      andConditions.push({
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      });
    } else if (status === "expired") {
      andConditions.push({
        OR: [
          { isActive: false },
          { expiresAt: { lt: new Date() } }
        ]
      });
    }

    const queryConditions: Prisma.JobWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};
    const skip = (page - 1) * limit;

    const [pgJobs, total] = await Promise.all([
      prisma.job.findMany({
        where: queryConditions,
        orderBy: [
          { postedAtDate: "desc" },
          { createdAt: "desc" }
        ],
        skip,
        take: limit,
      }),
      prisma.job.count({
        where: queryConditions,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        jobs: pgJobs.map(mapJob),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to load jobs");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();

    const {
      title,
      company,
      companyLogo,
      description,
      responsibilities,
      requirements,
      skills,
      experience,
      type,
      locationType,
      salary,
      location,
      applyUrl,
      sourceUrl,
      expiresAt,
      source,
      featured,
      isActive,
      companyWebsite,
    } = body;

    // Field Validations
    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Job title is required." }, { status: 400 });
    }
    if (!company || !company.trim()) {
      return NextResponse.json({ success: false, error: "Company name is required." }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ success: false, error: "Job description is required." }, { status: 400 });
    }
    if (!applyUrl || !applyUrl.trim()) {
      return NextResponse.json({ success: false, error: "Apply URL is required." }, { status: 400 });
    }

    // Map Employment Type
    const validTypes = ["full-time", "part-time", "contract", "internship", "freelance"];
    const normalizedType = (type || "full-time").toLowerCase().replace(" ", "-");
    const finalType = validTypes.includes(normalizedType) ? normalizedType : "full-time";

    // Map Work Mode
    const validModes = ["remote", "hybrid", "onsite"];
    const normalizedMode = (locationType || "remote").toLowerCase();
    const finalMode = validModes.includes(normalizedMode) ? normalizedMode : "remote";

    // Parse array strings
    const skillsArray = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
      ? skills.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    const responsibilitiesArray = Array.isArray(responsibilities)
      ? responsibilities
      : typeof responsibilities === "string"
      ? responsibilities.split("\n").map(r => r.trim()).filter(Boolean)
      : [];

    const requirementsArray = Array.isArray(requirements)
      ? requirements
      : typeof requirements === "string"
      ? requirements.split("\n").map(r => r.trim()).filter(Boolean)
      : [];

    // ── AUTOMATICALLY CREATE/UPDATE COMPANY INFORMATION IN POSTGRES ──────────
    let companyDoc = await prisma.company.findFirst({
      where: { name: { equals: company.trim(), mode: "insensitive" } }
    });

    if (!companyDoc) {
      companyDoc = await prisma.company.create({
        data: {
          name: company.trim(),
          careerUrl: sourceUrl || companyWebsite || applyUrl || "",
          crawlStatus: "idle",
          jobsFound: 1,
          isEnabled: false,
        }
      });
    } else {
      companyDoc = await prisma.company.update({
        where: { id: companyDoc.id },
        data: {
          careerUrl: sourceUrl || undefined,
          jobsFound: companyDoc.jobsFound + 1
        }
      });
    }

    // ── CREATE JOB POSTING IN POSTGRESQL ─────────────────────────────────────
    const crypto = await import("crypto");
    const dedupeHash = `manual-${company.trim().toLowerCase()}-${title.trim().toLowerCase()}-${(location || "").toLowerCase()}-${crypto.randomBytes(6).toString("hex")}`;

    const pgType = finalType === "full-time" ? "full_time" : (finalType === "part-time" ? "part_time" : finalType);

    const newJob = await prisma.job.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        companyLogo: companyLogo || "",
        description: description.trim(),
        responsibilities: responsibilitiesArray,
        requirements: requirementsArray,
        skills: skillsArray,
        experience: experience || "",
        type: pgType as JobType,
        locationType: finalMode as LocationType,
        salary: salary || "",
        location: location || "Remote",
        applyUrl: applyUrl.trim(),
        sourceUrl: sourceUrl || "",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        source: source || "Manual",
        featured: !!featured,
        isActive: isActive !== undefined ? !!isActive : true,
        dedupeHash,
      }
    });

    // ── AUDIT LOG ACTION ─────────────────────────────────────────────────────
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin: {
        _id: admin.id,
        fullName: admin.fullName,
        email: admin.email
      },
      action: "Added Manual Job",
      resource: "Job",
      resourceId: newJob.id,
      details: `Manually created job posting '${newJob.title}' at ${newJob.company}`,
    });

    return NextResponse.json({
      success: true,
      message: "Job posting created successfully.",
      data: mapJob(newJob),
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to create job posting");
  }
}
