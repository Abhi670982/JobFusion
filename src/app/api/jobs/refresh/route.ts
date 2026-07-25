import { NextRequest, NextResponse } from "next/server";
import { JobSourceCategory } from "@prisma/client";
import { withAIProviderCheck } from "@/lib/middleware/ai-usage";
import { enqueueCrawlJob } from "@/lib/queue";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate & check AI usage limits
    const aiCheck = await withAIProviderCheck(req, 'match-my-skills');
    if (!aiCheck.allowed) {
      return aiCheck.response;
    }
    
    const mongoUserId = aiCheck.userId;

    let keywords: string[] = [];
    try {
      const body = await req.json();
      if (Array.isArray(body.keywords)) {
        keywords = body.keywords.map((k: any) => String(k).trim()).filter(Boolean);
      }
    } catch {
      // Ignore if body is empty or not JSON
    }

    const keywordsToSearch = keywords.slice(0, 3);
    const primaryKeyword = keywordsToSearch[0] || "software engineer";

    console.log(`[API Refresh] User ${mongoUserId} requesting asynchronous BullMQ refresh for keyword: "${primaryKeyword}"`);

    // 2. Enqueue separate category jobs into BullMQ background-crawl-queue
    // A. Official Company Careers Job
    const careersRes = await enqueueCrawlJob({
      category: JobSourceCategory.COMPANY_CAREER,
      provider: "CAREERS",
      keyword: primaryKeyword,
      location: "India",
      userId: mongoUserId,
    });

    // B. Job Portal - Wellfound Job
    const wellfoundRes = await enqueueCrawlJob({
      category: JobSourceCategory.JOB_PORTAL,
      provider: "WELLFOUND",
      keyword: primaryKeyword,
      location: "India",
      userId: mongoUserId,
    });

    // C. Job Portal - Aggregator Job
    const aggregatorRes = await enqueueCrawlJob({
      category: JobSourceCategory.JOB_PORTAL,
      provider: "AGGREGATOR",
      keyword: primaryKeyword,
      location: "India",
      userId: mongoUserId,
    });

    const enqueuedCount = [careersRes, wellfoundRes, aggregatorRes].filter(r => r.enqueued).length;

    // 3. Return HTTP response immediately WITHOUT waiting for background crawling/adapters
    return NextResponse.json({
      success: true,
      refreshQueued: true,
      enqueuedCount,
      message: "Job refresh enqueued successfully. Background worker is processing fresh opportunities.",
      jobs: [],
      totalJobs: 0,
    });
  } catch (error: any) {
    console.error("[API Refresh] Fatal Error enqueueing refresh:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to enqueue refresh" },
      { status: 500 }
    );
  }
}
