import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { Prisma, UserStatus } from "@prisma/client";
import { usageService } from "@/lib/usageService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const role = searchParams.get("role") || "";
    const plan = searchParams.get("plan") || "";
    const byok = searchParams.get("byok") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    const filter: Prisma.UserWhereInput = {};

    // Apply Search
    if (query) {
      filter.OR = [
        { fullName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ];
    }

    // Apply Filters
    if (status) {
      filter.status = status === "suspended" ? UserStatus.suspended : UserStatus.active;
    }
    if (role) {
      filter.role = role;
    }
    if (plan) {
      if (plan === "free") {
        filter.NOT = { subscription: { status: "active", planId: { not: "free" } } };
      } else {
        filter.subscription = { status: "active", planId: { contains: plan, mode: "insensitive" } };
      }
    }
    if (byok === "true") {
      filter.apiKeys = {
        OR: [
          { openaiKey: { not: null } },
          { geminiKey: { not: null } },
          { claudeKey: { not: null } },
        ]
      };
    } else if (byok === "false") {
      filter.OR = [
        { apiKeys: null },
        {
          apiKeys: {
            openaiKey: null,
            geminiKey: null,
            claudeKey: null,
          }
        }
      ];
    }

    const skip = (page - 1) * limit;
    const todayStr = usageService.getTodayDateString();

    const [pgUsers, total] = await Promise.all([
      prisma.user.findMany({
        where: filter,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          clerkId: true,
          fullName: true,
          email: true,
          profileImage: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          subscription: {
            select: { planId: true, status: true }
          },
          apiKeys: {
            select: { openaiKey: true, geminiKey: true, claudeKey: true }
          },
          usages: {
            where: { usageDate: todayStr },
            select: { usageCount: true }
          }
        }
      }),
      prisma.user.count({
        where: filter,
      }),
    ]);

    const users = pgUsers.map((u) => {
      let isBYOK = false;
      let connectedProvider: string | null = null;
      if (u.apiKeys) {
        if (u.apiKeys.openaiKey) { isBYOK = true; connectedProvider = "openai"; }
        else if (u.apiKeys.geminiKey) { isBYOK = true; connectedProvider = "gemini"; }
        else if (u.apiKeys.claudeKey) { isBYOK = true; connectedProvider = "claude"; }
      }
      
      const aiUsageToday = u.usages.reduce((acc, curr) => acc + curr.usageCount, 0);
      const planId = u.subscription?.status === "active" ? (u.subscription.planId || "free") : "free";

      return {
        _id: u.id,
        clerkId: u.clerkId,
        fullName: u.fullName,
        email: u.email,
        profileImage: u.profileImage,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        subscription: planId, // String return type!
        isBYOK,
        aiProvider: connectedProvider,
        aiUsageToday
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        users,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load users";
    console.error("[Users API Error]:", error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
