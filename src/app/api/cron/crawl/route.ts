import { NextRequest, NextResponse, after } from "next/server";
import { crawlPortalJobs } from "@/lib/portal-fetcher/crawler";
import { persistPortalJobs } from "@/lib/portal-jobs-persist";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const CRAWL_INTERVAL_MINUTES = Number(process.env.CRAWL_INTERVAL_MINUTES || "60");
const COOLDOWN_MS = CRAWL_INTERVAL_MINUTES * 60 * 1000;

function isTimingSafeMatch(input: string | null | undefined, expected: string | undefined): boolean {
  if (!expected) return true;
  if (!input) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Hourly Asynchronous Background Job Crawler Cron
 * Scalable Database-First Architecture:
 * Crawls all supported portals (LinkedIn, Wellfound, Indeed, Internshala, Foundit, Naukri, Company Careers)
 * in the background independently, normalizes & deduplicates, and stores in PostgreSQL.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedSecret = process.env.CRON_SECRET;
    if (!isTimingSafeMatch(secret, expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    // Cooldown check (configurable via CRAWL_INTERVAL_MINUTES)
    if (!force) {
      let settings = await prisma.settings.findUnique({
        where: { settingsId: "global" },
      });
      if (!settings) {
        settings = await prisma.settings.create({
          data: { settingsId: "global" },
        });
      }

      const now = Date.now();
      if (settings.lastCrawlAt && now - settings.lastCrawlAt.getTime() < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - settings.lastCrawlAt.getTime())) / 1000);
        return NextResponse.json({
          success: true,
          message: `Hourly background crawl recently executed. Next run in ${remainingSeconds}s.`,
          cooldownRemainingSeconds: remainingSeconds,
        });
      }

      await prisma.settings.update({
        where: { settingsId: "global" },
        data: { lastCrawlAt: new Date(now) },
      });
    }

    console.log(`[Cron Background Crawl] Initiating hourly multi-portal job aggregation pass...`);

    after(async () => {
      console.log(`[Cron Background Crawl] Executing parallel crawl across all portals...`);
      try {
        const crawlRes = await crawlPortalJobs({
          portal: "all",
          location: "India",
          maxPages: 5,
          triggeredBy: "SCHEDULER",
        });

        const persistRes = await persistPortalJobs(crawlRes.jobs, undefined, [], crawlRes.crawlerRunId);
        console.log(`[Cron Background Crawl Complete] Crawled ${crawlRes.jobs.length} jobs across ${crawlRes.metrics.totalPagesCrawled} pages. DB Persisted: ${persistRes.jobsInserted} new, ${persistRes.jobsUpdated} updated, ${crawlRes.metrics.duplicatesSkipped + persistRes.duplicatesSkipped} duplicates skipped, ${persistRes.expiredJobsDeactivated} expired jobs removed.`);
      } catch (err: any) {
        console.error("[Cron Background Crawl Failed]:", err.message || err);
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: "Hourly background job aggregation pipeline initiated successfully.",
        triggeredAt: new Date().toISOString(),
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("Cron crawl route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to trigger cron crawl" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
