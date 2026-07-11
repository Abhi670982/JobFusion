import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import User from "@/models/User";
import Job from "@/models/Job";
import Report from "@/models/Report";
import Company from "@/models/Company";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query) {
      return NextResponse.json({
        success: true,
        data: { users: [], jobs: [], reports: [], companies: [] },
      });
    }

    const regex = { $regex: query, $options: "i" };

    const [usersRaw, jobsRaw, reportsRaw, companiesRaw] = await Promise.all([
      // 1. Search Users
      User.find({
        $or: [
          { fullName: regex },
          { email: regex },
        ],
      })
        .limit(5)
        .select("fullName email profileImage")
        .lean(),

      // 2. Search Jobs
      Job.find({
        $or: [
          { title: regex },
          { company: regex },
        ],
      })
        .limit(5)
        .select("title company")
        .lean(),

      // 3. Search Reports
      Report.find({
        $or: [
          { title: regex },
          { description: regex },
        ],
      })
        .limit(5)
        .select("title type status")
        .lean(),

      // 4. Search Companies
      Company.find({ name: regex })
        .limit(5)
        .select("name careerUrl")
        .lean(),
    ]);

    const users = usersRaw.map((u: any) => ({
      id: u._id,
      name: u.fullName,
      email: u.email,
    }));

    const jobs = jobsRaw.map((j: any) => ({
      id: j._id,
      title: j.title,
      company: j.company,
    }));

    const reports = reportsRaw.map((r: any) => ({
      id: r._id,
      title: r.title,
      type: r.type,
      status: r.status,
    }));

    const companies = companiesRaw.map((c: any) => ({
      id: c._id,
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Global search failed" },
      { status: 500 }
    );
  }
}
