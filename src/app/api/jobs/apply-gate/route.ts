import { NextRequest, NextResponse } from "next/server";
import { canApplyToJobPortal } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/jobs/apply-gate
 * Enforces strict subscription-based access gating for Premium job portals.
 */
export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const userId = user.id;

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
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to validate portal access");
  }
}
