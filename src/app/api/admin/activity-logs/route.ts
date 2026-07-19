import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    const andConditions: any[] = [];

    // Apply Search
    if (query) {
      andConditions.push({
        OR: [
          { details: { contains: query, mode: "insensitive" } },
          { jobTitle: { contains: query, mode: "insensitive" } },
          { company: { contains: query, mode: "insensitive" } },
          {
            user: {
              fullName: { contains: query, mode: "insensitive" }
            }
          }
        ]
      });
    }

    // Apply Type Filter
    if (type) {
      andConditions.push({ type: type as any });
    }

    const queryConditions = andConditions.length > 0 ? { AND: andConditions } : {};
    const skip = (page - 1) * limit;

    const [pgActivities, total] = await Promise.all([
      prisma.activity.findMany({
        where: queryConditions,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activity.count({
        where: queryConditions,
      }),
    ]);

    // Map to MongoDB populated payload structure
    const activities = pgActivities.map(a => ({
      _id: a.id,
      userId: a.user ? {
        _id: a.user.id,
        fullName: a.user.fullName,
        email: a.user.email,
        profileImage: a.user.profileImage
      } : a.userId,
      type: a.type,
      jobTitle: a.jobTitle,
      company: a.company,
      details: a.details,
      adminName: a.adminName,
      adminEmail: a.adminEmail,
      action: a.action,
      resource: a.resource,
      resourceId: a.resourceId,
      ipAddress: a.ipAddress,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        activities,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load activity logs" },
      { status: 500 }
    );
  }
}
