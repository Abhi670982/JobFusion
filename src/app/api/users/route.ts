import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import User from "@/models/User";

export const dynamic = "force-dynamic";


export async function GET() {
  console.log("[API] GET /api/users - Hit");
  try {
    await connectDB();
    console.log("[API] GET /api/users - Database connected");

    const user = await getOrCreateMongoUser();
    if (!user) {
      console.warn("[API] GET /api/users - Unauthorized: No user session matched");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`[API] GET /api/users - Success: User found (ID: ${user._id})`);
    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("[API] GET /api/users - Internal Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  console.log("[API] PUT /api/users - Hit");
  try {
    await connectDB();
    console.log("[API] PUT /api/users - Database connected");

    const user = await getOrCreateMongoUser();
    if (!user) {
      console.warn("[API] PUT /api/users - Unauthorized");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log(`[API] PUT /api/users - Received body for user ${user._id}:`, JSON.stringify(body));
    
    // Only allow updating allowed user fields
    const { fullName, email, profileImage, role } = body;
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (role !== undefined) updateData.role = role;

    console.log(`[API] PUT /api/users - Updating user ${user._id} fields:`, JSON.stringify(updateData));
    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      console.error(`[API] PUT /api/users - User document not found for ID: ${user._id}`);
      return NextResponse.json(
        { success: false, error: "User not found to update" },
        { status: 404 }
      );
    }

    console.log(`[API] PUT /api/users - Success: Updated user ${user._id}`);
    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("[API] PUT /api/users - Internal Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}