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

/**
 * Scheduled Database Cleanup Job
 * - Soft-expires jobs older than 3 days (isActive = false, hidden from active searches)
 * - Hard-deletes unreferenced jobs older than 30 days
 */
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedSecret = process.env.CRON_SECRET;
    if (!isTimingSafeMatch(secret, expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    console.log(`[Cleanup Cron] Executing lifecycle cleanup. Soft-expire cutoff: 3 days (${threeDaysAgo.toISOString()}), Hard-delete cutoff: 30 days (${thirtyDaysAgo.toISOString()})`);

    // Step 1: Soft-expire jobs older than 3 days (isActive = false)
    const softExpired = await prisma.job.updateMany({
      where: {
        postedAtDate: { lt: threeDaysAgo },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Step 2: Delete UserJob associations for jobs older than 30 days
    const deletedUserJobs = await prisma.userJob.deleteMany({
      where: {
        job: {
          postedAtDate: { lt: thirtyDaysAgo },
        },
      },
    });

    // Step 3: Hard-delete unreferenced global Job records older than 30 days
    const deletedJobs = await prisma.job.deleteMany({
      where: {
        postedAtDate: { lt: thirtyDaysAgo },
        userJobs: { none: {} },
        savedJobs: { none: {} },
        applications: { none: {} },
      },
    });

    console.log(`[Cleanup Cron] Complete. Soft-expired ${softExpired.count} jobs (3-day rule). Hard-deleted ${deletedJobs.count} jobs and ${deletedUserJobs.count} user associations (30-day rule).`);

    return NextResponse.json({
      success: true,
      softExpired3DaysCount: softExpired.count,
      hardDeleted30DaysUserJobsCount: deletedUserJobs.count,
      hardDeleted30DaysJobsCount: deletedJobs.count,
      executedAt: new Date().toISOString(),
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
