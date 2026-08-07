import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";

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
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const pgUser = await prisma.user.findUnique({
      where: { id: mongoUser.id }
    });

    return NextResponse.json({
      success: true,
      user: mapUser(pgUser || mongoUser),
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to fetch user details");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { fullName, email, profileImage } = body;
    
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const updatedPgUser = await prisma.user.update({
      where: { id: mongoUser.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      user: mapUser(updatedPgUser),
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to update user details");
  }
}