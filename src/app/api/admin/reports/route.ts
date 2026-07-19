import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function mapReport(r: any) {
  if (!r) return null;
  return {
    _id: r.id,
    userId: r.user ? {
      _id: r.user.id,
      fullName: r.user.fullName,
      email: r.user.email
    } : r.userId,
    type: r.type,
    title: r.title,
    description: r.description,
    jobId: r.job ? {
      _id: r.job.id,
      title: r.job.title,
      company: r.job.company
    } : r.jobId,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt
  };
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const andConditions: any[] = [];

    if (query) {
      andConditions.push({
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ]
      });
    }

    if (type) {
      andConditions.push({ type: type as any });
    }

    if (status) {
      andConditions.push({ status: status as any });
    }

    const queryConditions = andConditions.length > 0 ? { AND: andConditions } : {};
    const skip = (page - 1) * limit;

    const [pgReports, total] = await Promise.all([
      prisma.report.findMany({
        where: queryConditions,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          job: {
            select: {
              id: true,
              title: true,
              company: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.report.count({
        where: queryConditions,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reports: pgReports.map(mapReport),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load reports" },
      { status: 500 }
    );
  }
}
