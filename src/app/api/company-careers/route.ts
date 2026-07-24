import { NextRequest, NextResponse } from "next/server";
import { queryUserJobs, DEFAULT_RESULT_TARGET } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skillsParam = searchParams.get("skills") || "";
    const limitParam = searchParams.get("limit");

    const skills = skillsParam ? skillsParam.split(",").map(s => s.trim()).filter(Boolean) : [];
    const limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_RESULT_TARGET;

    // Strict server-side boundary: ONLY source == "careers" and active within 7 days
    const result = await queryUserJobs(skills, "careers", limit);

    return NextResponse.json({
      success: true,
      source: "careers",
      count: result.jobs.length,
      expandedBuckets: result.expandedBuckets,
      jobs: result.jobs,
    });
  } catch (error: any) {
    console.error("[Company Careers API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to query company careers" },
      { status: 500 }
    );
  }
}
