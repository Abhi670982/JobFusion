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

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const andConditions: any[] = [{ role: "admin" }];
    if (query) {
      andConditions.push({
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ]
      });
    }

    const pgAdmins = await prisma.user.findMany({
      where: { AND: andConditions },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: pgAdmins.map(mapUser) });
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

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Verify user exists in PostgreSQL
    const targetUser = await prisma.user.findFirst({
      where: { email: { equals: emailNormalized, mode: "insensitive" } }
    });

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

    // Promotion logic in Postgres
    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: "admin" }
    });

    // Add email to Settings allowedAdminEmails list in Postgres
    let globalSettings = await prisma.settings.findUnique({
      where: { settingsId: "global" }
    });

    if (!globalSettings) {
      globalSettings = await prisma.settings.create({
        data: { settingsId: "global", allowedAdminEmails: [] }
      });
    }

    const currentEmails = (globalSettings.allowedAdminEmails as string[]) || [];
    if (!currentEmails.map(e => e.toLowerCase()).includes(emailNormalized)) {
      currentEmails.push(emailNormalized);
      await prisma.settings.update({
        where: { settingsId: "global" },
        data: { allowedAdminEmails: currentEmails }
      });
    }

    // Log the action in Activity Logs
    await logAdminAction({
      req,
      admin: {
        _id: admin.id,
        fullName: admin.fullName,
        email: admin.email
      },
      action: "Added Admin",
      resource: "Admin",
      resourceId: targetUser.id,
      details: `Promoted user ${targetUser.fullName} (${targetUser.email}) to admin role`,
    });

    // Generate an Admin Notification in Postgres
    const notif = await prisma.adminNotification.create({
      data: {
        type: "system_warning",
        title: "New Admin Added",
        message: `${targetUser.fullName} (${targetUser.email}) was promoted to admin by ${admin.fullName}`,
        isRead: false,
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `${targetUser.fullName} promoted to admin successfully.`,
      data: mapUser(updatedUser),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to promote admin" },
      { status: 500 }
    );
  }
}
