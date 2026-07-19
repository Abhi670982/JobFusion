import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

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

    const resolvedParams = await params;
    const jobId = resolvedParams.id;

    // Fetch job details from Postgres
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    // Delete in PostgreSQL
    await prisma.job.delete({
      where: { id: jobId }
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
      action: "Deleted Manual Job",
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
