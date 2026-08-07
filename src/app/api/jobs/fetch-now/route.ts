import { NextRequest, NextResponse } from "next/server";
import { enqueueCrawlJob } from "@/lib/queue";
import { classifySourceCategory } from "@/lib/source-category";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source } = body;

    const validSources = ["wellfound", "careers", "aggregator"];
    if (!source || !validSources.includes(source)) {
      return NextResponse.json(
        { success: false, error: `Invalid source. Must be one of: ${validSources.join(", ")}` },
        { status: 400 }
      );
    }

    const classified = classifySourceCategory(source);
    const keywords = (process.env.FETCH_KEYWORDS || "software engineer,frontend developer,backend developer").split(",");
    const primaryKeyword = keywords[0] || "software engineer";

    console.log(`[FetchNow API] Enqueueing BullMQ background fetch for source: ${source} (${classified.category})`);
    
    // Trigger non-blocking BullMQ background enqueue
    const result = await enqueueCrawlJob({
      category: classified.category,
      provider: classified.provider,
      keyword: primaryKeyword,
      location: "India"
    });

    return NextResponse.json({
      success: true,
      refreshQueued: result.enqueued,
      jobId: result.jobId,
      message: `Successfully enqueued background synchronization from ${source}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
