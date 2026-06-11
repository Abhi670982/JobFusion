import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import Profile from "@/models/Profile";
import User from "@/models/User";

export const dynamic = "force-dynamic";


// 1. POST - Create a Profile (Normally handled by auto-sync, but kept secure)
export async function POST(req: NextRequest) {
  console.log("[API] POST /api/profile - Hit");
  try {
    await connectDB();
    console.log("[API] POST /api/profile - Database connected");

    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      console.warn("[API] POST /api/profile - Unauthorized");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { headline, bio, skills, location, experience, resumeUrl } = body;
    console.log(`[API] POST /api/profile - Creating profile for user ${mongoUser._id}`);

    // Check if profile already exists for this user
    let profile = await Profile.findOne({ userId: mongoUser._id });
    if (profile) {
      console.warn(`[API] POST /api/profile - Profile already exists for user ${mongoUser._id}`);
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

    console.log(`[API] POST /api/profile - Success: Profile created (ID: ${profile._id})`);
    return NextResponse.json(
      { success: true, data: profile },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API] POST /api/profile - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 2. GET - Read Profile of current authenticated user
export async function GET(req: NextRequest) {
  console.log("[API] GET /api/profile - Hit");
  try {
    await connectDB();
    console.log("[API] GET /api/profile - Database connected");

    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      console.warn("[API] GET /api/profile - Unauthorized");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    console.log(`[API] GET /api/profile - Requested userId query: ${userId}, mongoUser._id: ${mongoUser._id}`);

    // Enforce "Users can only access their own profile"
    if (userId && userId !== mongoUser._id.toString()) {
      console.warn(`[API] GET /api/profile - Forbidden: requested userId ${userId} does not match auth user ${mongoUser._id}`);
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only access your own profile" },
        { status: 403 }
      );
    }

    let profile = await Profile.findOne({ userId: mongoUser._id }).populate("userId");
    if (!profile) {
      console.warn(`[API] GET /api/profile - Profile document missing for user ${mongoUser._id}. Creating dynamically...`);
      profile = await Profile.create({
        userId: mongoUser._id,
        skills: [],
        experiences: [],
        education: [],
        certifications: [],
        projects: [],
        headline: "",
        bio: "",
        location: "",
        experience: "",
        resumeUrl: "",
        resumeName: "",
        resumeText: "",
        phone: "",
        portfolioUrl: "",
        githubUrl: "",
        linkedinUrl: "",
      });
      // Populate the newly created profile
      profile = await Profile.findOne({ userId: mongoUser._id }).populate("userId");
    }

    console.log(`[API] GET /api/profile - Success: Profile found/created for user ${mongoUser._id}`);
    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    console.error("[API] GET /api/profile - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 3. PUT - Update Profile & User details
export async function PUT(req: NextRequest) {
  console.log("[API] PUT /api/profile - Hit");
  try {
    await connectDB();
    console.log("[API] PUT /api/profile - Database connected");

    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      console.warn("[API] PUT /api/profile - Unauthorized");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || body.userId;
    console.log(`[API] PUT /api/profile - Request body fields:`, Object.keys(body));

    // Enforce "Users can only edit their own data"
    if (userId && userId !== mongoUser._id.toString()) {
      console.warn(`[API] PUT /api/profile - Forbidden: requested userId ${userId} does not match auth user ${mongoUser._id}`);
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
      console.log(`[API] PUT /api/profile - Updating User model:`, JSON.stringify(userUpdateFields));
      await User.findByIdAndUpdate(mongoUser._id, userUpdateFields, {
        runValidators: true,
      });
    }

    // Exclude protected/immutable fields from profile update
    const { _id, userId: uId, fullName, email, profileImage, role, ...profileUpdateData } = body;
    console.log(`[API] PUT /api/profile - Updating Profile model for user ${mongoUser._id}`);

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: mongoUser._id },
      profileUpdateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("userId");

    if (!updatedProfile) {
      console.error(`[API] PUT /api/profile - Profile not found to update for user ${mongoUser._id}`);
      return NextResponse.json(
        { success: false, error: "Profile not found to update" },
        { status: 404 }
      );
    }

    console.log(`[API] PUT /api/profile - Success: Updated profile for user ${mongoUser._id}`);
    return NextResponse.json({ success: true, data: updatedProfile });
  } catch (error: any) {
    console.error("[API] PUT /api/profile - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

// 4. DELETE - Delete User & Profile
export async function DELETE(req: NextRequest) {
  console.log("[API] DELETE /api/profile - Hit");
  try {
    await connectDB();
    console.log("[API] DELETE /api/profile - Database connected");

    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      console.warn("[API] DELETE /api/profile - Unauthorized");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Enforce "Users can only edit/delete their own data"
    if (userId && userId !== mongoUser._id.toString()) {
      console.warn(`[API] DELETE /api/profile - Forbidden: requested userId ${userId} does not match auth user ${mongoUser._id}`);
      return NextResponse.json(
        { success: false, error: "Forbidden: You can only delete your own account" },
        { status: 403 }
      );
    }

    console.log(`[API] DELETE /api/profile - Deleting User and Profile for user ${mongoUser._id}`);
    await Profile.findOneAndDelete({ userId: mongoUser._id });
    await User.findByIdAndDelete(mongoUser._id);

    console.log(`[API] DELETE /api/profile - Success: Account deleted for user ${mongoUser._id}`);
    return NextResponse.json({
      success: true,
      message: "Profile and User account deleted successfully",
    });
  } catch (error: any) {
    console.error("[API] DELETE /api/profile - Internal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
