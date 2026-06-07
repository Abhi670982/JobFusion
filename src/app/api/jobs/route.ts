import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";

const isValidObjectId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

// 1. POST - Create a Job
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, company, location, salary, description, source, applyUrl } = body;

    // Validate required fields
    if (!title || !company) {
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

    return NextResponse.json(
      { success: true, data: job },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 2. GET - Read Jobs (Single or All)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Get specific job
    if (id) {
      if (!isValidObjectId(id)) {
        return NextResponse.json(
          { success: false, error: "Invalid job ID format" },
          { status: 400 }
        );
      }
      const job = await Job.findById(id);
      if (!job) {
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: job });
    }

    // Get all jobs
    const jobs = await Job.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: jobs });
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
    await connectDB();
    const body = await req.json();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id") || body.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Job id is required to update a job" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    const { _id, ...updateData } = body;

    const updatedJob = await Job.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedJob) {
      return NextResponse.json(
        { success: false, error: "Job not found to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedJob });
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
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Job id is required to delete a job" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    const deletedJob = await Job.findByIdAndDelete(id);
    if (!deletedJob) {
      return NextResponse.json(
        { success: false, error: "Job not found to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedJob,
      message: "Job deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
