import { NextRequest, NextResponse, after } from "next/server";
import { runSourceSync } from "@/lib/pipeline";
import { JobSource } from "@/lib/adapters/types";

export const dynamic = "force-dynamic";

let lastCrawlTime = 0;
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown

export async function POST(req: NextRequest) {
  try {
    const now = Date.now();
    
    // Parse custom keywords and source if provided in request body or query params
    const { searchParams } = new URL(req.url);
    const querySource = searchParams.get("source");
    
    let customKeywords: string[] = [];
    let bodySource = "";
    try {
      // Make a clone of the request to read body, in case it is read again elsewhere
      const body = await req.clone().json();
      if (body) {
        if (Array.isArray(body.keywords)) {
          customKeywords = body.keywords.map((k: any) => String(k).trim()).filter(Boolean);
        }
        if (body.source) {
          bodySource = String(body.source).trim().toLowerCase();
        }
      }
    } catch (e) {
      // Ignore if body is empty or not JSON
    }

    const isCustom = customKeywords.length > 0;
    const targetSource = querySource || bodySource;

    // Only apply rate cooldown limit to automated periodic crawls (non-custom)
    if (!isCustom && !targetSource && now - lastCrawlTime < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastCrawlTime)) / 1000);
      console.log(`[Cron API] Crawl skipped. Rate-limit active. Cooldown remaining: ${remainingSeconds}s`);
      return NextResponse.json(
        {
          success: true,
          message: "Job crawler recently executed. Skipped to prevent server overload.",
          cooldownRemainingSeconds: remainingSeconds
        },
        { status: 200 }
      );
    }

    if (!isCustom && !targetSource) {
      lastCrawlTime = now;
    }
    
    console.log(`[Cron API] Triggering background job sync...`);

    const keywords = isCustom ? customKeywords : (process.env.FETCH_KEYWORDS || "software engineer,frontend developer,backend developer").split(",");
    
    let sources: JobSource[] = ["linkedin", "indeed", "wellfound", "internshala", "careers", "aggregator"];
    if (targetSource && sources.includes(targetSource as JobSource)) {
      sources = [targetSource as JobSource];
    }

    // Run crawler in the background using after() to return 202 immediately but keep container alive
    after(async () => {
      console.log("[Cron API Background] Starting sync cycle for sources:", sources, "keywords:", keywords);
      for (const source of sources) {
        try {
          console.log(`[Cron API Background] Syncing ${source}...`);
          await runSourceSync(source, keywords);
        } catch (err: any) {
          console.error(`[Cron API Background] Sync failed for ${source}:`, err.message);
        }
      }
      console.log("[Cron API Background] Sync cycle complete.");
    });

    return NextResponse.json(
      {
        success: true,
        message: isCustom
          ? `Job crawler successfully initiated for custom keywords in the background.`
          : "Job crawler successfully initiated in the background.",
        triggeredAt: new Date().toISOString()
      },
      { status: 202 } // 202 Accepted
    );
  } catch (error: any) {
    console.error("Error triggering crawler API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to trigger crawler" },
      { status: 500 }
    );
  }
}

// Support GET requests as well for easy testing in browser or simple curl setups
export async function GET(req: NextRequest) {
  return POST(req);
}
