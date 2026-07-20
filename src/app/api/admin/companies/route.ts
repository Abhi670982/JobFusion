import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { Prisma, Company } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // ── AUTO-BOOTSTRAP COMPANIES FROM JOBS (PostgreSQL check) ────────────────
    const initialCount = await prisma.company.count();
    if (initialCount === 0) {
      console.log("[Companies API] Bootstrapping PostgreSQL Company table from existing Job entries...");
      
      // Fetch distinct companies from PostgreSQL Job table
      const uniqueCompanies = await prisma.job.findMany({
        select: { company: true },
        distinct: ['company'],
      });

      const uniqueCompanyNames = uniqueCompanies.map(j => j.company).filter(Boolean);

      const companyDocs = [];
      for (const name of uniqueCompanyNames) {
        // Find sample job to get career url / timestamp
        const sampleJob = await prisma.job.findFirst({
          where: { company: name }
        });
        const jobsCount = await prisma.job.count({
          where: { company: name }
        });

        let careerUrl = "";
        if (sampleJob && sampleJob.applyUrl) {
          try {
            const url = new URL(sampleJob.applyUrl);
            careerUrl = `${url.protocol}//${url.hostname}`;
          } catch {
            careerUrl = sampleJob.applyUrl;
          }
        }
        
        if (!careerUrl) {
          careerUrl = `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com/careers`;
        }

        companyDocs.push({
          name,
          careerUrl,
          crawlStatus: "idle" as const,
          lastSync: sampleJob ? sampleJob.createdAt : new Date(),
          jobsFound: jobsCount,
          isEnabled: true,
        });
      }

      if (companyDocs.length > 0) {
        await prisma.company.createMany({
          data: companyDocs
        });
      }
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const isEnabled = searchParams.get("isEnabled");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const filter: Prisma.CompanyWhereInput = {};

    if (query) {
      filter.name = { contains: query, mode: "insensitive" };
    }

    if (isEnabled === "true") {
      filter.isEnabled = true;
    } else if (isEnabled === "false") {
      filter.isEnabled = false;
    }

    const skip = (page - 1) * limit;

    const [pgCompanies, total] = await Promise.all([
      prisma.company.findMany({
        where: filter,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.company.count({
        where: filter,
      }),
    ]);

    // Map database output to MongoDB-like payload
    const companies = pgCompanies.map((c: Company) => ({
      _id: c.id,
      name: c.name,
      careerUrl: c.careerUrl,
      crawlStatus: c.crawlStatus,
      lastSync: c.lastSync,
      jobsFound: c.jobsFound,
      lastError: c.lastError,
      isEnabled: c.isEnabled,
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
    const errorMessage = error instanceof Error ? error.message : "Failed to load companies";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { companyId, isEnabled, careerUrl } = body;

    if (!companyId) {
      return NextResponse.json({ success: false, error: "companyId is required" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    // Update in Postgres
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        isEnabled: isEnabled !== undefined ? isEnabled : undefined,
        careerUrl: careerUrl !== undefined ? careerUrl : undefined,
      }
    });

    // Log admin action in Postgres using Prisma
    try {
      await prisma.activity.create({
        data: {
          userId: admin.id,
          type: "admin_action",
          details: `${updatedCompany.isEnabled ? "Enabled" : "Disabled"} crawls for company: '${updatedCompany.name}'`
        }
      });
    } catch (pgErr) {
      console.error("[Postgres Activity Log Error]", pgErr);
    }

    const mappedCompany = {
      _id: updatedCompany.id,
      name: updatedCompany.name,
      careerUrl: updatedCompany.careerUrl,
      crawlStatus: updatedCompany.crawlStatus,
      lastSync: updatedCompany.lastSync,
      jobsFound: updatedCompany.jobsFound,
      lastError: updatedCompany.lastError,
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
    const errorMessage = error instanceof Error ? error.message : "Failed to update company";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
