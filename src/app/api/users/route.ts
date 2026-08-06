import { NextRequest, NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function mapUser(u: any) {
  if (!u) return null;
  return {
    _id: u.id,
    clerkId: u.clerkId,
    email: u.email,
    fullName: u.fullName,
    profileImage: u.profileImage,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  };
}

export async function GET() {
  try {
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pgUser = await prisma.user.findUnique({
      where: { id: mongoUser._id.toString() }
    });

    return NextResponse.json({
      success: true,
      user: mapUser(pgUser),
    });
  } catch (error: any) {
    console.error("Error in GET /api/users:", error);
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
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fullName, email, profileImage } = body;
    
    const updateData: any = {};
    if (fullName !== undefined) {
      const trimmedName = String(fullName).trim().replace(/\s+/g, ' ');
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Full name must be between 2 and 100 characters' },
          { status: 400 }
        );
      }
      updateData.fullName = trimmedName;
    }
    if (email !== undefined) {
      const trimmedEmail = String(email).trim();
      if (trimmedEmail.length > 254) {
        return NextResponse.json(
          { success: false, error: 'Email address cannot exceed 254 characters' },
          { status: 400 }
        );
      }
      updateData.email = trimmedEmail;
    }
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    // Update in PostgreSQL
    const updatedPgUser = await prisma.user.update({
      where: { id: mongoUser._id.toString() },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      user: mapUser(updatedPgUser),
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