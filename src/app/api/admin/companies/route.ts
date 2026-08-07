import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    const filter: Prisma.CompanyWhereInput = {};

    if (query) {
      filter.name = { contains: query, mode: "insensitive" };
    }

    const skip = (page - 1) * limit;

    const [pgCompanies, total] = await Promise.all([
      prisma.company.findMany({
        where: filter,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.company.count({ where: filter }),
    ]);

    const companyNames = pgCompanies.map((c: any) => c.name);

    const jobCountsGrouped = await prisma.job.groupBy({
      by: ["company"],
      where: {
        company: { in: companyNames }
      },
      _count: { id: true }
    });

    const jobCountMap: Record<string, number> = {};
    jobCountsGrouped.forEach((g: any) => {
      jobCountMap[g.company.toLowerCase()] = g._count.id;
    });

    const companies = pgCompanies.map((c: any) => ({
      _id: c.id,
      company: c.name,
      careersUrl: c.careerUrl,
      atsType: "custom",
      enabled: c.isEnabled,
      jobsCount: jobCountMap[c.name.toLowerCase()] || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        companies,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to load companies");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, company, enabled } = body;

    if (!id && !company) {
      return NextResponse.json({ success: false, error: "Company ID or name is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (enabled !== undefined) updateData.isEnabled = enabled;

    let updatedCompany;
    if (id) {
      updatedCompany = await prisma.company.update({
        where: { id },
        data: updateData
      });
    } else {
      updatedCompany = await prisma.company.updateMany({
        where: { name: { equals: company, mode: "insensitive" } },
        data: updateData
      });

      const firstMatch = await prisma.company.findFirst({
        where: { name: { equals: company, mode: "insensitive" } }
      });
      updatedCompany = firstMatch;
    }

    if (!updatedCompany) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin: {
        _id: admin.id,
        fullName: admin.fullName,
        email: admin.email
      },
      action: "Updated Company Settings",
      resource: "Company",
      resourceId: updatedCompany.id,
      details: `Updated settings for company: ${updatedCompany.name} (Enabled: ${updatedCompany.isEnabled})`,
    });

    const mappedCompany = {
      _id: updatedCompany.id,
      company: updatedCompany.name,
      careersUrl: updatedCompany.careerUrl,
      atsType: "custom",
      enabled: updatedCompany.isEnabled,
      isEnabled: updatedCompany.isEnabled,
      createdAt: updatedCompany.createdAt,
      updatedAt: updatedCompany.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: "Company settings updated successfully",
      data: mappedCompany,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to update company");
  }
}
