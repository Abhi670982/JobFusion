import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import ContactMessage from "@/models/ContactMessage";

export const dynamic = "force-dynamic";

// GET - List contact messages with search, filter, sort, and pagination
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "desc"; // desc = newest first

    const skip = (page - 1) * limit;

    // Build query object
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    // Determine sort
    const sortOrder = sort === "asc" ? 1 : -1;

    const [messages, total] = await Promise.all([
      ContactMessage.find(query)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContactMessage.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        messages,
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

    await connectDB();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing message ID or status" }, { status: 400 });
    }

    if (!["unread", "read", "replied"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    // Log admin action using structured audit logger
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin,
      action: "Updated Contact Message Status",
      resource: "ContactMessage",
      resourceId: id,
      details: `Updated message status from ${message.name} (${message.email}) to '${status}'`,
    });

    return NextResponse.json({
      success: true,
      data: message,
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

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing message ID" }, { status: 400 });
    }

    const message = await ContactMessage.findByIdAndDelete(id);

    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    // Log admin action using structured audit logger
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin,
      action: "Deleted Contact Message",
      resource: "ContactMessage",
      resourceId: id,
      details: `Deleted contact inquiry from ${message.name} (${message.email})`,
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
