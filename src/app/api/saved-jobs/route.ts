import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SavedJobWithUserAndJob = Prisma.SavedJobGetPayload<{
  include: { user: true; job: true };
}>;

function mapSavedJob(sj: SavedJobWithUserAndJob | null) {
  if (!sj) return null;
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
    jobId: sj.job ? {
      _id: sj.job.id,
      title: sj.job.title,
      company: sj.job.company,
      companyLogo: sj.job.companyLogo,
      companyColor: sj.job.companyColor,
      location: sj.job.location,
      locationType: sj.job.locationType,
      salary: sj.job.salary,
      experience: sj.job.experience,
      experienceLevel: sj.job.experienceLevel,
      type: sj.job.type === "full_time" ? "full-time" : (sj.job.type === "part_time" ? "part-time" : sj.job.type),
      postedAt: sj.job.postedAt,
      postedAtDate: sj.job.postedAtDate,
      category: sj.job.category,
      source: sj.job.source,
      applyUrl: sj.job.applyUrl
    } : sj.jobId,
    savedAt: sj.savedAt,
    createdAt: sj.createdAt,
    updatedAt: sj.updatedAt
  };
}

// 1. POST - Save a Job
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, jobId } = body;

    // Validate required fields
    if (!userId || !jobId) {
      return NextResponse.json(
        { success: false, error: "userId and jobId are required fields" },
        { status: 400 }
      );
    }

    // Verify User and Job exist in PostgreSQL
    const [userExists, jobExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.job.findUnique({ where: { id: jobId } }),
    ]);

    if (!userExists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (!jobExists) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if job is already saved in PostgreSQL
    const existingSavedJob = await prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } }
    });

    if (existingSavedJob) {
      return NextResponse.json(
        { success: false, error: "Job is already saved by this user" },
        { status: 409 }
      );
    }

    // Create in PostgreSQL
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
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// 2. GET - Read Saved Jobs (Single, by User, by Job, or All)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");

    // Get specific saved job by ID
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
      return NextResponse.json({ success: true, data: mapSavedJob(savedJob) });
    }

    // Get saved jobs by userId
    if (userId) {
      const savedJobs = await prisma.savedJob.findMany({
        where: { userId },
        include: { user: true, job: true },
        orderBy: { savedAt: "desc" }
      });
      return NextResponse.json({ success: true, data: savedJobs.map(mapSavedJob) });
    }

    // Get saved jobs by jobId
    if (jobId) {
      const savedJobs = await prisma.savedJob.findMany({
        where: { jobId },
        include: { user: true, job: true },
        orderBy: { savedAt: "desc" }
      });
      return NextResponse.json({ success: true, data: savedJobs.map(mapSavedJob) });
    }

    // Get all saved jobs
    const savedJobs = await prisma.savedJob.findMany({
      include: { user: true, job: true },
      orderBy: { savedAt: "desc" }
    });
    return NextResponse.json({ success: true, data: savedJobs.map(mapSavedJob) });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// 3. PUT - Update a Saved Job
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || body.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Saved job id is required to update" },
        { status: 400 }
      );
    }

    const updateData = { ...body };
    delete updateData._id;
    delete updateData.userId;
    delete updateData.jobId;

    // Update in Postgres
    const updatedSavedJob = await prisma.savedJob.update({
      where: { id },
      data: updateData,
      include: { user: true, job: true }
    });

    return NextResponse.json({ success: true, data: mapSavedJob(updatedSavedJob) });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// 4. DELETE - Delete a Saved Job (Unsave)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");

    let deletedSavedJob = null;

    // Case A: Delete by unique SavedJob ID
    if (id) {
      deletedSavedJob = await prisma.savedJob.delete({
        where: { id }
      });
    }
    // Case B: Delete by userId and jobId combination
    else if (userId && jobId) {
      deletedSavedJob = await prisma.savedJob.delete({
        where: { userId_jobId: { userId, jobId } }
      });
    }

    if (deletedSavedJob) {
      // Map basic info for payload compatibility
      const mappedDeleted = {
        _id: deletedSavedJob.id,
        userId: deletedSavedJob.userId,
        jobId: deletedSavedJob.jobId,
        savedAt: deletedSavedJob.savedAt
      };
      
      return NextResponse.json({
        success: true,
        data: mappedDeleted,
        message: "Job unsaved successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Either id, or both userId and jobId query parameters are required to unsave a job" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
