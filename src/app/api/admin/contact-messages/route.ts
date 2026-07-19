import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function mapMessage(m: any) {
  if (!m) return null;
  return {
    _id: m.id,
    name: m.name,
    email: m.email,
    subject: m.subject,
    message: m.message,
    status: m.status,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt
  };
}

// GET - List contact messages with search, filter, sort, and pagination
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "desc"; // desc = newest first

    const skip = (page - 1) * limit;
    const andConditions: any[] = [];

    if (status) {
      andConditions.push({ status: status as any });
    }

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { subject: { contains: search, mode: "insensitive" } },
          { message: { contains: search, mode: "insensitive" } },
        ]
      });
    }

    const queryConditions = andConditions.length > 0 ? { AND: andConditions } : {};

    const [pgMessages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where: queryConditions,
        orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
        skip,
        take: limit
      }),
      prisma.contactMessage.count({
        where: queryConditions,
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        messages: pgMessages.map(mapMessage),
        total,
        page,
        pages,
      },
    });
  } catch (error: any) {
    console.error("[Admin Contact Messages API GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve contact messages" },
      { status: 500 }
    );
  }
}

// PATCH - Update message status
export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing message ID or status" }, { status: 400 });
    }

    if (!["unread", "read", "replied"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 });
    }

    // Verify contact message exists in Postgres
    const msgExists = await prisma.contactMessage.findUnique({
      where: { id }
    });

    if (!msgExists) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    // Update in Postgres
    const updatedMsg = await prisma.contactMessage.update({
      where: { id },
      data: { status: status as any }
    });

    // Log admin action using structured audit logger
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin: {
        _id: admin.id,
        fullName: admin.fullName,
        email: admin.email
      },
      action: "Updated Contact Message Status",
      resource: "ContactMessage",
      resourceId: id,
      details: `Updated message status from ${updatedMsg.name} (${updatedMsg.email}) to '${status}'`,
    });

    return NextResponse.json({
      success: true,
      data: mapMessage(updatedMsg),
    });
  } catch (error: any) {
    console.error("[Admin Contact Messages API PATCH] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update contact message status" },
      { status: 500 }
    );
  }
}

// DELETE - Remove contact message
export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing message ID" }, { status: 400 });
    }

    const msgExists = await prisma.contactMessage.findUnique({
      where: { id }
    });

    if (!msgExists) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    // Delete in Postgres
    await prisma.contactMessage.delete({
      where: { id }
    });

    // Log admin action using structured audit logger
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin: {
        _id: admin.id,
        fullName: admin.fullName,
        email: admin.email
      },
      action: "Deleted Contact Message",
      resource: "ContactMessage",
      resourceId: id,
      details: `Deleted contact inquiry from ${msgExists.name} (${msgExists.email})`,
    });

    return NextResponse.json({
      success: true,
      message: "Contact message deleted successfully",
    });
  } catch (error: any) {
    console.error("[Admin Contact Messages API DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete contact message" },
      { status: 500 }
    );
  }
}
