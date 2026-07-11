import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import Report from "@/models/Report";
import Activity from "@/models/Activity";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const resolvedParams = await params;
    const reportId = resolvedParams.id;
    const body = await req.json();
    const { status } = body; // resolved, pending

    if (!status || !["pending", "resolved"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    report.status = status;
    await report.save();

    // Log admin action
    await Activity.create({
      userId: admin._id,
      type: "admin_action",
      details: `Marked report '${report.title}' (${report.type}) as ${status}`,
    });

    return NextResponse.json({
      success: true,
      message: `Report status updated to ${status}`,
      data: report,
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

    await connectDB();
    const resolvedParams = await params;
    const reportId = resolvedParams.id;

    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    await Report.findByIdAndDelete(reportId);

    // Log admin action
    await Activity.create({
      userId: admin._id,
      type: "admin_action",
      details: `Deleted report ticket: '${report.title}' (${report.type})`,
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
