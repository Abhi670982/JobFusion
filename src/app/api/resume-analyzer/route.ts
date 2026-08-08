import { NextRequest, NextResponse } from "next/server";
import { getAIConfig } from "@/lib/ai-provider";
import { runFullAnalysis, computeResumeHash } from "@/lib/resume-analyzer";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/resume-analyzer
 * Access gate: Pro subscription OR BYOK configured.
 */
export async function POST(req: NextRequest) {
  try {
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    // Rate limit: 10 analysis calls per 15 minutes per user
    const rateLimitError = checkRateLimit(req, { limit: 10, windowMs: 15 * 60 * 1000, identifier: mongoUser.id });
    if (rateLimitError) return rateLimitError;

    const body = await req.json().catch(() => ({}));
    const { forceReanalyze = false, jobDescription = "" } = body;

    const rawConfig = await getAIConfig(
      mongoUser.id,
      "resume-analyzer",
      mongoUser.clerkId || undefined,
      "gemini"
    );

    if (!rawConfig.allowed) {
      return NextResponse.json(
        { success: false, code: "AI_LIMIT_REACHED", error: rawConfig.error },
        { status: 403 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: mongoUser.id },
      include: { plan: true },
    });
    const isPro =
      subscription &&
      (subscription.plan.planId === "pro_monthly" ||
        subscription.plan.planId === "pro_yearly") &&
      (subscription.status === "active" || subscription.status === "trialing");

    if (!isPro) {
      return NextResponse.json(
        {
          success: false,
          code: "PRO_REQUIRED",
          error: "Resume Analyzer is available with Pro."
        },
        { status: 403 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: mongoUser.id },
      include: { resumeAnalysis: true },
    });

    if (!profile || !profile.resumeUrl) {
      return NextResponse.json(
        { success: false, error: "No resume found. Please upload a resume first." },
        { status: 404 }
      );
    }

    let resumeText = profile.resumeText || "";

    if (!resumeText) {
      const fileExt = (profile.resumeName || "").split(".").pop()?.toLowerCase() || "pdf";
      const response = await fetch(profile.resumeUrl);
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: "Failed to download resume file." },
          { status: 500 }
        );
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const { parsePdf, parseDocx } = await import("@/lib/parser");
      resumeText = fileExt === "pdf" ? await parsePdf(buffer) : await parseDocx(buffer);
      await prisma.profile.update({
        where: { id: profile.id },
        data: { resumeText },
      });
    }

    const currentHash = computeResumeHash(resumeText);
    const normalizedJD = (jobDescription || "").trim();
    
    if (!forceReanalyze && profile.resumeAnalysis) {
      const cachedHash = profile.resumeAnalysis.resumeHash;
      const cachedJD = (profile.resumeAnalysis.targetJobDescription || "").trim();
      const cachedJson = profile.resumeAnalysis.analysisJson as any;
      const isNewSchema = cachedJson && typeof cachedJson === "object" && "scores" in cachedJson && "experienceAnalysis" in cachedJson;

      if (cachedHash === currentHash && cachedJD === normalizedJD && isNewSchema) {
        return NextResponse.json({
          success: true,
          data: profile.resumeAnalysis.analysisJson,
          cached: true,
        });
      }
    }

    const report = await runFullAnalysis(resumeText, rawConfig, normalizedJD);

    await prisma.resumeAnalysis.upsert({
      where: { profileId: profile.id },
      update: {
        analysisJson: report as any,
        overallScore: report.overallScore,
        atsScore: report.atsScore,
        resumeHash: currentHash,
        targetJobDescription: normalizedJD || null,
      },
      create: {
        profileId: profile.id,
        userId: mongoUser.id,
        analysisJson: report as any,
        overallScore: report.overallScore,
        atsScore: report.atsScore,
        resumeHash: currentHash,
        targetJobDescription: normalizedJD || null,
      },
    });

    const { usageService } = await import("@/lib/usageService");
    await usageService.incrementUsage(mongoUser.id, "resume-analyzer", mongoUser.clerkId || undefined);

    return NextResponse.json({ success: true, data: report, cached: false });
  } catch (err: unknown) {
    return safeErrorResponse(err, "Failed to analyze resume");
  }
}
