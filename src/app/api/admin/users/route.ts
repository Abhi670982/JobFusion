import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { Prisma, UserStatus } from "@prisma/client";
import { safeErrorResponse } from "@/lib/security";

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

    const todayStr = new Date().toISOString().split("T")[0];

    const [pgUsers, total] = await Promise.all([
      prisma.user.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          subscription: true,
          usages: {
            where: { usageDate: { startsWith: todayStr } }
          }
        }
      }),
      prisma.user.count({
        where: filter,
      }),
    ]);

    const users = pgUsers.map((u) => {
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
        isBYOK: false,
        aiProvider: null,
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
    return safeErrorResponse(error, "Failed to load users");
  }
}
