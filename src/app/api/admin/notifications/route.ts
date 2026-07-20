import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { AdminNotification } from "@prisma/client";

export const dynamic = "force-dynamic";

function mapNotif(n: AdminNotification | null) {
  if (!n) return null;
  return {
    _id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    metadata: n.metadata,
    timestamp: n.timestamp,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt
  };
}

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const pgNotifications = await prisma.adminNotification.findMany({
      orderBy: { timestamp: "desc" },
      take: 30
    });

    return NextResponse.json({
      success: true,
      data: pgNotifications.map(mapNotif),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load notifications";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { notificationId, all } = body;

    if (all) {
      // Update in PostgreSQL
      await prisma.adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true }
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "notificationId is required" }, { status: 400 });
    }

    const notif = await prisma.adminNotification.findUnique({
      where: { id: notificationId }
    });

    if (!notif) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
    }

    // Update in PostgreSQL
    const updatedNotif = await prisma.adminNotification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      data: mapNotif(updatedNotif),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update notification";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
