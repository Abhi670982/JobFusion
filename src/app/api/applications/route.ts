import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Application from "@/models/Application";
import User from "@/models/User";
import Job from "@/models/Job";

export const dynamic = "force-dynamic";

const isValidObjectId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

// 1. POST - Create an Application
export async function POST(req: NextRequest) {
  console.log("[API] POST /api/applications - Hit");
  try {
    await connectDB();
    console.log("[API] POST /api/applications - Database connected");

    const body = await req.json();
    const { userId, jobId, status } = body;
    console.log(`[API] POST /api/applications - userId: '${userId}', jobId: '${jobId}', status: '${status || "Applied"}'`);

    // Validate required fields
    if (!userId || !jobId) {
      console.warn("[API] POST /api/applications - Bad Request: missing userId or jobId");
      return NextResponse.json(
        { success: false, error: "userId and jobId are required fields" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(userId) || !isValidObjectId(jobId)) {
      console.warn(`[API] POST /api/applications - Bad Request: Invalid format (userId='${userId}', jobId='${jobId}')`);
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
      console.warn(`[API] POST /api/applications - Not Found: User not found (ID: ${userId})`);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (!jobExists) {
      console.warn(`[API] POST /api/applications - Not Found: Job not found (ID: ${jobId})`);
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Check for duplicate application
    const existingApplication = await Application.findOne({ userId, jobId });
    if (existingApplication) {
      console.warn(`[API] POST /api/applications - Conflict: Application already exists for userId='${userId}', jobId='${jobId}'`);
      return NextResponse.json(
        { success: false, error: "You have already applied for this job" },
        { status: 409 }
      );
    }

    const application = await Application.create({
      userId,
      jobId,
      status: status || "Applied",
    });

    const populatedApplication = await Application.findById(application._id)
      .populate("userId")
      .populate("jobId");

    console.log(`[API] POST /api/applications - Success: Application created (ID: ${application._id})`);
    return NextResponse.json(
      { success: true, data: populatedApplication },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API] POST /api/applications - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 2. GET - Read Applications (Single, by User, by Job, or All)
export async function GET(req: NextRequest) {
  console.log("[API] GET /api/applications - Hit");
  try {
    await connectDB();
    console.log("[API] GET /api/applications - Database connected");

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");
    console.log(`[API] GET /api/applications - Query parameters (id: '${id}', userId: '${userId}', jobId: '${jobId}')`);

    // Get specific application by application ID
    if (id) {
      if (!isValidObjectId(id)) {
        console.warn(`[API] GET /api/applications - Bad Request: Invalid ID format '${id}'`);
        return NextResponse.json(
          { success: false, error: "Invalid application ID format" },
          { status: 400 }
        );
      }
      const application = await Application.findById(id)
        .populate("userId")
        .populate("jobId");
      if (!application) {
        console.warn(`[API] GET /api/applications - Not Found: Application not found (ID: ${id})`);
        return NextResponse.json(
          { success: false, error: "Application not found" },
          { status: 404 }
        );
      }
      console.log(`[API] GET /api/applications - Success: Found application (ID: ${id})`);
      return NextResponse.json({ success: true, data: application });
    }

    // Get applications by userId
    if (userId) {
      if (!isValidObjectId(userId)) {
        console.warn(`[API] GET /api/applications - Bad Request: Invalid userId format '${userId}'`);
        return NextResponse.json(
          { success: false, error: "Invalid userId format" },
          { status: 400 }
        );
      }
      const applications = await Application.find({ userId })
        .populate("userId")
        .populate("jobId")
        .sort({ appliedAt: -1 });
      console.log(`[API] GET /api/applications - Success: Found ${applications.length} applications for user ${userId}`);
      return NextResponse.json({ success: true, data: applications });
    }

    // Get applications by jobId
    if (jobId) {
      if (!isValidObjectId(jobId)) {
        console.warn(`[API] GET /api/applications - Bad Request: Invalid jobId format '${jobId}'`);
        return NextResponse.json(
          { success: false, error: "Invalid jobId format" },
          { status: 400 }
        );
      }
      const applications = await Application.find({ jobId })
        .populate("userId")
        .populate("jobId")
        .sort({ appliedAt: -1 });
      console.log(`[API] GET /api/applications - Success: Found ${applications.length} applications for job ${jobId}`);
      return NextResponse.json({ success: true, data: applications });
    }

    // Get all applications
    const applications = await Application.find()
      .populate("userId")
      .populate("jobId")
      .sort({ appliedAt: -1 });
    console.log(`[API] GET /api/applications - Success: Found ${applications.length} applications in total`);
    return NextResponse.json({ success: true, data: applications });
  } catch (error: any) {
    console.error("[API] GET /api/applications - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 3. PUT - Update an Application (e.g. status)
export async function PUT(req: NextRequest) {
  console.log("[API] PUT /api/applications - Hit");
  try {
    await connectDB();
    console.log("[API] PUT /api/applications - Database connected");

    const body = await req.json();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id") || body.id;
    console.log(`[API] PUT /api/applications - Updating application record: ${id}`);

    if (!id) {
      console.warn("[API] PUT /api/applications - Bad Request: missing application ID");
      return NextResponse.json(
        { success: false, error: "Application id is required to update" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      console.warn(`[API] PUT /api/applications - Bad Request: Invalid ID format '${id}'`);
      return NextResponse.json(
        { success: false, error: "Invalid application ID format" },
        { status: 400 }
      );
    }

    // Prevent modifying core relationships in PUT
    const { _id, userId, jobId, ...updateData } = body;

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("userId")
      .populate("jobId");

    if (!updatedApplication) {
      console.warn(`[API] PUT /api/applications - Not Found: application not found to update (ID: ${id})`);
      return NextResponse.json(
        { success: false, error: "Application not found to update" },
        { status: 404 }
      );
    }

    console.log(`[API] PUT /api/applications - Success: Updated application record ${id}`);
    return NextResponse.json({ success: true, data: updatedApplication });
  } catch (error: any) {
    console.error("[API] PUT /api/applications - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 4. DELETE - Delete an Application
export async function DELETE(req: NextRequest) {
  console.log("[API] DELETE /api/applications - Hit");
  try {
    await connectDB();
    console.log("[API] DELETE /api/applications - Database connected");

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    console.log(`[API] DELETE /api/applications - Deleting application record: ${id}`);

    if (!id) {
      console.warn("[API] DELETE /api/applications - Bad Request: missing application ID");
      return NextResponse.json(
        { success: false, error: "Application id is required to delete" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      console.warn(`[API] DELETE /api/applications - Bad Request: Invalid ID format '${id}'`);
      return NextResponse.json(
        { success: false, error: "Invalid application ID format" },
        { status: 400 }
      );
    }

    const deletedApplication = await Application.findByIdAndDelete(id);
    if (!deletedApplication) {
      console.warn(`[API] DELETE /api/applications - Not Found: application not found to delete (ID: ${id})`);
      return NextResponse.json(
        { success: false, error: "Application not found to delete" },
        { status: 404 }
      );
    }

    console.log(`[API] DELETE /api/applications - Success: Deleted application ${id}`);
    return NextResponse.json({
      success: true,
      data: deletedApplication,
      message: "Application deleted successfully",
    });
  } catch (error: any) {
    console.error("[API] DELETE /api/applications - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
