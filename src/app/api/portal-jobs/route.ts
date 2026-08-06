import { NextRequest, NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";
import { normalizeSearchInput } from "@/lib/portal-fetcher/sanitizers/sanitizer";
import { searchPortalJobs } from "@/lib/portal-fetcher/services/portal-search-service";
import { portalRegistry } from "@/lib/portal-fetcher/registry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rawPortal = searchParams.get("portal") || "all";
  const rawKeyword = searchParams.get("keyword") || "";
  const rawLocation = searchParams.get("location") || "India";
  const rawSkillsParam = searchParams.get("skills") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("pageLimit") || searchParams.get("limit") || "10", 10)));

  // Normalize search parameters
  const normalizedPortal = rawPortal.toLowerCase();
  const normalizedKeyword = normalizeSearchInput(rawKeyword, 200);
  const normalizedLocation = normalizeSearchInput(rawLocation, 100) || "India";
  const requestSkills = rawSkillsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    // Authenticate user & resolve user skills
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Extract skills from user profile if available
    let dbProfileSkills: string[] = [];
    if (user.id) {
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        include: { skills: true },
      });
      if (profile?.skills) {
        dbProfileSkills = profile.skills.map((s) => s.name);
      }
    }

    const userSkills = Array.from(new Set([...requestSkills, ...dbProfileSkills]));

    // Service Layer Query: Read from dedicated portal_jobs database table with dynamic match scoring
    const searchResult = await searchPortalJobs({
      keyword: normalizedKeyword,
      location: normalizedLocation,
      portal: normalizedPortal,
      page,
      limit,
      userSkills,
    });

    return NextResponse.json({
      ...searchResult,
      data: searchResult.jobs, // Backward compatible alias
      healthStatus: portalRegistry.getHealthSummary(),
    });
  } catch (error: unknown) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    console.error("[Portal Jobs API] Full Exception Details:", {
      message: errObj.message,
      name: errObj.name,
      stack: errObj.stack,
      cause: (errObj as any).cause,
    });
    return NextResponse.json(
      { success: false, error: errObj.message, stack: errObj.stack, version: "v1" },
      { status: 500 }
    );
  }
}
