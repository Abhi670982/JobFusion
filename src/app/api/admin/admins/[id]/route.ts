import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

function mapUser(u: any) {
  if (!u) return null;
  return {
    _id: u.id,
    clerkId: u.clerkId,
    email: u.email,
    fullName: u.fullName,
    profileImage: u.profileImage,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  };
}

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

    const resolvedParams = await params;
    const adminId = resolvedParams.id;
    const body = await req.json();
    const { status } = body; // "active" | "suspended"

    const targetAdmin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!targetAdmin || targetAdmin.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin not found." }, { status: 404 });
    }

    // Prevent suspending oneself
    if (targetAdmin.clerkId === admin.clerkId && status === "suspended") {
      return NextResponse.json({ success: false, error: "You cannot suspend your own account." }, { status: 400 });
    }

    // If suspending, ensure there's at least one active admin remaining
    if (status === "suspended") {
      const activeAdminsCount = await prisma.user.count({
        where: {
          role: "admin",
          status: { not: "suspended" }
        }
      });
      if (activeAdminsCount <= 1) {
        return NextResponse.json({ success: false, error: "Cannot suspend the last remaining active admin." }, { status: 400 });
      }
    }

    // Update in Postgres
    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: { status }
    });

    // Log action
    await logAdminAction({
      req,
      admin: {
        _id: admin.id,
        fullName: admin.fullName,
        email: admin.email
      },
      action: status === "suspended" ? "Suspended Admin" : "Activated Admin",
      resource: "Admin",
      resourceId: adminId,
      details: `${status === "suspended" ? "Suspended" : "Activated"} admin: ${targetAdmin.fullName} (${targetAdmin.email})`,
    });

    return NextResponse.json({
      success: true,
      message: `Admin account status updated to ${status}.`,
      data: mapUser(updatedAdmin),
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

    const resolvedParams = await params;
    const adminId = resolvedParams.id;

    const targetAdmin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!targetAdmin || targetAdmin.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin not found." }, { status: 404 });
    }

    // Prevent removing oneself
    if (targetAdmin.clerkId === admin.clerkId) {
      return NextResponse.json({ success: false, error: "You cannot remove your own admin access." }, { status: 400 });
    }

    // Ensure there's at least one active admin remaining
    const activeAdminsCount = await prisma.user.count({
      where: {
        role: "admin",
        status: { not: "suspended" }
      }
    });
    const isTargetActive = targetAdmin.status !== "suspended";
    if (isTargetActive && activeAdminsCount <= 1) {
      return NextResponse.json({ success: false, error: "Cannot remove the last remaining active admin." }, { status: 400 });
    }

    // Demote role to "jobseeker" in Postgres
    await prisma.user.update({
      where: { id: adminId },
      data: { role: "jobseeker" }
    });

    // Remove email from Settings allowedAdminEmails in Postgres
    let globalSettings = await prisma.settings.findUnique({
      where: { settingsId: "global" }
    });

    if (globalSettings && targetAdmin.email) {
      const emailLower = targetAdmin.email.toLowerCase();
      const allowedEmails = (globalSettings.allowedAdminEmails as string[]) || [];
      const updatedEmails = allowedEmails.filter((e: string) => e.toLowerCase() !== emailLower);

      await prisma.settings.update({
        where: { settingsId: "global" },
        data: { allowedAdminEmails: updatedEmails }
      });
    }

    // Log action
    await logAdminAction({
      req,
      admin: {
        _id: admin.id,
        fullName: admin.fullName,
        email: admin.email
      },
      action: "Removed Admin",
      resource: "Admin",
      resourceId: adminId,
      details: `Demoted admin ${targetAdmin.fullName} (${targetAdmin.email}) to jobseeker`,
    });

    // Create Notification in Postgres
    const notif = await prisma.adminNotification.create({
      data: {
        type: "system_warning",
        title: "Admin Removed",
        message: `${targetAdmin.fullName} (${targetAdmin.email}) was demoted by ${admin.fullName}`,
        isRead: false,
        timestamp: new Date()
      }
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
