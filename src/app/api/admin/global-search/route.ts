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

    if (!query) {
      return NextResponse.json({
        success: true,
        data: { users: [], jobs: [], reports: [], companies: [] },
      });
    }

    const [usersRaw, jobsRaw, reportsRaw, companiesRaw] = await Promise.all([
      // 1. Search Users
      prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      }),

      // 2. Search Jobs
      prisma.job.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          company: true,
        },
      }),

      // 3. Search Reports
      prisma.report.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
        },
      }),

      // 4. Search Companies
      prisma.company.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        take: 5,
        select: {
          id: true,
          name: true,
          careerUrl: true,
        },
      }),
    ]);

    const users = usersRaw.map((u) => ({
      id: u.id,
      name: u.fullName,
      email: u.email,
    }));

    const jobs = jobsRaw.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
    }));

    const reports = reportsRaw.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      status: r.status,
    }));

    const companies = companiesRaw.map((c) => ({
      id: c.id,
      name: c.name,
      careerUrl: c.careerUrl,
    }));

    return NextResponse.json({
      success: true,
      data: {
        users,
        jobs,
        reports,
        companies,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Global search failed";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
