import { NextRequest, NextResponse, after } from "next/server";
import { runSourceSync } from "@/lib/pipeline";
import { JobSource } from "@/lib/adapters/types";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours

function isTimingSafeMatch(input: string | null | undefined, expected: string | undefined): boolean {
  if (!expected) return true;
  if (!input) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedSecret = process.env.CRON_SECRET;
    if (!isTimingSafeMatch(secret, expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const querySource = searchParams.get("source");

    let bodySource = "";
    let customKeywords: string[] = [];
    try {
      const body = await req.clone().json();
      if (body) {
        if (body.source) {
          bodySource = String(body.source).trim().toLowerCase();
        }
        if (Array.isArray(body.keywords)) {
          customKeywords = body.keywords
            .map((k: any) => String(k).trim())
            .filter(Boolean);
        }
      }
    } catch {
      // Ignore if body is empty or not JSON
    }

    const targetSource = querySource || bodySource;
    const isCustom = customKeywords.length > 0;

    // DB-persisted cooldown (survives serverless cold starts)
    if (!isCustom && !targetSource) {
      let settings = await prisma.settings.findUnique({
        where: { settingsId: "global" },
      });
      if (!settings) {
        settings = await prisma.settings.create({
          data: { settingsId: "global" },
        });
      }

      const now = Date.now();
      if (
        settings.lastCrawlAt &&
        now - settings.lastCrawlAt.getTime() < COOLDOWN_MS
      ) {
        const remainingSeconds = Math.ceil(
          (COOLDOWN_MS - (now - settings.lastCrawlAt.getTime())) / 1000
        );
        console.log(
          `[Cron API] Cooldown active. Remaining: ${remainingSeconds}s`
        );
        return NextResponse.json(
          {
            success: true,
            message:
              "Job crawler recently executed. Skipped to prevent server overload.",
            cooldownRemainingSeconds: remainingSeconds,
          },
          { status: 200 }
        );
      }

      await prisma.settings.update({
        where: { settingsId: "global" },
        data: { lastCrawlAt: new Date(now) },
      });
    }

    console.log(`[Cron API] Triggering background job sync...`);

    let sources: JobSource[] = ["wellfound", "careers", "aggregator"];
    if (targetSource && sources.includes(targetSource as JobSource)) {
      sources = [targetSource as JobSource];
    }

    // Empty keywords → pipeline pulls skills from DB (Rule 2)
    const keywords = isCustom ? customKeywords : [];

    after(async () => {
      console.log(
        "[Cron API Background] Starting sync cycle for sources:",
        sources,
        "keywords:",
        keywords.length ? keywords : "(from DB skills)"
      );
      for (const source of sources) {
        try {
          console.log(`[Cron API Background] Syncing ${source}...`);
          // Pass empty array or custom keywords
          await runSourceSync(source, keywords);
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
        message: isCustom
          ? "Job crawler successfully initiated for custom keywords in the background."
          : "Job crawler successfully initiated in the background.",
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
