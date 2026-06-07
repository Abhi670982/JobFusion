import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import User from "@/models/User";

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

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
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

    const body = await req.json();
    
    // Only allow updating allowed user fields
    const { fullName, email, profileImage, role } = body;
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (role !== undefined) updateData.role = role;

    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}