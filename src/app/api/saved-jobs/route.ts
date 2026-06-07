import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import SavedJob from "@/models/SavedJob";
import User from "@/models/User";
import Job from "@/models/Job";

const isValidObjectId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

// 1. POST - Save a Job
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, jobId } = body;

    // Validate required fields
    if (!userId || !jobId) {
      return NextResponse.json(
        { success: false, error: "userId and jobId are required fields" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(userId) || !isValidObjectId(jobId)) {
      return NextResponse.json(
        { success: false, error: "Invalid userId or jobId format" },
        { status: 400 }
      );
    }

    // Verify User and Job exist
    const [userExists, jobExists] = await Promise.all([
      User.findById(userId),
      Job.findById(jobId),
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

    // Check if job is already saved
    const existingSavedJob = await SavedJob.findOne({ userId, jobId });
    if (existingSavedJob) {
      return NextResponse.json(
        { success: false, error: "Job is already saved by this user" },
        { status: 409 }
      );
    }

    const savedJob = await SavedJob.create({
      userId,
      jobId,
    });

    const populatedSavedJob = await SavedJob.findById(savedJob._id)
      .populate("userId")
      .populate("jobId");

    return NextResponse.json(
      { success: true, data: populatedSavedJob },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 2. GET - Read Saved Jobs (Single, by User, by Job, or All)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");

    // Get specific saved job by ID
    if (id) {
      if (!isValidObjectId(id)) {
        return NextResponse.json(
          { success: false, error: "Invalid saved job ID format" },
          { status: 400 }
        );
      }
      const savedJob = await SavedJob.findById(id)
        .populate("userId")
        .populate("jobId");
      if (!savedJob) {
        return NextResponse.json(
          { success: false, error: "Saved job record not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: savedJob });
    }

    // Get saved jobs by userId
    if (userId) {
      if (!isValidObjectId(userId)) {
        return NextResponse.json(
          { success: false, error: "Invalid userId format" },
          { status: 400 }
        );
      }
      const savedJobs = await SavedJob.find({ userId })
        .populate("userId")
        .populate("jobId")
        .sort({ savedAt: -1 });
      return NextResponse.json({ success: true, data: savedJobs });
    }

    // Get saved jobs by jobId
    if (jobId) {
      if (!isValidObjectId(jobId)) {
        return NextResponse.json(
          { success: false, error: "Invalid jobId format" },
          { status: 400 }
        );
      }
      const savedJobs = await SavedJob.find({ jobId })
        .populate("userId")
        .populate("jobId")
        .sort({ savedAt: -1 });
      return NextResponse.json({ success: true, data: savedJobs });
    }

    // Get all saved jobs
    const savedJobs = await SavedJob.find()
      .populate("userId")
      .populate("jobId")
      .sort({ savedAt: -1 });
    return NextResponse.json({ success: true, data: savedJobs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 3. PUT - Update a Saved Job (e.g. modify savedAt or metadata)
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id") || body.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Saved job id is required to update" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid saved job ID format" },
        { status: 400 }
      );
    }

    // Prevent modifying core relationships in PUT
    const { _id, userId, jobId, ...updateData } = body;

    const updatedSavedJob = await SavedJob.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("userId")
      .populate("jobId");

    if (!updatedSavedJob) {
      return NextResponse.json(
        { success: false, error: "Saved job record not found to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedSavedJob });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 4. DELETE - Delete a Saved Job (Unsave)
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");

    // Case A: Delete by unique SavedJob ID
    if (id) {
      if (!isValidObjectId(id)) {
        return NextResponse.json(
          { success: false, error: "Invalid saved job ID format" },
          { status: 400 }
        );
      }
      const deletedSavedJob = await SavedJob.findByIdAndDelete(id);
      if (!deletedSavedJob) {
        return NextResponse.json(
          { success: false, error: "Saved job record not found to delete" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: deletedSavedJob,
        message: "Job unsaved successfully",
      });
    }

    // Case B: Delete by userId and jobId combination
    if (userId && jobId) {
      if (!isValidObjectId(userId) || !isValidObjectId(jobId)) {
        return NextResponse.json(
          { success: false, error: "Invalid userId or jobId format" },
          { status: 400 }
        );
      }
      const deletedSavedJob = await SavedJob.findOneAndDelete({ userId, jobId });
      if (!deletedSavedJob) {
        return NextResponse.json(
          { success: false, error: "Saved job record not found to delete" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: deletedSavedJob,
        message: "Job unsaved successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Either id, or both userId and jobId query parameters are required to unsave a job" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
