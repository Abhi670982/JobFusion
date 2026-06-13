import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import Profile from "@/models/Profile";
import Job from "@/models/Job";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      return NextResponse.json({
        success: true,
        totalMatches: 0,
        averageMatchPercentage: 0,
        topMatchedJobs: [],
      });
    }

    const userSkills = (profile.skills || []).map((s: any) => s.name.toLowerCase());
    const userDomain = (profile.resumeCategory || "").toLowerCase().trim();

    // Fetch all jobs to perform match calculations
    const allJobs = await Job.find().lean();
    if (allJobs.length === 0) {
      return NextResponse.json({
        success: true,
        totalMatches: 0,
        averageMatchPercentage: 0,
        topMatchedJobs: [],
      });
    }

    const matchedJobs = allJobs.map((job: any) => {
      const jobSkills = (job.skills || []).map((s: string) => s.toLowerCase());
      const overlap = jobSkills.filter((s: string) => userSkills.includes(s));
      
      let score = 0;
      if (jobSkills.length > 0) {
        score = (overlap.length / jobSkills.length) * 80; // Up to 80% based on skill overlap
      }

      // Add up to 20% if job category matches user domain
      if (userDomain && job.category && job.category.toLowerCase().includes(userDomain)) {
        score += 20;
      } else if (userDomain && job.title && job.title.toLowerCase().includes(userDomain)) {
        score += 15;
      }

      // If user has no skills at all, base it on domain or a baseline match score
      if (userSkills.length === 0) {
        score = userDomain && job.category && job.category.toLowerCase().includes(userDomain) ? 75 : 50;
      }

      const matchScore = Math.min(100, Math.max(45, Math.round(score)));

      return {
        ...job,
        matchScore,
      };
    });

    // Filter jobs with a decent match score (>= 60%) or all if total matches is small
    const threshold = userSkills.length > 0 ? 60 : 50;
    const filteredMatches = matchedJobs.filter((job) => job.matchScore >= threshold);
    
    // Sort by match score descending
    filteredMatches.sort((a, b) => b.matchScore - a.matchScore);

    const topMatches = filteredMatches.slice(0, 10);
    const avgScore = filteredMatches.length > 0
      ? Math.round(filteredMatches.reduce((acc, job) => acc + job.matchScore, 0) / filteredMatches.length)
      : 0;

    return NextResponse.json({
      success: true,
      totalMatches: filteredMatches.length,
      averageMatchPercentage: avgScore,
      topMatchedJobs: topMatches,
    });
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/matches:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate matches" },
      { status: 500 }
    );
  }
}
