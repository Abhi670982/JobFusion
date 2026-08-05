import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // 1. Requests by provider (BYOK vs JobFusion)
    const [
      openaiBYOK,
      geminiBYOK,
      claudeBYOK
    ] = await Promise.all([
      prisma.userApiKey.count({ where: { openaiKey: { not: null } } }),
      prisma.userApiKey.count({ where: { geminiKey: { not: null } } }),
      prisma.userApiKey.count({ where: { claudeKey: { not: null } } })
    ]);

    const byokUsersCount = openaiBYOK + geminiBYOK + claudeBYOK;

    // Platform usage is estimated based on users who don't have BYOK but have usage
    const totalUsersWithUsage = await prisma.userUsage.groupBy({
      by: ['userId'],
    });
    const platformUsersCount = Math.max(0, totalUsersWithUsage.length - byokUsersCount);

    const providerDistribution = [
      { name: 'Gemini (Platform)', value: platformUsersCount, color: '#10b981' }, // emerald
      { name: 'OpenAI (BYOK)', value: openaiBYOK, color: '#f43f5e' }, // rose
      { name: 'Gemini (BYOK)', value: geminiBYOK, color: '#3b82f6' }, // blue
      { name: 'Claude (BYOK)', value: claudeBYOK, color: '#8b5cf6' }, // violet
    ];

    // 2. Daily AI usage chart (last 14 days)
    const now = new Date();
    const dailyUsage = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      const usageForDay = await prisma.userUsage.aggregate({
        where: { usageDate: dateStr },
        _sum: { usageCount: true }
      });

      dailyUsage.push({
        date: `${d.toLocaleString('default', { month: 'short' })} ${dd}`,
        requests: usageForDay._sum.usageCount || 0
      });
    }

    // 3. Feature usage breakdown
    const featureUsage = await prisma.userUsage.groupBy({
      by: ['featureName'],
      _sum: { usageCount: true }
    });

    const formattedFeatureUsage = featureUsage.map(f => ({
      feature: f.featureName,
      count: f._sum.usageCount || 0
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      data: {
        providerDistribution,
        dailyUsage,
        featureUsage: formattedFeatureUsage,
        byokAdoption: {
          byok: byokUsersCount,
          platform: platformUsersCount
        }
      }
    });
  } catch (error: any) {
    console.error("Error in AI analytics API:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
