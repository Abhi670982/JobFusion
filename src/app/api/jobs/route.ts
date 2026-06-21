import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";

export const dynamic = "force-dynamic";


const isValidObjectId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
    const q = searchParams.get("q") || "";
    const source = searchParams.get("source") || "";
    const location = searchParams.get("location") || "";
    const jobType = searchParams.get("jobType") || "";
    const experienceLevel = searchParams.get("experienceLevel") || "";
    const remote = searchParams.get("remote") || "";
    const salaryMin = searchParams.get("salaryMin") || "";
    const salaryMax = searchParams.get("salaryMax") || "";
    const skills = searchParams.get("skills") || "";
    const postedAfter = searchParams.get("postedAfter") || "";
    const category = searchParams.get("category") || "";
    
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const sortBy = searchParams.get("sortBy") || "postedAt";
    const order = searchParams.get("order") || "desc";

    const andConditions: any[] = [];

    // 1. Full-text search (Title, Company, Description)
    if (q) {
      andConditions.push({
        $or: [
          { title: { $regex: q, $options: "i" } },
          { company: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
        ]
      });
    }

    // 2. Multi-source filter
    if (source) {
      const sources = source.split(",").map((s) => s.trim().toLowerCase());
      andConditions.push({
        source: { $in: sources }
      });
    }

    // 3. Location filter
    if (location) {
      andConditions.push({
        $or: [
          { location: { $regex: location, $options: "i" } },
          { city: { $regex: location, $options: "i" } },
          { country: { $regex: location, $options: "i" } },
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
            { salaryMin: { $gte: parseInt(salaryMin, 10) } }
          ]
        });
      }
      if (salaryMax) {
        andConditions.push({
          $or: [
            { salaryMin: { $lte: parseInt(salaryMax, 10) } },
            { salaryMax: { $lte: parseInt(salaryMax, 10) } }
          ]
        });
      }
    }

    // 8. Skills filter (case-insensitive regex match for each skill)
    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim());
      andConditions.push({
        skills: { 
          $in: skillList.map(s => new RegExp(`^${escapeRegExp(s)}$`, "i")) 
        }
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

    if (dateLimit) {
      andConditions.push({
        $or: [
          { postedAtDate: { $gte: dateLimit } },
          {
            $and: [
              { postedAtDate: { $exists: false } },
              { createdAt: { $gte: dateLimit } }
            ]
          }
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
    const sortField = sortBy === "salaryMin" ? "salaryMin" : "postedAtDate";
    const sortDirection = order === "asc" ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sortField] = sortDirection;
    sortOptions.createdAt = -1;

    // Execute query with pagination
    const total = await Job.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const jobs = await Job.find(queryConditions)
      .sort(sortOptions)
      .skip(offset)
      .limit(limit);

    // Count per source dynamically based on other active filters (ignoring the source filter itself)
    const getSourceCount = async (src: string) => {
      const baseConditions = andConditions.filter(c => !c.source);
      baseConditions.push({ source: src });
      return Job.countDocuments(baseConditions.length > 1 ? { $and: baseConditions } : baseConditions[0]);
    };

    const [linkedinCount, indeedCount, wellfoundCount, internshalaCount, careersCount] = await Promise.all([
      getSourceCount("linkedin"),
      getSourceCount("indeed"),
      getSourceCount("wellfound"),
      getSourceCount("internshala"),
      getSourceCount("careers")
    ]);

    const sourceCounts = {
      linkedin: linkedinCount,
      indeed: indeedCount,
      wellfound: wellfoundCount,
      internshala: internshalaCount,
      careers: careersCount
    };

    return NextResponse.json({
      success: true,
      data: jobs,
      total,
      page,
      totalPages,
      sourceCounts
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
