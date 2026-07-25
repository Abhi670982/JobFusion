import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { Prisma, User, UserStatus } from "@prisma/client";
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

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

    const skip = (page - 1) * limit;

    const [pgUsers, total] = await Promise.all([
      prisma.user.findMany({
        where: filter,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          subscription: true,
          apiKeys: true,
          usages: {
            where: {
              usageDate: usageService.getTodayDateString()
            }
          }
        }
      }),
      prisma.user.count({
        where: filter,
      }),
    ]);

    // Map to MongoDB-like payload
    const users = pgUsers.map((u: any) => {
      let isBYOK = false;
      let connectedProvider = null;
      if (u.apiKeys) {
        if (u.apiKeys.openaiKey) { isBYOK = true; connectedProvider = "openai"; }
        else if (u.apiKeys.geminiKey) { isBYOK = true; connectedProvider = "gemini"; }
        else if (u.apiKeys.claudeKey) { isBYOK = true; connectedProvider = "claude"; }
      }
      
      const aiUsageToday = u.usages.reduce((acc: number, curr: any) => acc + curr.usageCount, 0);

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
        subscription: {
          planId: u.subscription?.planId || "free",
        },
        aiProvider: {
          isBYOK,
          provider: connectedProvider
        },
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
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
