import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import User from "@/models/User";
import Settings from "@/models/Settings";
import AdminNotification from "@/models/AdminNotification";
import { logAdminAction } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const filter: any = { role: "admin" };
    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    const admins = await User.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: admins });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load admins" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Verify user exists in MongoDB
    const targetUser = await User.findOne({ email: new RegExp(`^${emailNormalized}$`, "i") });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User account does not exist in JobFusion." }, { status: 404 });
    }

    // Verify user is not suspended
    if (targetUser.status === "suspended") {
      return NextResponse.json({ success: false, error: "User account is suspended and cannot be promoted." }, { status: 400 });
    }

    // Verify user is not already an admin
    if (targetUser.role === "admin") {
      return NextResponse.json({ success: false, error: "User is already an admin." }, { status: 400 });
    }

    // Promotion logic
    targetUser.role = "admin";
    await targetUser.save();

    // Add email to Settings allowedAdminEmails list
    let globalSettings = await Settings.findOne({ settingsId: "global" });
    if (!globalSettings) {
      globalSettings = new Settings({ settingsId: "global" });
    }
    const currentEmails: string[] = globalSettings.allowedAdminEmails || [];
    if (!currentEmails.map(e => e.toLowerCase()).includes(emailNormalized)) {
      currentEmails.push(emailNormalized);
      globalSettings.allowedAdminEmails = currentEmails;
      await globalSettings.save();
    }

    // Log the action in Activity Logs
    await logAdminAction({
      req,
      admin,
      action: "Added Admin",
      resource: "Admin",
      resourceId: targetUser._id.toString(),
      details: `Promoted user ${targetUser.fullName} (${targetUser.email}) to admin role`,
    });

    // Generate an Admin Notification
    await AdminNotification.create({
      type: "admin_added",
      title: "New Admin Added",
      message: `${targetUser.fullName} (${targetUser.email}) was promoted to admin by ${admin.fullName}`,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      message: `${targetUser.fullName} promoted to admin successfully.`,
      data: targetUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to promote admin" },
      { status: 500 }
    );
  }
}
