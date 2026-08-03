import { NextRequest, NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { getAIConfig } from "@/lib/ai-provider";
import { runFullAnalysis, computeResumeHash } from "@/lib/resume-analyzer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/resume-analyzer
 * Body: { userId: string, forceReanalyze?: boolean }
 *
 * Access gate: Pro subscription OR BYOK configured.
 * Free users without BYOK are rejected with REQUIRES_PREMIUM_OR_BYOK.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { forceReanalyze = false, jobDescription = "" } = body;

    // 2. Access gate — resolve AI config & daily usage limit
    const rawConfig = await getAIConfig(
      mongoUser.id,
      "resume-analyzer",
      mongoUser.clerkId || undefined,
      "gemini"
    );

    if (!rawConfig.allowed) {
      return NextResponse.json(
        { success: false, code: "REQUIRES_PREMIUM_OR_BYOK", error: rawConfig.error },
        { status: 403 }
      );
    }

    // Intercept free-credits route & check daily limit for Free users
    if (!rawConfig.isBYOK) {
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
        const { usageService } = await import("@/lib/usageService");
        const todayUsage = await usageService.getTodayUsage(mongoUser.id, "resume-analyzer");
        if (todayUsage >= 2) {
          return NextResponse.json(
            {
              success: false,
              code: "LIMIT_REACHED",
              error: "Free users can analyze up to 2 resumes per day. Upgrade to Premium for unlimited AI Resume Analysis OR connect your own API using BYOK.",
              usage: { used: todayUsage, limit: 2 }
            },
            { status: 403 }
          );
        }
      }
    }

    // 3. Fetch profile
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

    // 4. Get resume text
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

    // 5. Cache check — bypass if JD changed OR resume text hash changed OR forceReanalyze is true
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

    // 6. Run full hybrid analysis
    const report = await runFullAnalysis(resumeText, rawConfig, normalizedJD);

    // 7. Persist result
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

    // 8. Increment daily usage counter for non-BYOK users
    if (!rawConfig.isBYOK) {
      const { usageService } = await import("@/lib/usageService");
      await usageService.incrementUsage(mongoUser.id, "resume-analyzer", mongoUser.clerkId || undefined);
    }

    return NextResponse.json({ success: true, data: report, cached: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[Resume Analyzer API]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

