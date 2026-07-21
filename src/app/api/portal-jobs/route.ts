import { NextRequest, NextResponse } from "next/server";
import { crawlPortalJobs } from "@/lib/portal-fetcher/crawler";
import { JobPortalSource } from "@/lib/portal-fetcher/adapters/base-adapter";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Helper function to calculate the strict 168-hour rolling visibility window
function getRollingJobVisibilityWindow(now = new Date()) {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    from: sevenDaysAgo,
    to: now,
  };
}

// Process and save jobs into global Job table and user-specific UserJob table
async function processAndPersistJobs(userId: string, jobs: any[], userSkills: string[]): Promise<number> {
  let savedCount = 0;
  const lowerSkills = userSkills.map(s => s.toLowerCase().trim());
  
  for (const job of jobs) {
    const jobTitle = (job.title || "").toLowerCase();
    const jobDesc = (job.description || "").toLowerCase();
    const jobSkills = (job.skills || []).map((s: string) => s.toLowerCase().trim());
    
    // Weighted skill match count
    const matched = lowerSkills.filter(skill => 
      jobTitle.includes(skill) || 
      jobDesc.includes(skill) ||
      jobSkills.includes(skill)
    );

    // Calculate match score
    let matchScore = 80;
    if (lowerSkills.length > 0) {
      const ratio = matched.length / lowerSkills.length;
      matchScore = Math.max(80, Math.round(ratio * 100));
    }

    // Generate stable deduplication hash
    const hashInput = `${job.source}-${job.sourceId || ""}-${job.applyUrl || ""}-${job.title}-${job.company}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(hashInput).digest("hex");

    // Upsert into global Job table
    const dbJob = await prisma.job.upsert({
      where: { dedupeHash },
      update: {
        title: job.title,
        company: job.company,
        location: job.location,
        isRemote: job.isRemote,
        applyUrl: job.applyUrl,
        postedAtDate: job.postedDate ? new Date(job.postedDate) : new Date(),
        isActive: true,
        matchScore,
      },
      create: {
        title: job.title,
        company: job.company,
        location: job.location,
        isRemote: job.isRemote,
        applyUrl: job.applyUrl,
        postedAtDate: job.postedDate ? new Date(job.postedDate) : new Date(),
        source: job.source,
        sourceId: job.sourceId,
        sourceUrl: job.sourceUrl,
        dedupeHash,
        skills: job.skills,
        description: job.description,
        isActive: true,
        matchScore,
      }
    });

    // Upsert user-specific UserJob association
    await prisma.userJob.upsert({
      where: {
        userId_jobId: {
          userId,
          jobId: dbJob.id,
        }
      },
      update: {
        matchedSkills: matched,
        matchScore,
      },
      create: {
        userId,
        jobId: dbJob.id,
        matchedSkills: matched,
        matchScore,
        discoveredAt: new Date(),
      }
    });

    savedCount++;
  }
  
  return savedCount;
}

// Retrieve cached jobs from db for user within visibility boundaries
async function getUserCachedJobs(userId: string, portal: string, visibilityFrom: Date, visibilityTo: Date) {
  const userJobs = await prisma.userJob.findMany({
    where: {
      userId,
      job: {
        postedAtDate: {
          gte: visibilityFrom,
          lte: visibilityTo,
        },
        isActive: true,
        ...(portal !== "all" ? { source: portal } : {}),
      }
    },
    include: {
      job: true
    },
    orderBy: {
      job: {
        postedAtDate: "desc"
      }
    }
  });

  return userJobs.map(uj => {
    const postedDateStr = uj.job.postedAtDate ? uj.job.postedAtDate.toISOString() : "";
    return {
      sourceId: uj.job.sourceId || uj.job.id,
      source: uj.job.source || "linkedin",
      sourceUrl: uj.job.sourceUrl || uj.job.applyUrl || "",
      applyUrl: uj.job.applyUrl,
      title: uj.job.title,
      company: uj.job.company,
      logo: uj.job.companyLogo || null,
      location: uj.job.location,
      isRemote: uj.job.isRemote,
      employmentType: uj.job.type === "full_time" ? "full-time" : (uj.job.type === "part_time" ? "part-time" : (uj.job.type as any)),
      experience: uj.job.experienceLevel as any,
      salary: uj.job.salary,
      salaryMin: uj.job.salaryMin || null,
      salaryMax: uj.job.salaryMax || null,
      description: uj.job.description || "",
      postedDate: postedDateStr,
      isDateless: false,
      skills: uj.job.skills,
    };
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  let requestNow = new Date();
  if (process.env.NODE_ENV !== "production") {
    const mockNowParam = searchParams.get("mockNow");
    if (mockNowParam) {
      const parsedMock = new Date(mockNowParam);
      if (!isNaN(parsedMock.getTime())) {
        requestNow = parsedMock;
      }
    }
  }

  const { from: visibilityFrom, to: visibilityTo } = getRollingJobVisibilityWindow(requestNow);

  const portal = (searchParams.get("portal") || "all").toLowerCase();
  const keyword = searchParams.get("keyword")?.trim() || "";
  const location = searchParams.get("location")?.trim() || "India";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  // Validate keyword
  const validatedKeyword = keyword.trim().replace(/\s+/g, " ");
  if (validatedKeyword.length > 200) {
    return NextResponse.json(
      { success: false, error: "Keyword exceeds maximum length of 200 characters" },
      { status: 400 }
    );
  }
  if (/[\x00-\x1F\x7F-\x9F]/.test(validatedKeyword)) {
    return NextResponse.json(
      { success: false, error: "Keyword contains invalid control characters" },
      { status: 400 }
    );
  }

  // Validate location
  const validatedLocation = location.trim().replace(/\s+/g, " ");
  if (validatedLocation.length > 100) {
    return NextResponse.json(
      { success: false, error: "Location exceeds maximum length of 100 characters" },
      { status: 400 }
    );
  }
  if (/[\x00-\x1F\x7F-\x9F]/.test(validatedLocation)) {
    return NextResponse.json(
      { success: false, error: "Location contains invalid control characters" },
      { status: 400 }
    );
  }

  // Validate portal parameter
  const validPortals: (JobPortalSource | "all")[] = [
    "linkedin",
    "indeed",
    "internshala",
    "wellfound",
    "all",
  ];
  if (!validPortals.includes(portal as JobPortalSource | "all")) {
    return NextResponse.json(
      { success: false, error: `Invalid portal parameter. Must be one of: ${validPortals.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    // 1. Authenticate user
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    // 2. Load user extracted skills
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { skills: true },
    });
    const userSkills = profile?.skills.map(s => s.name.toLowerCase().trim()) || [];

    // 3. Load or create UserCrawlState
    let crawlState = await prisma.userCrawlState.findUnique({
      where: { userId }
    });
    if (!crawlState) {
      crawlState = await prisma.userCrawlState.create({
        data: {
          userId,
          crawlStatus: "idle",
        }
      });
    }

    // 4. Resume/Profile Change Detection
    const sortedSkillsJoined = [...userSkills].sort().join(",");
    const currentSkillsHash = crypto.createHash("sha256").update(sortedSkillsJoined).digest("hex");

    if (crawlState.skillsHash !== currentSkillsHash) {
      console.log(`[Portal Jobs API] Skills profile changed for user ${userId}. Invalidating crawl cache.`);
      crawlState = await prisma.userCrawlState.update({
        where: { userId },
        data: {
          skillsHash: currentSkillsHash,
          lastSuccessfulCrawlAt: null,
        }
      });
    }

    // 5. Lock Check
    const lockTimeout = 10 * 60 * 1000; // 10 minutes

    if (crawlState.crawlStatus === "running" && crawlState.crawlStartedAt) {
      const elapsed = requestNow.getTime() - crawlState.crawlStartedAt.getTime();
      if (elapsed < lockTimeout) {
        console.log(`[Portal Jobs API] Crawl lock active for user ${userId} (elapsed: ${elapsed}ms). Returning cached jobs.`);
        const cachedJobs = await getUserCachedJobs(userId, portal, visibilityFrom, visibilityTo);
        return NextResponse.json({
          success: true,
          portal,
          keyword: validatedKeyword,
          location: validatedLocation,
          page,
          data: cachedJobs,
          jobs: cachedJobs,
          cached: true,
          partial: true,
          message: "Crawl lock active. Returning cached jobs.",
        });
      } else {
        console.log(`[Portal Jobs API] Stale crawl lock for user ${userId} (${elapsed}ms). Overriding lock.`);
      }
    }

    // 6. Crawl Type Check
    let isFirstSearchToday = false;
    if (!crawlState.lastSuccessfulCrawlAt) {
      isFirstSearchToday = true;
    } else {
      const lastCrawlDate = new Date(crawlState.lastSuccessfulCrawlAt);
      isFirstSearchToday =
        lastCrawlDate.getUTCDate() !== requestNow.getUTCDate() ||
        lastCrawlDate.getUTCMonth() !== requestNow.getUTCMonth() ||
        lastCrawlDate.getUTCFullYear() !== requestNow.getUTCFullYear();
    }

    // 7. Acquire lock
    await prisma.userCrawlState.update({
      where: { userId },
      data: {
        crawlStatus: "running",
        crawlStartedAt: requestNow,
      }
    });

    let crawlSuccess = false;
    let crawlError: string | null = null;

    // 8. Execute progressive or incremental crawl
    try {
      if (isFirstSearchToday) {
        console.log(`[Portal Jobs API] Starting progressive crawl for user ${userId} (MIN_RELEVANT_JOB_TARGET: env value or fallback to 20).`);
        const MIN_RELEVANT_JOB_TARGET = process.env.MIN_RELEVANT_JOB_TARGET 
          ? parseInt(process.env.MIN_RELEVANT_JOB_TARGET, 10) 
          : 20;

        let totalSaved = 0;

        for (let day = 0; day < 7; day++) {
          const crawlFrom = new Date(requestNow.getTime() - (day + 1) * 24 * 60 * 60 * 1000);
          const crawlTo = new Date(requestNow.getTime() - day * 24 * 60 * 60 * 1000);

          console.log(`[Portal Jobs API] Crawling window - Day ${day + 1}: ${crawlFrom.toISOString()} to ${crawlTo.toISOString()}`);

          const result = await crawlPortalJobs({
            portal: portal as JobPortalSource | "all",
            keyword: validatedKeyword,
            skills: userSkills,
            location: validatedLocation,
            page: 1,
            crawlFrom,
            crawlTo,
          });

          // Persist the jobs from this window
          const savedInWindow = await processAndPersistJobs(userId, result.jobs, userSkills);
          totalSaved += savedInWindow;

          console.log(`[Portal Jobs API] Day ${day + 1} processing done. Saved: ${savedInWindow}. Total progressive saved: ${totalSaved}/${MIN_RELEVANT_JOB_TARGET}`);

          // Stop progressive crawl if target is satisfied after processing this window
          if (totalSaved >= MIN_RELEVANT_JOB_TARGET) {
            console.log(`[Portal Jobs API] Reached target of ${MIN_RELEVANT_JOB_TARGET} relevant jobs. Stopping progressive crawl.`);
            break;
          }
        }
      } else {
        const oneHour = 60 * 60 * 1000;
        const crawlFrom = new Date(crawlState.lastSuccessfulCrawlAt!.getTime() - oneHour);
        const crawlTo = requestNow;

        console.log(`[Portal Jobs API] Incremental crawl for user ${userId} since: ${crawlFrom.toISOString()}`);

        const result = await crawlPortalJobs({
          portal: portal as JobPortalSource | "all",
          keyword: validatedKeyword,
          skills: userSkills,
          location: validatedLocation,
          page: 1,
          crawlFrom,
          crawlTo,
        });

        const savedCount = await processAndPersistJobs(userId, result.jobs, userSkills);
        console.log(`[Portal Jobs API] Incremental crawl completed. Saved: ${savedCount} new jobs.`);
      }

      crawlSuccess = true;
    } catch (err: any) {
      crawlError = err.message || "Unknown crawler error";
      console.error("[Portal Jobs API] Crawler execution failed:", crawlError);
    } finally {
      // 9. Release lock & Save crawl state
      await prisma.userCrawlState.update({
        where: { userId },
        data: {
          crawlStatus: "idle",
          ...(crawlSuccess ? { lastSuccessfulCrawlAt: new Date() } : {}),
        }
      });
    }

    // 10. Query & Return user's jobs sorted newest -> oldest within the calculated request's visibility window
    const jobs = await getUserCachedJobs(userId, portal, visibilityFrom, visibilityTo);

    if (crawlError) {
      // Fallback response on crawler failure: return successful 200 response with cached jobs and flags
      return NextResponse.json({
        success: true,
        portal,
        keyword: validatedKeyword,
        location: validatedLocation,
        page,
        data: jobs,
        jobs: jobs,
        cached: true,
        refreshFailed: true,
        message: `Failed to refresh jobs: ${crawlError}. Displaying cached results.`,
      });
    }

    return NextResponse.json({
      success: true,
      portal,
      keyword: validatedKeyword,
      location: validatedLocation,
      page,
      data: jobs,
      jobs: jobs,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed executing optimized crawl";
    console.error("[Portal Jobs API] Optimized Handler failed:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
