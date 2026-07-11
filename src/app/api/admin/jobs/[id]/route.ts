import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import Job from "@/models/Job";
import Activity from "@/models/Activity";

export const dynamic = "force-dynamic";

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
    const jobId = resolvedParams.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    await Job.findByIdAndDelete(jobId);

    // Log admin action using structured audit logger
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin,
      action: "Deleted Manual Job", // or "Deleted Job" if imported
      resource: "Job",
      resourceId: jobId,
      details: `Deleted job posting: '${job.title}' by ${job.company}`,
    });

    return NextResponse.json({
      success: true,
      message: "Job posting deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete job" },
      { status: 500 }
    );
  }
}
