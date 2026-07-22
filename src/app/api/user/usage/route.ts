import { NextRequest, NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";
import { usageService } from "@/lib/usageService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (userId !== mongoUser._id.toString()) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Get today's usage for all features
    const todayStr = usageService.getTodayDateString();
    const todayUsages = await prisma.userUsage.findMany({
      where: {
        userId: mongoUser.id,
        usageDate: todayStr,
      },
    });

    // Calculate total usage today
    const totalUsage = todayUsages.reduce((sum: number, usage: any) => sum + usage.usageCount, 0);

    // Build feature usage breakdown
    const featureUsage: Record<string, number> = {};
    todayUsages.forEach((usage: any) => {
      featureUsage[usage.featureName] = usage.usageCount;
    });

    // Get subscription info
    const subscription = await prisma.subscription.findUnique({
      where: { userId: mongoUser.id },
      include: { plan: true },
    });

    const isPro = subscription?.planId !== "free";
    const limit = isPro ? null : 2;

    return NextResponse.json({
      success: true,
      data: {
        todayUsage: totalUsage,
        limit,
        isPro,
        featureUsage,
        usageDate: todayStr,
      },
    });
  } catch (error: any) {
    console.error("[User Usage GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
