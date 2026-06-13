import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import Notification from "@/models/Notification";
import Profile from "@/models/Profile";
import Application from "@/models/Application";
import { calculateCompletion } from "@/lib/profile-completion";

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

    // Check if the user has any notifications in the database
    let notifs = await Notification.find({ userId: user._id }).sort({ createdAt: -1 });

    if (notifs.length === 0) {
      // Seed initial realistic notifications for the user
      const profile = await Profile.findOne({ userId: user._id });
      const apps = await Application.find({ userId: user._id }).populate("jobId");
      
      const seedData = [];

      // 1. Welcome notification
      seedData.push({
        userId: user._id,
        title: "Welcome to JobFusion",
        message: "Your AI-powered career journey starts here. Explore over 2.4M+ job openings today!",
        type: "general",
        read: false,
      });

      // 2. Profile completion reminder (if < 100%)
      const completion = calculateCompletion(profile, user);
      if (completion < 100) {
        seedData.push({
          userId: user._id,
          title: "Complete Your Profile",
          message: `Your profile is only ${completion}% complete. Add more details to stand out to hiring recruiters.`,
          type: "reminder",
          read: false,
        });
      }

      // 3. Resume analysis notification (if uploaded)
      if (profile?.resumeUrl) {
        seedData.push({
          userId: user._id,
          title: "Resume Analyzed Successfully",
          message: `Your resume was successfully parsed. Detected domain: ${profile.resumeCategory || "Technology"}.`,
          type: "resume",
          read: false,
        });
      }

      // 4. Application notification (if applied)
      if (apps.length > 0) {
        const firstApp = apps[0];
        const companyName = (firstApp.jobId as any)?.company || "Employer";
        const roleName = (firstApp.jobId as any)?.title || "Role";
        seedData.push({
          userId: user._id,
          title: "Application Status Update",
          message: `Your application for ${roleName} at ${companyName} has been received and is Under Review.`,
          type: "application",
          read: false,
        });
      } else {
        // If they haven't applied to any jobs, add a general search tip
        seedData.push({
          userId: user._id,
          title: "New Matching Jobs Found",
          message: "We found new matches matching your profile domain. Visit the Find Jobs page to view them.",
          type: "match",
          read: false,
        });
      }

      // Insert seeded notifications
      await Notification.insertMany(seedData);

      // Re-fetch sorted notifications
      notifs = await Notification.find({ userId: user._id }).sort({ createdAt: -1 });
    }

    return NextResponse.json({
      success: true,
      data: notifs,
    });
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, readAll } = await req.json();

    if (readAll) {
      await Notification.updateMany({ userId: user._id }, { read: true });
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: id, userId: user._id },
      { read: true },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const deleted = await Notification.findOneAndDelete({ _id: id, userId: user._id });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Notification dismissed successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
