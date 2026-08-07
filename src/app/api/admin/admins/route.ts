import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { safeErrorResponse } from "@/lib/security";

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
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const andConditions: Prisma.UserWhereInput[] = [{ role: "admin" }];

    if (search) {
      andConditions.push({
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } }
        ]
      });
    }

    const pgAdmins = await prisma.user.findMany({
      where: { AND: andConditions },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: pgAdmins.map(mapUser) });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to load admins");
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const targetUser = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } }
    });

    if (!targetUser) {
      return NextResponse.json({
        success: false,
        error: "User with this email was not found. The user must register for an account on JobFusion first before they can be promoted to admin."
      }, { status: 440 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json({ success: false, error: "This user is already an administrator." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: "admin" }
    });

    const globalSettings = await prisma.settings.findUnique({ where: { settingsId: "global" } });
    if (globalSettings) {
      const currentList = (globalSettings.allowedAdminEmails as string[]) || [];
      if (!currentList.map(e => e.toLowerCase()).includes(cleanEmail)) {
        await prisma.settings.update({
          where: { settingsId: "global" },
          data: { allowedAdminEmails: [...currentList, cleanEmail] }
        });
      }
    }

    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin: {
        _id: adminUser.id,
        fullName: adminUser.fullName,
        email: adminUser.email
      },
      action: "Promoted Admin",
      resource: "User",
      resourceId: updatedUser.id,
      details: `Promoted user: ${updatedUser.fullName} (${updatedUser.email}) to Administrator`,
    });

    await prisma.adminNotification.create({
      data: {
        type: "system_warning",
        title: "New Admin Promoted",
        message: `${adminUser.fullName} promoted ${updatedUser.fullName} (${updatedUser.email}) to Administrator.`,
        isRead: false,
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `${targetUser.fullName} promoted to admin successfully.`,
      data: mapUser(updatedUser),
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to promote admin");
  }
}
