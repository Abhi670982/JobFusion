import { NextRequest, NextResponse, after } from "next/server";
import { runSourceSync } from "@/lib/pipeline";
import { JobSource } from "@/lib/adapters/types";
import { connectDB } from "@/lib/mongodb";
import Config from "@/models/Config";

export const dynamic = "force-dynamic";

const COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours

export async function POST(req: NextRequest) {
  try {
    // ── [C-1] Secret-based auth ─────────────────────────────────────────────
    const secret = req.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, enforce it.
    // In development (no CRON_SECRET set) requests are allowed through.
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse target source if provided
    const { searchParams } = new URL(req.url);
    const querySource = searchParams.get("source");

    let bodySource = "";
    try {
      const body = await req.clone().json();
      if (body && body.source) {
        bodySource = String(body.source).trim().toLowerCase();
      }
    } catch {
      // Ignore if body is empty or not JSON
    }

    const targetSource = querySource || bodySource;

    // ── [C-1] MongoDB-persisted cooldown ────────────────────────────────────
    // (replaces the in-memory `lastCrawlTime` which resets on every cold start)
    if (!targetSource) {
      await connectDB();
      const config = await Config.findOne({ key: "last_crawl_at" });
      const now = Date.now();

      if (config && now - Number(config.value) < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil(
          (COOLDOWN_MS - (now - Number(config.value))) / 1000
        );
        console.log(
          `[Cron API] Cooldown active. Remaining: ${remainingSeconds}s`
        );
        return NextResponse.json(
          {
            success: true,
            message: "Job crawler recently executed. Skipped to prevent server overload.",
            cooldownRemainingSeconds: remainingSeconds,
          },
          { status: 200 }
        );
      }

      // Update the persistent cooldown timestamp
      await Config.findOneAndUpdate(
        { key: "last_crawl_at" },
        { value: now },
        { upsert: true }
      );
    }

    console.log(`[Cron API] Triggering background job sync...`);

    let sources: JobSource[] = ["wellfound", "careers", "aggregator"];
    if (targetSource && sources.includes(targetSource as JobSource)) {
      sources = [targetSource as JobSource];
    }

    // Run crawler in the background — return 202 immediately
    after(async () => {
      console.log(
        "[Cron API Background] Starting sync cycle for sources:",
        sources
      );
      for (const source of sources) {
        try {
          console.log(`[Cron API Background] Syncing ${source}...`);
          // Pass empty array - keywords come ONLY from DB skills extraction (Rule 2)
          await runSourceSync(source, []);
        } catch (err: any) {
          console.error(
            `[Cron API Background] Sync failed for ${source}:`,
            err.message
          );
        }
      }
      console.log("[Cron API Background] Sync cycle complete.");
    });

    return NextResponse.json(
      {
        success: true,
        message: "Job crawler successfully initiated in the background.",
        triggeredAt: new Date().toISOString(),
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("Error triggering crawler API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to trigger crawler" },
      { status: 500 }
    );
  }
}

// GET support for easy testing via browser/curl
export async function GET(req: NextRequest) {
  return POST(req);
}
