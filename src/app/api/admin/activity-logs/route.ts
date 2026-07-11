import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import Activity from "@/models/Activity";
import User from "@/models/User";

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
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    const filter: any = {};

    // Apply Search
    if (query) {
      // Find matching users first
      const users = await User.find({ fullName: { $regex: query, $options: "i" } }).select("_id");
      const userIds = users.map(u => u._id);
      
      filter.$or = [
        { details: { $regex: query, $options: "i" } },
        { jobTitle: { $regex: query, $options: "i" } },
        { company: { $regex: query, $options: "i" } },
        { userId: { $in: userIds } },
      ];
    }

    // Apply Type Filter
    if (type) {
      filter.type = type;
    }

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate("userId", "fullName email profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Activity.countDocuments(filter),
    ]);

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
