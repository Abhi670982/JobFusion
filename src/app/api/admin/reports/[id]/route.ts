import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { Report, ReportStatus } from "@prisma/client";
import { safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

function mapReport(r: Report | null) {
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
    const { status } = body;

    if (!status || !["pending", "resolved"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const reportExists = await prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!reportExists) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: { status: status as ReportStatus }
    });

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
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to update report");
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

    await prisma.report.delete({
      where: { id: reportId }
    });

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
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to delete report");
  }
}
