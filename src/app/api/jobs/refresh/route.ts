import { NextRequest, NextResponse } from "next/server";
import { withAIProviderCheck } from "@/lib/middleware/ai-usage";
import { runSourceSync } from "@/lib/pipeline";
import { JobSource } from "@/lib/adapters/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Check AI usage limits and resolve AI provider for match-my-skills feature
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

    // To prevent Vercel timeout (10s on hobby), we might only take top 3 keywords.
    const keywordsToSearch = keywords.slice(0, 3);

    console.log(`[API Refresh] User ${mongoUserId} refreshing jobs with keywords:`, keywordsToSearch);

    const sources: JobSource[] = ["wellfound", "careers", "aggregator"];
    let addedJobs = 0;
    let skippedJobs = 0;
    let totalJobs = 0;
    const allNewJobs: any[] = [];

    // Run sources sequentially to avoid hammering the servers or exhausting memory
    for (const source of sources) {
      try {
        const result = await runSourceSync(source, keywordsToSearch);
        if (result.success) {
          addedJobs += result.addedJobs || 0;
          skippedJobs += result.skippedJobs || 0;
          totalJobs += (result.addedJobs || 0) + (result.skippedJobs || 0) + (result.updatedJobs || 0);
          if (result.newJobs) {
            allNewJobs.push(...result.newJobs);
          }
        }
      } catch (err: any) {
        console.error(`[API Refresh] Source ${source} failed:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      addedJobs,
      skippedJobs,
      totalJobs,
      newJobs: allNewJobs
    });
  } catch (error: any) {
    console.error("[API Refresh] Fatal Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to refresh jobs" }, { status: 500 });
  }
}
