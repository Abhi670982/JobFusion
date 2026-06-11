import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";

export const dynamic = "force-dynamic";


const isValidObjectId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

// 1. POST - Create a Job
export async function POST(req: NextRequest) {
  console.log("[API] POST /api/jobs - Hit");
  try {
    await connectDB();
    console.log("[API] POST /api/jobs - Database connected");

    const body = await req.json();
    const { title, company, location, salary, description, source, applyUrl } = body;
    console.log(`[API] POST /api/jobs - Title: '${title}', Company: '${company}'`);

    // Validate required fields
    if (!title || !company) {
      console.warn("[API] POST /api/jobs - Bad Request: missing title or company");
      return NextResponse.json(
        { success: false, error: "title and company are required fields" },
        { status: 400 }
      );
    }

    const job = await Job.create({
      title,
      company,
      location,
      salary,
      description,
      source,
      applyUrl,
    });

    console.log(`[API] POST /api/jobs - Success: Job created (ID: ${job._id})`);
    return NextResponse.json(
      { success: true, data: job },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API] POST /api/jobs - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 2. GET - Read Jobs (Single or All)
export async function GET(req: NextRequest) {
  console.log("[API] GET /api/jobs - Hit");
  try {
    await connectDB();
    console.log("[API] GET /api/jobs - Database connected");

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    console.log(`[API] GET /api/jobs - Requested Job ID: ${id || "ALL"}`);

    // Get specific job
    if (id) {
      if (!isValidObjectId(id)) {
        console.warn(`[API] GET /api/jobs - Bad Request: Invalid job ID format '${id}'`);
        return NextResponse.json(
          { success: false, error: "Invalid job ID format" },
          { status: 400 }
        );
      }
      const job = await Job.findById(id);
      if (!job) {
        console.warn(`[API] GET /api/jobs - Not Found: Job not found (ID: ${id})`);
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 }
        );
      }
      console.log(`[API] GET /api/jobs - Success: Found job (ID: ${id})`);
      return NextResponse.json({ success: true, data: job });
    }

    // Get all jobs
    const jobs = await Job.find().sort({ createdAt: -1 });
    console.log(`[API] GET /api/jobs - Success: Found ${jobs.length} jobs`);
    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    console.error("[API] GET /api/jobs - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 3. PUT - Update a Job
export async function PUT(req: NextRequest) {
  console.log("[API] PUT /api/jobs - Hit");
  try {
    await connectDB();
    console.log("[API] PUT /api/jobs - Database connected");

    const body = await req.json();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id") || body.id;
    console.log(`[API] PUT /api/jobs - Requested Update for Job ID: ${id}`);

    if (!id) {
      console.warn("[API] PUT /api/jobs - Bad Request: missing Job ID");
      return NextResponse.json(
        { success: false, error: "Job id is required to update a job" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      console.warn(`[API] PUT /api/jobs - Bad Request: Invalid job ID format '${id}'`);
      return NextResponse.json(
        { success: false, error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    const { _id, ...updateData } = body;
    console.log(`[API] PUT /api/jobs - Updating job ${id} fields:`, Object.keys(updateData));

    const updatedJob = await Job.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedJob) {
      console.warn(`[API] PUT /api/jobs - Not Found: Job not found to update (ID: ${id})`);
      return NextResponse.json(
        { success: false, error: "Job not found to update" },
        { status: 404 }
      );
    }

    console.log(`[API] PUT /api/jobs - Success: Updated job ${id}`);
    return NextResponse.json({ success: true, data: updatedJob });
  } catch (error: any) {
    console.error("[API] PUT /api/jobs - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 4. DELETE - Delete a Job
export async function DELETE(req: NextRequest) {
  console.log("[API] DELETE /api/jobs - Hit");
  try {
    await connectDB();
    console.log("[API] DELETE /api/jobs - Database connected");

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    console.log(`[API] DELETE /api/jobs - Requested Delete for Job ID: ${id}`);

    if (!id) {
      console.warn("[API] DELETE /api/jobs - Bad Request: missing Job ID");
      return NextResponse.json(
        { success: false, error: "Job id is required to delete a job" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      console.warn(`[API] DELETE /api/jobs - Bad Request: Invalid job ID format '${id}'`);
      return NextResponse.json(
        { success: false, error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    const deletedJob = await Job.findByIdAndDelete(id);
    if (!deletedJob) {
      console.warn(`[API] DELETE /api/jobs - Not Found: Job not found to delete (ID: ${id})`);
      return NextResponse.json(
        { success: false, error: "Job not found to delete" },
        { status: 404 }
      );
    }

    console.log(`[API] DELETE /api/jobs - Success: Deleted job ${id}`);
    return NextResponse.json({
      success: true,
      data: deletedJob,
      message: "Job deleted successfully",
    });
  } catch (error: any) {
    console.error("[API] DELETE /api/jobs - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
