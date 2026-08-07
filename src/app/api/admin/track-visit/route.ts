import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path, userId } = body;

    if (!path) {
      return NextResponse.json({ success: false, error: "Path required" }, { status: 400 });
    }

    if (
      path.startsWith("/api/") ||
      path.startsWith("/_next/") ||
      path.startsWith("/admin/") ||
      path.includes("favicon")
    ) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const userAgent = req.headers.get("user-agent") || null;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    try {
      await prisma.pageView.create({
        data: {
          path,
          userId: userId || null,
          userAgent,
          ip,
        }
      });
    } catch (pgErr) {
      console.error("[Track Visit Postgres Error]", pgErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to track page visit");
  }
}
