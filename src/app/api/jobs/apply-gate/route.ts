import { NextRequest, NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { canApplyToJobPortal } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/jobs/apply-gate
 * Body: { jobId?: string, source?: string, sourceCategory?: string }
 *
 * Enforces strict subscription-based access gating for Premium job portals.
 * BYOK has NO role here.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateMongoUser();
    const userId = user?.id;

    const body = await req.json().catch(() => ({}));
    const { jobId, source: bodySource, sourceCategory: bodyCat } = body;
    let source = bodySource;
    let sourceCategory = bodyCat;

    let targetJob = null;
    if (jobId) {
      targetJob = await prisma.job.findUnique({ where: { id: jobId } });
      if (targetJob) {
        source = source || targetJob.source;
        sourceCategory = sourceCategory || targetJob.sourceCategory;
      }
    }

    const gateResult = await canApplyToJobPortal(userId, source, sourceCategory);

    if (!gateResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: "PREMIUM_SUBSCRIPTION_REQUIRED",
          message: "Upgrade to Premium to access this job portal.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      allowed: true,
      applyUrl: targetJob?.applyUrl || null,
    });
  } catch (error: any) {
    console.error("Error in POST /api/jobs/apply-gate:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate portal access" },
      { status: 500 }
    );
  }
}
