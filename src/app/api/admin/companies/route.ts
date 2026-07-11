import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import Company from "@/models/Company";
import Job from "@/models/Job";
import Activity from "@/models/Activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    // ── AUTO-BOOTSTRAP COMPANIES FROM JOBS ───────────────────────────────────
    const initialCount = await Company.countDocuments({});
    if (initialCount === 0) {
      console.log("[Companies API] Bootstrapping Company collection from existing Job entries...");
      const uniqueCompanyNames = await Job.distinct("company");
      
      const companyDocs = [];
      for (const name of uniqueCompanyNames) {
        if (!name) continue;
        const sampleJob = await Job.findOne({ company: name }).lean();
        const jobsCount = await Job.countDocuments({ company: name });
        
        let careerUrl = "";
        if (sampleJob && (sampleJob as any).applyUrl) {
          try {
            const url = new URL((sampleJob as any).applyUrl);
            careerUrl = `${url.protocol}//${url.hostname}`;
          } catch {
            careerUrl = (sampleJob as any).applyUrl;
          }
        }
        
        if (!careerUrl) {
          careerUrl = `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com/careers`;
        }

        companyDocs.push({
          name,
          careerUrl,
          crawlStatus: "idle",
          lastSync: sampleJob ? (sampleJob as any).createdAt || new Date() : new Date(),
          jobsFound: jobsCount,
          isEnabled: true,
        });
      }

      if (companyDocs.length > 0) {
        await Company.insertMany(companyDocs);
      }
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const isEnabled = searchParams.get("isEnabled");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const filter: any = {};

    if (query) {
      filter.name = { $regex: query, $options: "i" };
    }

    if (isEnabled === "true") {
      filter.isEnabled = true;
    } else if (isEnabled === "false") {
      filter.isEnabled = false;
    }

    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Company.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        companies,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load companies" },
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

    await connectDB();
    const body = await req.json();
    const { companyId, isEnabled, careerUrl } = body;

    if (!companyId) {
      return NextResponse.json({ success: false, error: "companyId is required" }, { status: 400 });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    if (isEnabled !== undefined) {
      company.isEnabled = isEnabled;
    }
    if (careerUrl !== undefined) {
      company.careerUrl = careerUrl;
    }

    await company.save();

    // Log admin action
    await Activity.create({
      userId: admin._id,
      type: "admin_action",
      details: `${company.isEnabled ? "Enabled" : "Disabled"} crawls for company: '${company.name}'`,
    });

    return NextResponse.json({
      success: true,
      message: "Company settings updated successfully",
      data: company,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update company" },
      { status: 500 }
    );
  }
}
