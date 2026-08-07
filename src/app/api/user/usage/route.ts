import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { usageService } from "@/lib/usageService";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const todayStr = usageService.getTodayDateString();
    const todayUsages = await prisma.userUsage.findMany({
      where: {
        userId: mongoUser.id,
        usageDate: todayStr,
      },
    });

    const totalUsage = todayUsages.reduce((sum: number, usage: any) => sum + usage.usageCount, 0);

    const featureUsage: Record<string, number> = {};
    todayUsages.forEach((usage: any) => {
      featureUsage[usage.featureName] = usage.usageCount;
    });

    const subscription = await prisma.subscription.findUnique({
      where: { userId: mongoUser.id },
      include: { plan: true },
    });

    const isPro = subscription?.planId !== "free";
    const limit = isPro ? null : 20;

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
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to fetch usage data");
  }
}
