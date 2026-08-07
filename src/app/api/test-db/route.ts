import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";
import { safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await prisma.$queryRaw`SELECT 1 as connection_test`;
    return NextResponse.json({
      success: true,
      message: "Database connection verified",
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to verify database connection");
  }
}