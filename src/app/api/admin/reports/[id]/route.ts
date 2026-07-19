import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function mapReport(r: any) {
  if (!r) return null;
  return {
    _id: r.id,
    userId: r.userId,
    type: r.type,
    title: r.title,
    description: r.description,
    jobId: r.jobId,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt
  };
}

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
    const reportId = resolvedParams.id;
    const body = await req.json();
    const { status } = body; // resolved, pending

    if (!status || !["pending", "resolved"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const reportExists = await prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!reportExists) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    // Update in Postgres
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: { status: status as any }
    });

    // Log admin action in Postgres
    await prisma.activity.create({
      data: {
        userId: admin.id,
        type: "admin_action",
        details: `Marked report '${updatedReport.title}' (${updatedReport.type}) as ${status}`,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Report status updated to ${status}`,
      data: mapReport(updatedReport),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update report" },
      { status: 500 }
    );
  }
}

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
    const reportId = resolvedParams.id;

    const reportExists = await prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!reportExists) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    // Delete in Postgres
    await prisma.report.delete({
      where: { id: reportId }
    });

    // Log admin action in Postgres
    await prisma.activity.create({
      data: {
        userId: admin.id,
        type: "admin_action",
        details: `Deleted report ticket: '${reportExists.title}' (${reportExists.type})`,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Report ticket deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete report" },
      { status: 500 }
    );
  }
}
