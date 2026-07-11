import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import Job from "@/models/Job";

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
    const source = searchParams.get("source") || "";
    const company = searchParams.get("company") || "";
    const status = searchParams.get("status") || ""; // "active", "expired"
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const filter: any = {};

    // Apply text search
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { company: { $regex: query, $options: "i" } },
      ];
    }

    // Filter by source
    if (source) {
      filter.source = source;
    }

    // Filter by company name
    if (company) {
      filter.company = { $regex: company, $options: "i" };
    }

    // Filter by active/expired status
    if (status === "active") {
      filter.isActive = true;
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ];
    } else if (status === "expired") {
      filter.$or = [
        { isActive: false },
        { expiresAt: { $lt: new Date() } },
      ];
    }

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ postedAtDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load jobs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    const {
      title,
      company,
      companyLogo,
      description,
      responsibilities,
      requirements,
      skills,
      experience,
      type, // Employment type
      locationType, // Work mode
      salary,
      location,
      applyUrl,
      sourceUrl, // Career page url
      expiresAt,
      source,
      featured,
      isActive,
      companyWebsite,
      industry,
      companySize,
    } = body;

    // Field Validations
    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Job title is required." }, { status: 400 });
    }
    if (!company || !company.trim()) {
      return NextResponse.json({ success: false, error: "Company name is required." }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ success: false, error: "Job description is required." }, { status: 400 });
    }
    if (!applyUrl || !applyUrl.trim()) {
      return NextResponse.json({ success: false, error: "Apply URL is required." }, { status: 400 });
    }

    // Map Employment Type
    const validTypes = ["full-time", "part-time", "contract", "internship", "freelance"];
    const normalizedType = (type || "full-time").toLowerCase().replace(" ", "-");
    const finalType = validTypes.includes(normalizedType) ? normalizedType : "full-time";

    // Map Work Mode
    const validModes = ["remote", "hybrid", "onsite"];
    const normalizedMode = (locationType || "remote").toLowerCase();
    const finalMode = validModes.includes(normalizedMode) ? normalizedMode : "remote";

    // Parse array strings
    const skillsArray = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
      ? skills.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    const responsibilitiesArray = Array.isArray(responsibilities)
      ? responsibilities
      : typeof responsibilities === "string"
      ? responsibilities.split("\n").map(r => r.trim()).filter(Boolean)
      : [];

    const requirementsArray = Array.isArray(requirements)
      ? requirements
      : typeof requirements === "string"
      ? requirements.split("\n").map(r => r.trim()).filter(Boolean)
      : [];

    // ── AUTOMATICALLY CREATE/UPDATE COMPANY INFORMATION ───────────────────────
    const Company = (await import("@/models/Company")).default;
    let companyDoc = await Company.findOne({ name: { $regex: new RegExp(`^${company.trim()}$`, "i") } });
    if (!companyDoc) {
      companyDoc = await Company.create({
        name: company.trim(),
        careerUrl: sourceUrl || companyWebsite || applyUrl || "",
        website: companyWebsite || "",
        industry: industry || "",
        size: companySize || "",
        crawlStatus: "idle",
        jobsFound: 1,
        isEnabled: false,
      });
    } else {
      if (sourceUrl) companyDoc.careerUrl = sourceUrl;
      if (companyWebsite) companyDoc.website = companyWebsite;
      if (industry) companyDoc.industry = industry;
      if (companySize) companyDoc.size = companySize;
      companyDoc.jobsFound += 1;
      await companyDoc.save();
    }

    // ── CREATE JOB POSTING ───────────────────────────────────────────────────
    const crypto = await import("crypto");
    const dedupeHash = `manual-${company.trim().toLowerCase()}-${title.trim().toLowerCase()}-${(location || "").toLowerCase()}-${crypto.randomBytes(6).toString("hex")}`;

    const newJob = await Job.create({
      title: title.trim(),
      company: company.trim(),
      companyLogo: companyLogo || "",
      description: description.trim(),
      responsibilities: responsibilitiesArray,
      requirements: requirementsArray,
      skills: skillsArray,
      experience: experience || "",
      type: finalType,
      locationType: finalMode,
      salary: salary || "",
      location: location || "Remote",
      applyUrl: applyUrl.trim(),
      sourceUrl: sourceUrl || "",
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      source: source || "Manual",
      featured: !!featured,
      isActive: isActive !== undefined ? !!isActive : true,
      dedupeHash,
    });

    // ── AUDIT LOG ACTION ─────────────────────────────────────────────────────
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin,
      action: "Added Manual Job",
      resource: "Job",
      resourceId: newJob._id.toString(),
      details: `Manually created job posting '${newJob.title}' at ${newJob.company}`,
    });

    return NextResponse.json({
      success: true,
      message: "Job posting created successfully.",
      data: newJob,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create job posting" },
      { status: 500 }
    );
  }
}
