import { NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/resume-analyzer/status
 *
 * Returns user's access level and existing analysis metadata.
 * Used on page load to decide which UI state to render without triggering a full analysis.
 */
export async function GET() {
  try {
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Fetch subscription, API keys, profile, and any existing analysis
    const [subscription, apiKeys, profile] = await Promise.all([
      prisma.subscription.findUnique({
        where: { userId: mongoUser.id },
        include: { plan: true },
      }),
      prisma.userApiKey.findUnique({ where: { userId: mongoUser.id } }),
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

    const hasBYOK = !!(
      apiKeys &&
      (apiKeys.openaiKey || apiKeys.geminiKey || apiKeys.claudeKey)
    );

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
        hasBYOK,
        hasResume,
        hasAccess: isPro || hasBYOK,
        resumeName: profile?.resumeName || null,
        resumeCategory: profile?.resumeCategory || null,
        resumeUpdatedAt: profile?.resumeUpdatedAt || null,
        existingAnalysis,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[Analyzer Status API]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
