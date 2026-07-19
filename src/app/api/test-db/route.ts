import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    return NextResponse.json({
      success: true,
      message: "Supabase PostgreSQL Database Connected Successfully via Prisma",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to connect to database" },
      { status: 500 }
    );
  }
}