import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function mapApplication(app: any) {
  if (!app) return null;
  return {
    _id: app.id,
    userId: app.user ? {
      _id: app.user.id,
      clerkId: app.user.clerkId,
      fullName: app.user.fullName,
      email: app.user.email,
      profileImage: app.user.profileImage,
      role: app.user.role,
      status: app.user.status,
      createdAt: app.user.createdAt,
      updatedAt: app.user.updatedAt
    } : app.userId,
    jobId: app.job ? {
      _id: app.job.id,
      title: app.job.title,
      company: app.job.company,
      companyLogo: app.job.companyLogo,
      companyColor: app.job.companyColor,
      location: app.job.location,
      locationType: app.job.locationType,
      salary: app.job.salary,
      experience: app.job.experience,
      experienceLevel: app.job.experienceLevel,
      type: app.job.type === "full_time" ? "full-time" : (app.job.type === "part_time" ? "part-time" : app.job.type),
      postedAt: app.job.postedAt,
      postedAtDate: app.job.postedAtDate,
      category: app.job.category,
      source: app.job.source,
      applyUrl: app.job.applyUrl
    } : app.jobId,
    status: app.status === "Under_Review" ? "Under Review" : app.status,
    appliedAt: app.appliedAt,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt
  };
}

// 1. POST - Create an Application
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, jobId, status } = body;

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

    // Check for duplicate application in PostgreSQL
    const existingApplication = await prisma.application.findUnique({
      where: { userId_jobId: { userId, jobId } }
    });

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: "You have already applied for this job" },
        { status: 409 }
      );
    }

    // Translate status for Postgres
    let pgStatus = "Applied";
    if (status === "Under Review") pgStatus = "Under_Review";
    else if (status) pgStatus = status;

    // Create in PostgreSQL
    const application = await prisma.application.create({
      data: {
        userId,
        jobId,
        status: pgStatus as any,
      },
      include: {
        user: true,
        job: true
      }
    });

    return NextResponse.json(
      { success: true, data: mapApplication(application) },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 2. GET - Read Applications (Single, by User, by Job, or All)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");

    // Get specific application by application ID
    if (id) {
      const application = await prisma.application.findUnique({
        where: { id },
        include: { user: true, job: true }
      });
      if (!application) {
        return NextResponse.json(
          { success: false, error: "Application not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: mapApplication(application) });
    }

    // Get applications by userId
    if (userId) {
      const applications = await prisma.application.findMany({
        where: { userId },
        include: { user: true, job: true },
        orderBy: { appliedAt: "desc" }
      });
      return NextResponse.json({ success: true, data: applications.map(mapApplication) });
    }

    // Get applications by jobId
    if (jobId) {
      const applications = await prisma.application.findMany({
        where: { jobId },
        include: { user: true, job: true },
        orderBy: { appliedAt: "desc" }
      });
      return NextResponse.json({ success: true, data: applications.map(mapApplication) });
    }

    // Get all applications
    const applications = await prisma.application.findMany({
      include: { user: true, job: true },
      orderBy: { appliedAt: "desc" }
    });
    return NextResponse.json({ success: true, data: applications.map(mapApplication) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 3. PUT - Update an Application (e.g. status)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || body.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Application id is required to update" },
        { status: 400 }
      );
    }

    const { _id, userId, jobId, status, ...updateData } = body;

    // Translate status for Postgres
    let pgStatus = undefined;
    if (status === "Under Review") pgStatus = "Under_Review";
    else if (status) pgStatus = status;

    const dataToUpdate: any = { ...updateData };
    if (pgStatus) dataToUpdate.status = pgStatus;

    // Update in Postgres
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: dataToUpdate,
      include: { user: true, job: true }
    });

    return NextResponse.json({ success: true, data: mapApplication(updatedApplication) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 4. DELETE - Delete an Application
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Application id is required to delete" },
        { status: 400 }
      );
    }

    // Delete in PostgreSQL
    const deletedApplication = await prisma.application.delete({
      where: { id }
    });

    // Map minimal deleted payload
    const mappedDeleted = {
      _id: deletedApplication.id,
      userId: deletedApplication.userId,
      jobId: deletedApplication.jobId,
      status: deletedApplication.status === "Under_Review" ? "Under Review" : deletedApplication.status
    };

    return NextResponse.json({
      success: true,
      data: mappedDeleted,
      message: "Application deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
