import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";
import { validateJobsQuery, escapeRegExp } from "@/lib/api-validators";

export const dynamic = "force-dynamic";

const isValidObjectId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

// 1. POST - Create a Job
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, company, location, salary, description, source, applyUrl } = body;

    // Validate required fields
    if (!title || !company) {
      return NextResponse.json(
        { success: false, error: "title and company are required fields" },
        { status: 400 }
      );
    }

    const job = await Job.create({
      title,
      company,
      location,
      salary,
      description,
      source,
      applyUrl,
      postedAt: new Date().toString(),
      postedAtDate: new Date(),
    });

    return NextResponse.json(
      { success: true, data: job },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 2. GET - Read Jobs (Single, Specific, or Filtered Search)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Get specific job
    if (id) {
      if (!isValidObjectId(id)) {
        return NextResponse.json(
          { success: false, error: "Invalid job ID format" },
          { status: 400 }
        );
      }
      const job = await Job.findById(id);
      if (!job) {
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: job });
    }

    // Get filtered jobs
    const andConditions: any[] = [];
    let projection: any = {};
    let textSort = false;

    // Load current user's skills for Rule 2 enforcement
    let userSkills: string[] = [];
    try {
      const { getOrCreateMongoUser } = await import("@/lib/auth-sync");
      const mongoUser = await getOrCreateMongoUser();
      if (mongoUser) {
        const Profile = (await import("@/models/Profile")).default;
        const profile = await Profile.findOne({ userId: mongoUser._id });
        if (profile && profile.skills && profile.skills.length > 0) {
          userSkills = profile.skills.map((s: any) => s.name.toLowerCase());
        }
      }
    } catch (err: any) {
      console.warn("[API Jobs] Failed to resolve user skills for search filtering:", err.message);
    }

    // Use shared validator for page, limit, q, location, skills, sortBy, order
    const validated = validateJobsQuery(searchParams);
    const q        = validated.q        || searchParams.get("q")        || "";
    const source   = searchParams.get("source")   || "";
    const location = validated.location || searchParams.get("location") || "";
    const jobType  = searchParams.get("jobType")  || "";
    const experienceLevel = searchParams.get("experienceLevel") || "";
    const remote   = searchParams.get("remote")   || "";
    const salaryMin = searchParams.get("salaryMin") || "";
    const salaryMax = searchParams.get("salaryMax") || "";
    const skills   = validated.skills   || searchParams.get("skills")   || "";
    const postedAfter = searchParams.get("postedAfter") || "";
    const category = searchParams.get("category") || "";
    
    const page    = validated.page;
    const limit   = validated.limit;
    const sortBy  = validated.sortBy;
    const order   = validated.order;

    // 1. Full-text search (Title, Company, Description, Skills)
    // Uses MongoDB $text index — fast, indexed, and ReDoS-safe.
    // Escaping is still applied as a precaution for any remaining regex paths.
    if (q) {
      const safe = escapeRegExp(q);
      andConditions.push({ $text: { $search: safe } });
      // Include text score in projection so we can optionally sort by relevance
      projection = { score: { $meta: "textScore" } };
      textSort = true;
    }

    // 2. Multi-source filter
    if (source) {
      const sources = source.split(",").map((s) => s.trim().toLowerCase());
      andConditions.push({
        source: { $in: sources }
      });
    }

    // 3. Location filter (escaped to prevent ReDoS)
    if (location) {
      const safeLocation = escapeRegExp(location);
      andConditions.push({
        $or: [
          { location: { $regex: safeLocation, $options: "i" } },
          { city: { $regex: safeLocation, $options: "i" } },
          { country: { $regex: safeLocation, $options: "i" } },
        ]
      });
    }

    // 4. Job type filter
    if (jobType) {
      const types = jobType.split(",").map((t) => t.trim().toLowerCase());
      andConditions.push({
        $or: [
          { type: { $in: types } },
          { jobType: { $in: types } }
        ]
      });
    }

    // 5. Experience level filter
    if (experienceLevel) {
      const levels = experienceLevel.split(",").map((l) => l.trim().toLowerCase());
      andConditions.push({
        experienceLevel: { $in: levels }
      });
    }

    // 6. Remote toggle
    if (remote === "true") {
      andConditions.push({
        $or: [
          { isRemote: true },
          { locationType: "remote" },
          { location: { $regex: "remote", $options: "i" } }
        ]
      });
    }

    // 7. Salary range filter
    if (salaryMin || salaryMax) {
      if (salaryMin) {
        andConditions.push({
          $or: [
            { salaryMax: { $gte: parseInt(salaryMin, 10) } },
            { salaryMin: { $gte: parseInt(salaryMin, 10) } },
            { salaryMin: { $eq: 0 } },
            { salaryMin: { $eq: null } },
            { salaryMin: { $exists: false } }
          ]
        });
      }
      if (salaryMax) {
        andConditions.push({
          $or: [
            { salaryMin: { $lte: parseInt(salaryMax, 10) } },
            { salaryMax: { $lte: parseInt(salaryMax, 10) } },
            { salaryMin: { $eq: 0 } },
            { salaryMin: { $eq: null } },
            { salaryMin: { $exists: false } }
          ]
        });
      }
    }

    // 8. Skills filter (safe escaped regex — prevents ReDoS)
    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      andConditions.push({
        skills: {
          $in: skillList.map((s) => new RegExp(`^${escapeRegExp(s)}$`, "i"))
        }
      });
    } else if (userSkills.length > 0) {
      // RULE 2: If user has profile skills, filter by matchedSkill or by job skills intersection
      andConditions.push({
        $or: [
          { matchedSkill: { $in: userSkills } },
          { skills: { $in: userSkills.map((s) => new RegExp(`^${escapeRegExp(s)}$`, "i")) } }
        ]
      });
    }

    const datePosted = searchParams.get("datePosted") || "";

    // 9. Date posted filter
    let dateLimit: Date | null = null;
    if (datePosted) {
      const now = new Date();
      if (datePosted === "24h") now.setHours(now.getHours() - 24);
      else if (datePosted === "3d") now.setDate(now.getDate() - 3);
      else if (datePosted === "7d") now.setDate(now.getDate() - 7);
      else if (datePosted === "30d") now.setDate(now.getDate() - 30);
      dateLimit = now;
    } else if (postedAfter) {
      const parsed = new Date(postedAfter);
      if (!isNaN(parsed.getTime())) {
        dateLimit = parsed;
      }
    }

    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const cutoff24h = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

    if (dateLimit) {
      // RULE 1: careers source ALWAYS filtered to 24h — non-negotiable. Other sources use dateLimit.
      andConditions.push({
        $or: [
          { source: "careers", postedAtDate: { $gte: cutoff24h } },
          { 
            source: { $ne: "careers" },
            $or: [
              { postedAtDate: { $gte: dateLimit } },
              {
                $and: [
                  { postedAtDate: { $exists: false } },
                  { createdAt: { $gte: dateLimit } }
                ]
              }
            ]
          }
        ]
      });
    } else {
      // If no explicit dateLimit, careers is still restricted to 24h
      andConditions.push({
        $or: [
          { source: "careers", postedAtDate: { $gte: cutoff24h } },
          { source: { $ne: "careers" } }
        ]
      });
    }


    // 10. Category filter
    if (category) {
      andConditions.push({
        category: { $regex: category, $options: "i" }
      });
    }

    // 11. Filter out closed jobs (expiresAt in the future, null, or not set)
    const now = new Date();
    andConditions.push({
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: null },
        { expiresAt: { $exists: false } }
      ]
    });

    // 12. Only show active jobs (isActive true or not set)
    andConditions.push({
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }
      ]
    });

    // Build final query conditions object
    const queryConditions = andConditions.length > 0 ? { $and: andConditions } : {};

    // Construct sorting
    // If text search is active and no explicit sort override, sort by text relevance score
    let sortOptions: any = {};
    if (textSort && sortBy === "postedAt") {
      sortOptions = { score: { $meta: "textScore" }, createdAt: -1 };
    } else {
      const sortField = sortBy === "salaryMin" ? "salaryMin" : "postedAtDate";
      const sortDirection = order === "asc" ? 1 : -1;
      sortOptions[sortField] = sortDirection;
      sortOptions.createdAt = -1;
    }

    // Execute query with pagination
    const total = await Job.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const jobs = await Job.find(queryConditions, projection)
      .sort(sortOptions)
      .skip(offset)
      .limit(limit);

    // Count per source dynamically based on other active filters (ignoring the source filter itself)
    const getSourceCount = async (src: string) => {
      const baseConditions = andConditions.filter(c => !c.source);
      baseConditions.push({ source: src });
      return Job.countDocuments(baseConditions.length > 1 ? { $and: baseConditions } : baseConditions[0]);
    };

        const [wellfoundCount, careersCount, aggregatorCount] = await Promise.all([
      getSourceCount("wellfound"),
      getSourceCount("careers"),
      getSourceCount("aggregator")
    ]);

    const sourceCounts = {
      wellfound: wellfoundCount,
      careers: careersCount,
      aggregator: aggregatorCount
    };

    return NextResponse.json({
      success: true,
      data: jobs,
      total,
      page,
      totalPages,
      sourceCounts,
      meta: {
        filteredTo24h: true,
        oldestJobAt: jobs[jobs.length - 1]?.postedAtDate ?? null,
        newestJobAt: jobs[0]?.postedAtDate ?? null,
        skillsUsed: userSkills,
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 3. PUT - Update a Job
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id") || body.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Job id is required to update a job" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    const { _id, ...updateData } = body;

    const updatedJob = await Job.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedJob) {
      return NextResponse.json(
        { success: false, error: "Job not found to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedJob });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 4. DELETE - Delete a Job
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Job id is required to delete a job" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    const deletedJob = await Job.findByIdAndDelete(id);
    if (!deletedJob) {
      return NextResponse.json(
        { success: false, error: "Job not found to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedJob,
      message: "Job deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
