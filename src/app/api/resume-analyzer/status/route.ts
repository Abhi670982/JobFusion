import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/resume-analyzer/status
 * Returns user's access level and existing analysis metadata.
 */
export async function GET() {
  try {
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const [subscription, profile] = await Promise.all([
      prisma.subscription.findUnique({
        where: { userId: mongoUser.id },
        include: { plan: true },
      }),
      prisma.profile.findUnique({
        where: { userId: mongoUser.id },
        select: {
          id: true,
          resumeUrl: true,
          resumeName: true,
          resumeUpdatedAt: true,
          resumeCategory: true,
          resumeAnalysis: {
            select: {
              overallScore: true,
              atsScore: true,
              createdAt: true,
              updatedAt: true,
              resumeHash: true,
            },
          },
        },
      }),
    ]);

    const isPro =
      !!subscription &&
      (subscription.plan.planId === "pro_monthly" ||
        subscription.plan.planId === "pro_yearly") &&
      (subscription.status === "active" || subscription.status === "trialing");

    const hasResume = !!profile?.resumeUrl;

    const existingAnalysis = profile?.resumeAnalysis
      ? {
          overallScore: profile.resumeAnalysis.overallScore,
          atsScore: profile.resumeAnalysis.atsScore,
          createdAt: profile.resumeAnalysis.createdAt,
          updatedAt: profile.resumeAnalysis.updatedAt,
        }
      : null;

    return NextResponse.json({
      success: true,
      data: {
        isPro,
        hasResume,
        hasAccess: isPro,
        resumeName: profile?.resumeName || null,
        resumeCategory: profile?.resumeCategory || null,
        resumeUpdatedAt: profile?.resumeUpdatedAt || null,
        existingAnalysis,
      },
    });
  } catch (err: unknown) {
    return safeErrorResponse(err, "Failed to fetch analyzer status");
  }
}

