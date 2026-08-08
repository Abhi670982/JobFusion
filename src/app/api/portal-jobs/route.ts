import { NextRequest, NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const portal = searchParams.get("portal") || "all";
  const keyword = searchParams.get("keyword") || searchParams.get("query") || "";
  const location = searchParams.get("location") || "India";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20", 10)));

  try {
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = user._id;
    const { getPermittedJobSources } = await import("@/lib/subscription");
    const { allowedSources } = await getPermittedJobSources(userId);

    // Query active jobs from PostgreSQL directly
    const sourceFilter = allowedSources
      ? portal !== "all" && allowedSources.includes(portal)
        ? { source: portal }
        : { source: { in: allowedSources } }
      : portal !== "all"
      ? { source: portal }
      : {};

    const { getActiveJobWhereClause } = await import("@/lib/job-freshness");
    const whereClause: any = getActiveJobWhereClause(sourceFilter);

    if (keyword) {
      whereClause.OR = [
        { title: { contains: keyword, mode: "insensitive" } },
        { company: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ];
    }

    const [totalCount, dbJobs] = await Promise.all([
      prisma.job.count({ where: whereClause }),
      prisma.job.findMany({
        where: whereClause,
        orderBy: { postedAtDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const formattedJobs = dbJobs.map((j) => ({
      sourceId: j.sourceId || j.id,
      source: j.source || "linkedin",
      sourceUrl: j.sourceUrl || j.applyUrl || "",
      applyUrl: j.applyUrl,
      title: j.title,
      company: j.company,
      logo: j.companyLogo || null,
      location: j.location,
      isRemote: j.isRemote,
      employmentType: j.type === "full_time" ? "full-time" : j.type === "part_time" ? "part-time" : (j.type as any),
      experience: j.experienceLevel as any,
      salary: j.salary,
      salaryMin: j.salaryMin || null,
      salaryMax: j.salaryMax || null,
      description: j.description || "",
      postedDate: j.postedAtDate ? j.postedAtDate.toISOString() : "",
      skills: j.skills,
    }));

    return NextResponse.json({
      success: true,
      portal,
      keyword,
      location,
      page,
      limit,
      totalJobs: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      data: formattedJobs,
      jobs: formattedJobs,
    });
  } catch (error: any) {
    console.error("[Portal Jobs API Error]:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch portal jobs" },
      { status: 500 }
    );
  }
}
