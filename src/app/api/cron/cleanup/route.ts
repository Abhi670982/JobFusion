import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

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
    const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedSecret = process.env.CRON_SECRET;
    if (!isTimingSafeMatch(secret, expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    console.log(`[Cleanup Cron] Starting database cleanup. Cutoff date: ${sevenDaysAgo.toISOString()}`);

    // Step 1: Delete UserJob associations pointing to jobs older than 7 days
    const deletedUserJobs = await prisma.userJob.deleteMany({
      where: {
        job: {
          postedAtDate: { lt: sevenDaysAgo }
        }
      }
    });

    // Step 2: Delete global Job documents where postedAtDate is older than 7 days AND is no longer referenced anywhere else
    const deletedJobs = await prisma.job.deleteMany({
      where: {
        postedAtDate: { lt: sevenDaysAgo },
        userJobs: { none: {} },
        savedJobs: { none: {} },
        applications: { none: {} }
      }
    });

    console.log(`[Cleanup Cron] Cleanup complete. Deleted ${deletedUserJobs.count} UserJob associations and ${deletedJobs.count} global Job documents.`);

    return NextResponse.json({
      success: true,
      deletedUserJobsCount: deletedUserJobs.count,
      deletedJobsCount: deletedJobs.count
    });
  } catch (error: any) {
    console.error("[Cleanup Cron] Cron handler failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute cleanup" },
      { status: 500 }
    );
  }
}

// GET support for easy testing/webhooks
export async function GET(req: NextRequest) {
  return POST(req);
}
