import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import Profile from "@/models/Profile";
import User from "@/models/User";

export const dynamic = "force-dynamic";


// 1. POST - Create a Profile (Normally handled by auto-sync, but kept secure)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { headline, bio, skills, location, experience, resumeUrl } = body;

    // Check if profile already exists for this user
    let profile = await Profile.findOne({ userId: mongoUser._id });
    if (profile) {
      return NextResponse.json(
        { success: false, error: "Profile already exists for this user. Use PUT to update." },
        { status: 409 }
      );
    }

    profile = await Profile.create({
      userId: mongoUser._id,
      headline,
      bio,
      skills: Array.isArray(skills) ? skills : [],
      location,
      experience,
      resumeUrl,
    });

    return NextResponse.json(
      { success: true, data: profile },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 2. GET - Read Profile of current authenticated user
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Enforce "Users can only access their own profile"
    if (userId && userId !== mongoUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only access your own profile" },
        { status: 403 }
      );
    }

    const profile = await Profile.findOne({ userId: mongoUser._id }).populate("userId");
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    console.error("Error in GET /api/profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 3. PUT - Update Profile & User details
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || body.userId;

    // Enforce "Users can only edit their own data"
    if (userId && userId !== mongoUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only edit your own profile" },
        { status: 403 }
      );
    }

    // Update User model fields if they are present in the request
    const userUpdateFields: any = {};
    if (body.fullName !== undefined) userUpdateFields.fullName = body.fullName;
    if (body.email !== undefined) userUpdateFields.email = body.email;
    if (body.profileImage !== undefined) userUpdateFields.profileImage = body.profileImage;
    if (body.role !== undefined) userUpdateFields.role = body.role;

    if (Object.keys(userUpdateFields).length > 0) {
      await User.findByIdAndUpdate(mongoUser._id, userUpdateFields, {
        runValidators: true,
      });
    }

    // Exclude protected/immutable fields from profile update
    const { _id, userId: uId, fullName, email, profileImage, role, ...profileUpdateData } = body;

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: mongoUser._id },
      profileUpdateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("userId");

    if (!updatedProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found to update" },
        { status: 404 }
      );
    }

    // Trigger background scraper sync if skills were updated
    if (body.skills && Array.isArray(body.skills)) {
      const newSkillNames = body.skills.map((s: any) => (typeof s === "string" ? s : s.name || "").toLowerCase()).filter(Boolean);
      if (newSkillNames.length > 0) {
        console.log(`[Profile API] Triggering background scraper sync for manually updated skills:`, newSkillNames);
        Promise.resolve().then(async () => {
          const { runSourceSync } = require("@/lib/pipeline");
          const sources = ["linkedin", "indeed", "wellfound", "internshala"];
          
          for (const source of sources) {
            try {
              console.log(`[Profile API Background] Syncing ${source} for skills:`, newSkillNames);
              await runSourceSync(source, newSkillNames);
            } catch (err: any) {
              console.error(`[Profile API Background] Sync failed for ${source}:`, err.message);
            }
          }
          console.log("[Profile API Background] Sync complete.");
        });
      }
    }

    return NextResponse.json({ success: true, data: updatedProfile });
  } catch (error: any) {
    console.error("Error in PUT /api/profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 4. DELETE - Delete User & Profile
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Enforce "Users can only edit/delete their own data"
    if (userId && userId !== mongoUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only delete your own account" },
        { status: 403 }
      );
    }

    await Profile.findOneAndDelete({ userId: mongoUser._id });
    await User.findByIdAndDelete(mongoUser._id);

    return NextResponse.json({
      success: true,
      message: "Profile and User account deleted successfully",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
