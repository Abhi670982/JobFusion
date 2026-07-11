import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import AdminNotification from "@/models/AdminNotification";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const notifications = await AdminNotification.find({})
      .sort({ timestamp: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load notifications" },
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

    await connectDB();
    const body = await req.json();
    const { notificationId, all } = body;

    if (all) {
      await AdminNotification.updateMany({ isRead: false }, { isRead: true });
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "notificationId is required" }, { status: 400 });
    }

    const notif = await AdminNotification.findById(notificationId);
    if (!notif) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
    }

    notif.isRead = true;
    await notif.save();

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      data: notif,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}
