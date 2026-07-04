import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PageView from "@/models/PageView";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const { path, userId } = body;

    if (!path) {
      return NextResponse.json({ success: false, error: "Path required" }, { status: 400 });
    }

    // Ignore API routes, static files, and admin pages
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

    await PageView.create({ path, userId: userId || null, userAgent, ip });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Fail silently — don't break the user experience for tracking errors
    return NextResponse.json({ success: false, error: error.message });
  }
}
