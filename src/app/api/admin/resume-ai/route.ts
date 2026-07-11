import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import ResumeParsingLog from "@/models/ResumeParsingLog";
import Profile from "@/models/Profile";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const [
      totalParses,
      successCount,
      failedCount,
      avgTimeRaw,
      topSkillsRaw,
      failedLogs,
    ] = await Promise.all([
      ResumeParsingLog.countDocuments({}),
      ResumeParsingLog.countDocuments({ status: "success" }),
      ResumeParsingLog.countDocuments({ status: "failed" }),
      
      // Average parsing time
      ResumeParsingLog.aggregate([
        { $group: { _id: null, avgTime: { $avg: "$parsingTimeMs" } } },
      ]),

      // Top skills extracted
      Profile.aggregate([
        { $unwind: "$skills" },
        { $group: { _id: "$skills.name", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Recent failed parsing logs
      ResumeParsingLog.find({ status: "failed" })
        .populate("userId", "fullName email")
        .sort({ timestamp: -1 })
        .limit(20)
        .lean(),
    ]);

    const averageTimeMs = avgTimeRaw[0]?.avgTime || 0;
    const topSkills = topSkillsRaw.map(s => ({
      name: s._id,
      count: s.count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalParses,
        successCount,
        failedCount,
        averageTimeMs,
        topSkills,
        failedLogs,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load resume analytics" },
      { status: 500 }
    );
  }
}
