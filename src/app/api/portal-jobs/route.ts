import { NextRequest, NextResponse } from "next/server";
import { crawlPortalJobs } from "@/lib/portal-fetcher/crawler";
import { JobPortalSource } from "@/lib/portal-fetcher/adapters/base-adapter";

export const dynamic = "force-dynamic";

// [H-1] The in-memory Map cache was removed.
// On serverless environments (Vercel), every cold start creates a fresh
// process — the Map is empty every time, so the cache never actually worked.
// Client-side sessionStorage in job-portals-section.tsx is the caching layer.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const portal = (searchParams.get("portal") || "all").toLowerCase();
    const keyword = searchParams.get("keyword")?.trim() || "";
    const location = searchParams.get("location")?.trim() || "India";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    // Parse skills from query
    const skillsParam = searchParams.get("skills") || "";
    const skills = skillsParam
      ? skillsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    // Validate portal parameter
    const validPortals: (JobPortalSource | "all")[] = [
      "linkedin",
      "indeed",
      "internshala",
      "wellfound",
      "all",
    ];
    if (!validPortals.includes(portal as any)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid portal parameter. Must be one of: ${validPortals.join(", ")}`,
        },
        { status: 400 }
      );
    }

    console.log(
      `[Portal Jobs API] Crawling live: portal=${portal} keyword=${keyword} location=${location}`
    );

    // Execute Crawler — pure pass-through, no server-side caching
    const result = await crawlPortalJobs({
      portal: portal as JobPortalSource | "all",
      keyword,
      skills,
      location,
      page,
    });

    return NextResponse.json({
      success: true,
      portal,
      keyword,
      location,
      page,
      data: result.jobs,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error("[Portal Jobs API] Handler failed:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed executing real-time crawl",
      },
      { status: 500 }
    );
  }
}
