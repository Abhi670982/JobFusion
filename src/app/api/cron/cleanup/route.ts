import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Secret-based auth (optional in local/dev when CRON_SECRET is unset)
    const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
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
