import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import SavedJob from "@/models/SavedJob";
import User from "@/models/User";
import Job from "@/models/Job";

export const dynamic = "force-dynamic";


const isValidObjectId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

// 1. POST - Save a Job
export async function POST(req: NextRequest) {
  console.log("[API] POST /api/saved-jobs - Hit");
  try {
    await connectDB();
    console.log("[API] POST /api/saved-jobs - Database connected");

    const body = await req.json();
    const { userId, jobId } = body;
    console.log(`[API] POST /api/saved-jobs - userId: '${userId}', jobId: '${jobId}'`);

    // Validate required fields
    if (!userId || !jobId) {
      console.warn("[API] POST /api/saved-jobs - Bad Request: missing userId or jobId");
      return NextResponse.json(
        { success: false, error: "userId and jobId are required fields" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(userId) || !isValidObjectId(jobId)) {
      console.warn(`[API] POST /api/saved-jobs - Bad Request: Invalid format (userId='${userId}', jobId='${jobId}')`);
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
      console.warn(`[API] POST /api/saved-jobs - Not Found: User not found (ID: ${userId})`);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (!jobExists) {
      console.warn(`[API] POST /api/saved-jobs - Not Found: Job not found (ID: ${jobId})`);
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if job is already saved
    const existingSavedJob = await SavedJob.findOne({ userId, jobId });
    if (existingSavedJob) {
      console.warn(`[API] POST /api/saved-jobs - Conflict: Job already saved by user ${userId}`);
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

    console.log(`[API] POST /api/saved-jobs - Success: Job saved (ID: ${savedJob._id})`);
    return NextResponse.json(
      { success: true, data: populatedSavedJob },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API] POST /api/saved-jobs - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 2. GET - Read Saved Jobs (Single, by User, by Job, or All)
export async function GET(req: NextRequest) {
  console.log("[API] GET /api/saved-jobs - Hit");
  try {
    await connectDB();
    console.log("[API] GET /api/saved-jobs - Database connected");

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");
    console.log(`[API] GET /api/saved-jobs - Query parameters (id: '${id}', userId: '${userId}', jobId: '${jobId}')`);

    // Get specific saved job by ID
    if (id) {
      if (!isValidObjectId(id)) {
        console.warn(`[API] GET /api/saved-jobs - Bad Request: Invalid saved job ID format '${id}'`);
        return NextResponse.json(
          { success: false, error: "Invalid saved job ID format" },
          { status: 400 }
        );
      }
      const savedJob = await SavedJob.findById(id)
        .populate("userId")
        .populate("jobId");
      if (!savedJob) {
        console.warn(`[API] GET /api/saved-jobs - Not Found: Saved job record not found (ID: ${id})`);
        return NextResponse.json(
          { success: false, error: "Saved job record not found" },
          { status: 404 }
        );
      }
      console.log(`[API] GET /api/saved-jobs - Success: Found saved job (ID: ${id})`);
      return NextResponse.json({ success: true, data: savedJob });
    }

    // Get saved jobs by userId
    if (userId) {
      if (!isValidObjectId(userId)) {
        console.warn(`[API] GET /api/saved-jobs - Bad Request: Invalid userId format '${userId}'`);
        return NextResponse.json(
          { success: false, error: "Invalid userId format" },
          { status: 400 }
        );
      }
      const savedJobs = await SavedJob.find({ userId })
        .populate("userId")
        .populate("jobId")
        .sort({ savedAt: -1 });
      console.log(`[API] GET /api/saved-jobs - Success: Found ${savedJobs.length} saved jobs for user ${userId}`);
      return NextResponse.json({ success: true, data: savedJobs });
    }

    // Get saved jobs by jobId
    if (jobId) {
      if (!isValidObjectId(jobId)) {
        console.warn(`[API] GET /api/saved-jobs - Bad Request: Invalid jobId format '${jobId}'`);
        return NextResponse.json(
          { success: false, error: "Invalid jobId format" },
          { status: 400 }
        );
      }
      const savedJobs = await SavedJob.find({ jobId })
        .populate("userId")
        .populate("jobId")
        .sort({ savedAt: -1 });
      console.log(`[API] GET /api/saved-jobs - Success: Found ${savedJobs.length} saves for job ${jobId}`);
      return NextResponse.json({ success: true, data: savedJobs });
    }

    // Get all saved jobs
    const savedJobs = await SavedJob.find()
      .populate("userId")
      .populate("jobId")
      .sort({ savedAt: -1 });
    console.log(`[API] GET /api/saved-jobs - Success: Found ${savedJobs.length} saved jobs in total`);
    return NextResponse.json({ success: true, data: savedJobs });
  } catch (error: any) {
    console.error("[API] GET /api/saved-jobs - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 3. PUT - Update a Saved Job (e.g. modify savedAt or metadata)
export async function PUT(req: NextRequest) {
  console.log("[API] PUT /api/saved-jobs - Hit");
  try {
    await connectDB();
    console.log("[API] PUT /api/saved-jobs - Database connected");

    const body = await req.json();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id") || body.id;
    console.log(`[API] PUT /api/saved-jobs - Updating saved job record: ${id}`);

    if (!id) {
      console.warn("[API] PUT /api/saved-jobs - Bad Request: missing saved job ID");
      return NextResponse.json(
        { success: false, error: "Saved job id is required to update" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      console.warn(`[API] PUT /api/saved-jobs - Bad Request: Invalid ID format '${id}'`);
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
      console.warn(`[API] PUT /api/saved-jobs - Not Found: record not found to update (ID: ${id})`);
      return NextResponse.json(
        { success: false, error: "Saved job record not found to update" },
        { status: 404 }
      );
    }

    console.log(`[API] PUT /api/saved-jobs - Success: Updated saved job record ${id}`);
    return NextResponse.json({ success: true, data: updatedSavedJob });
  } catch (error: any) {
    console.error("[API] PUT /api/saved-jobs - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 4. DELETE - Delete a Saved Job (Unsave)
export async function DELETE(req: NextRequest) {
  console.log("[API] DELETE /api/saved-jobs - Hit");
  try {
    await connectDB();
    console.log("[API] DELETE /api/saved-jobs - Database connected");

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");
    console.log(`[API] DELETE /api/saved-jobs - Delete query parameters (id: '${id}', userId: '${userId}', jobId: '${jobId}')`);

    // Case A: Delete by unique SavedJob ID
    if (id) {
      if (!isValidObjectId(id)) {
        console.warn(`[API] DELETE /api/saved-jobs - Bad Request: Invalid ID format '${id}'`);
        return NextResponse.json(
          { success: false, error: "Invalid saved job ID format" },
          { status: 400 }
        );
      }
      const deletedSavedJob = await SavedJob.findByIdAndDelete(id);
      if (!deletedSavedJob) {
        console.warn(`[API] DELETE /api/saved-jobs - Not Found: Record not found to delete (ID: ${id})`);
        return NextResponse.json(
          { success: false, error: "Saved job record not found to delete" },
          { status: 404 }
        );
      }
      console.log(`[API] DELETE /api/saved-jobs - Success: Deleted by ID ${id}`);
      return NextResponse.json({
        success: true,
        data: deletedSavedJob,
        message: "Job unsaved successfully",
      });
    }

    // Case B: Delete by userId and jobId combination
    if (userId && jobId) {
      if (!isValidObjectId(userId) || !isValidObjectId(jobId)) {
        console.warn(`[API] DELETE /api/saved-jobs - Bad Request: Invalid format (userId='${userId}', jobId='${jobId}')`);
        return NextResponse.json(
          { success: false, error: "Invalid userId or jobId format" },
          { status: 400 }
        );
      }
      const deletedSavedJob = await SavedJob.findOneAndDelete({ userId, jobId });
      if (!deletedSavedJob) {
        console.warn(`[API] DELETE /api/saved-jobs - Not Found: Record not found to delete (userId='${userId}', jobId='${jobId}')`);
        return NextResponse.json(
          { success: false, error: "Saved job record not found to delete" },
          { status: 404 }
        );
      }
      console.log(`[API] DELETE /api/saved-jobs - Success: Deleted by combination of userId ${userId} and jobId ${jobId}`);
      return NextResponse.json({
        success: true,
        data: deletedSavedJob,
        message: "Job unsaved successfully",
      });
    }

    console.warn("[API] DELETE /api/saved-jobs - Bad Request: missing required parameters");
    return NextResponse.json(
      { success: false, error: "Either id, or both userId and jobId query parameters are required to unsave a job" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] DELETE /api/saved-jobs - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
