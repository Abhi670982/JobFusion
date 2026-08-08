import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuthUser, verifyOwnership, safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

type SavedJobWithUserAndJob = Prisma.SavedJobGetPayload<{
  include: { user: true; job: true };
}>;

function mapSavedJob(sj: SavedJobWithUserAndJob | null) {
  if (!sj || !sj.job) return null;
  return {
    _id: sj.id,
    userId: sj.user ? {
      _id: sj.user.id,
      clerkId: sj.user.clerkId,
      fullName: sj.user.fullName,
      email: sj.user.email,
      profileImage: sj.user.profileImage,
      role: sj.user.role,
      status: sj.user.status,
      createdAt: sj.user.createdAt,
      updatedAt: sj.user.updatedAt
    } : sj.userId,
    jobId: {
      _id: sj.job.id,
      title: sj.job.title,
      company: sj.job.company,
      companyLogo: sj.job.companyLogo,
      companyColor: sj.job.companyColor,
      location: sj.job.location,
      locationType: sj.job.locationType,
      salary: sj.job.salary,
      salaryMin: sj.job.salaryMin,
      salaryMax: sj.job.salaryMax,
      experience: sj.job.experience,
      experienceLevel: sj.job.experienceLevel,
      type: sj.job.type === "full_time" ? "full-time" : (sj.job.type === "part_time" ? "part-time" : sj.job.type),
      skills: sj.job.skills || [],
      description: sj.job.description || "",
      requirements: sj.job.requirements || [],
      responsibilities: sj.job.responsibilities || [],
      benefits: sj.job.benefits || [],
      postedAt: sj.job.postedAt,
      postedAtDate: sj.job.postedAtDate,
      category: sj.job.category,
      source: sj.job.source,
      applyUrl: sj.job.applyUrl,
      sourceId: sj.job.sourceId,
      sourceUrl: sj.job.sourceUrl,
      city: sj.job.city,
      country: sj.job.country,
      isRemote: sj.job.isRemote,
      salaryCurrency: sj.job.salaryCurrency,
      salaryPeriod: sj.job.salaryPeriod,
      isActive: sj.job.isActive,
      expiresAt: sj.job.expiresAt
    },
    savedAt: sj.savedAt,
    createdAt: sj.createdAt,
    updatedAt: sj.updatedAt
  };
}

// 1. POST - Save a Job for Authenticated User
export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { jobId } = body;
    const userId = user.id;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }

    const jobExists = await prisma.job.findUnique({ where: { id: jobId } });
    if (!jobExists) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    const existingSavedJob = await prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } }
    });

    if (existingSavedJob) {
      return NextResponse.json(
        { success: false, error: "Job is already saved" },
        { status: 409 }
      );
    }

    const savedJob = await prisma.savedJob.create({
      data: {
        userId,
        jobId,
      },
      include: {
        user: true,
        job: true
      }
    });

    return NextResponse.json(
      { success: true, data: mapSavedJob(savedJob) },
      { status: 201 }
    );
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to save job");
  }
}

// 2. GET - Read Saved Jobs belonging exclusively to authenticated user
export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const savedJob = await prisma.savedJob.findUnique({
        where: { id },
        include: { user: true, job: true }
      });

      if (!savedJob) {
        return NextResponse.json(
          { success: false, error: "Saved job record not found" },
          { status: 404 }
        );
      }
      const forbidden = verifyOwnership(savedJob.userId, user.id);
      if (forbidden) return forbidden;

      return NextResponse.json({ success: true, data: mapSavedJob(savedJob) });
    }

    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: user.id },
      include: { user: true, job: true },
      orderBy: { savedAt: "desc" }
    });

    return NextResponse.json({ success: true, data: savedJobs.map(mapSavedJob).filter(Boolean) });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to fetch saved jobs");
  }
}

// 3. DELETE - Unsave a Job with Ownership Verification
export async function DELETE(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const jobId = searchParams.get("jobId");

    let savedJobToDelete = null;

    if (id) {
      savedJobToDelete = await prisma.savedJob.findUnique({ where: { id } });
    } else if (jobId) {
      savedJobToDelete = await prisma.savedJob.findUnique({
        where: { userId_jobId: { userId: user.id, jobId } }
      });
    }

    if (!savedJobToDelete) {
      return NextResponse.json(
        { success: false, error: "Saved job record not found" },
        { status: 404 }
      );
    }

    const forbidden = verifyOwnership(savedJobToDelete.userId, user.id);
    if (forbidden) return forbidden;

    const deletedSavedJob = await prisma.savedJob.delete({
      where: { id: savedJobToDelete.id }
    });

    return NextResponse.json({
      success: true,
      data: {
        _id: deletedSavedJob.id,
        userId: deletedSavedJob.userId,
        jobId: deletedSavedJob.jobId,
        savedAt: deletedSavedJob.savedAt
      },
      message: "Job unsaved successfully",
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to unsave job");
  }
}
