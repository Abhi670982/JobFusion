import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import User from "@/models/User";
import Settings from "@/models/Settings";
import AdminNotification from "@/models/AdminNotification";
import { logAdminAction } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

// ── SUSPEND / ACTIVATE ADMIN ───────────────────────────────────────────────
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
    const adminId = resolvedParams.id;
    const body = await req.json();
    const { status } = body; // "active" | "suspended"

    const targetAdmin = await User.findById(adminId);
    if (!targetAdmin || targetAdmin.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin not found." }, { status: 404 });
    }

    // Prevent suspending oneself
    if (targetAdmin.clerkId === admin.clerkId && status === "suspended") {
      return NextResponse.json({ success: false, error: "You cannot suspend your own account." }, { status: 400 });
    }

    // If suspending, ensure there's at least one active admin remaining
    if (status === "suspended") {
      const activeAdminsCount = await User.countDocuments({ role: "admin", status: { $ne: "suspended" } });
      if (activeAdminsCount <= 1) {
        return NextResponse.json({ success: false, error: "Cannot suspend the last remaining active admin." }, { status: 400 });
      }
    }

    targetAdmin.status = status;
    await targetAdmin.save();

    // Log action
    await logAdminAction({
      req,
      admin,
      action: status === "suspended" ? "Suspended Admin" : "Activated Admin",
      resource: "Admin",
      resourceId: adminId,
      details: `${status === "suspended" ? "Suspended" : "Activated"} admin: ${targetAdmin.fullName} (${targetAdmin.email})`,
    });

    return NextResponse.json({
      success: true,
      message: `Admin account status updated to ${status}.`,
      data: targetAdmin,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update admin status" },
      { status: 500 }
    );
  }
}

// ── REMOVE ADMIN ───────────────────────────────────────────────────────────
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
    const adminId = resolvedParams.id;

    const targetAdmin = await User.findById(adminId);
    if (!targetAdmin || targetAdmin.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin not found." }, { status: 404 });
    }

    // Prevent removing oneself
    if (targetAdmin.clerkId === admin.clerkId) {
      return NextResponse.json({ success: false, error: "You cannot remove your own admin access." }, { status: 400 });
    }

    // Ensure there's at least one active admin remaining
    const activeAdminsCount = await User.countDocuments({ role: "admin", status: { $ne: "suspended" } });
    const isTargetActive = targetAdmin.status !== "suspended";
    if (isTargetActive && activeAdminsCount <= 1) {
      return NextResponse.json({ success: false, error: "Cannot remove the last remaining active admin." }, { status: 400 });
    }

    // Demote role to "jobseeker"
    targetAdmin.role = "jobseeker";
    await targetAdmin.save();

    // Remove email from Settings allowedAdminEmails
    const globalSettings = await Settings.findOne({ settingsId: "global" });
    if (globalSettings && targetAdmin.email) {
      const emailLower = targetAdmin.email.toLowerCase();
      globalSettings.allowedAdminEmails = (globalSettings.allowedAdminEmails || []).filter(
        (e: string) => e.toLowerCase() !== emailLower
      );
      await globalSettings.save();
    }

    // Log action
    await logAdminAction({
      req,
      admin,
      action: "Removed Admin",
      resource: "Admin",
      resourceId: adminId,
      details: `Demoted admin ${targetAdmin.fullName} (${targetAdmin.email}) to jobseeker`,
    });

    // Create Notification
    await AdminNotification.create({
      type: "admin_removed",
      title: "Admin Removed",
      message: `${targetAdmin.fullName} (${targetAdmin.email}) was demoted by ${admin.fullName}`,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      message: `${targetAdmin.fullName} demoted to jobseeker successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove admin" },
      { status: 500 }
    );
  }
}
