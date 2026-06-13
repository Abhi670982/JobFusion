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
  try {
    await connectDB();
    const body = await req.json();
    const { userId, jobId, status } = body;

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

    // Check for duplicate application
    const existingApplication = await Application.findOne({ userId, jobId });
    if (existingApplication) {
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

    return NextResponse.json(
      { success: true, data: populatedApplication },
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
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const jobId = searchParams.get("jobId");

    // Get specific application by application ID
    if (id) {
      if (!isValidObjectId(id)) {
        return NextResponse.json(
          { success: false, error: "Invalid application ID format" },
          { status: 400 }
        );
      }
      const application = await Application.findById(id)
        .populate("userId")
        .populate("jobId");
      if (!application) {
        return NextResponse.json(
          { success: false, error: "Application not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: application });
    }

    // Get applications by userId
    if (userId) {
      if (!isValidObjectId(userId)) {
        return NextResponse.json(
          { success: false, error: "Invalid userId format" },
          { status: 400 }
        );
      }
      const applications = await Application.find({ userId })
        .populate("userId")
        .populate("jobId")
        .sort({ appliedAt: -1 });
      return NextResponse.json({ success: true, data: applications });
    }

    // Get applications by jobId
    if (jobId) {
      if (!isValidObjectId(jobId)) {
        return NextResponse.json(
          { success: false, error: "Invalid jobId format" },
          { status: 400 }
        );
      }
      const applications = await Application.find({ jobId })
        .populate("userId")
        .populate("jobId")
        .sort({ appliedAt: -1 });
      return NextResponse.json({ success: true, data: applications });
    }

    // Get all applications
    const applications = await Application.find()
      .populate("userId")
      .populate("jobId")
      .sort({ appliedAt: -1 });
    return NextResponse.json({ success: true, data: applications });
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
    await connectDB();
    const body = await req.json();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id") || body.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Application id is required to update" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
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
      return NextResponse.json(
        { success: false, error: "Application not found to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedApplication });
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
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Application id is required to delete" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid application ID format" },
        { status: 400 }
      );
    }

    const deletedApplication = await Application.findByIdAndDelete(id);
    if (!deletedApplication) {
      return NextResponse.json(
        { success: false, error: "Application not found to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedApplication,
      message: "Application deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
