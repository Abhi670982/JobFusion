import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import User from "@/models/User";
import Profile from "@/models/Profile";
import Application from "@/models/Application";
import SavedJob from "@/models/SavedJob";
import Activity from "@/models/Activity";

export const dynamic = "force-dynamic";

// ── GET USER PROFILE DETAILS ────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Fetch linked profile
    const profile = await Profile.findOne({ userId: user._id }).lean();

    // Fetch user applications
    const applications = await Application.find({ userId: user._id })
      .populate("jobId")
      .sort({ appliedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        user,
        profile,
        applications,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load user details" },
      { status: 500 }
    );
  }
}

// ── UPDATE USER (SUSPEND/ACTIVATE) ───────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const resolvedParams = await params;
    const userId = resolvedParams.id;
    const body = await req.json();
    const { status, role } = body;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Do not allow suspending oneself
    if (user.clerkId === admin.clerkId && status === "suspended") {
      return NextResponse.json({ success: false, error: "You cannot suspend your own account." }, { status: 400 });
    }

    if (status !== undefined) {
      user.status = status;
    }
    if (role !== undefined) {
      user.role = role;
    }

    await user.save();

    // Log admin action in Activity collection using structured audit logger
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin,
      action: status === "suspended" ? "Suspended User" : "Activated User",
      resource: "User",
      resourceId: user._id.toString(),
      details: `${status === "suspended" ? "Suspended" : "Activated"} user: ${user.fullName} (${user.email})`,
    });

    return NextResponse.json({
      success: true,
      message: `User account updated to ${status || user.status}`,
      data: user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// ── DELETE USER (CASCADE) ───────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Prevent self deletion
    if (user.clerkId === admin.clerkId) {
      return NextResponse.json({ success: false, error: "You cannot delete your own account." }, { status: 400 });
    }

    // Perform cascade delete
    await Promise.all([
      User.findByIdAndDelete(userId),
      Profile.findOneAndDelete({ userId: userId }),
      Application.deleteMany({ userId: userId }),
      SavedJob.deleteMany({ userId: userId }),
      Activity.deleteMany({ userId: userId }),
    ]);

    // Log admin action using structured audit logger
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin,
      action: "Deleted User",
      resource: "User",
      resourceId: userId,
      details: `Permanently deleted user: ${user.fullName} (${user.email})`,
    });

    return NextResponse.json({
      success: true,
      message: "User and all associated profile data deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
