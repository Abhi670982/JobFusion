import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user: mongoUser, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cloudinaryResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "jobfusion-avatars",
            resource_type: "image",
            transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face" }],
          },
          (error, result) => {
            if (error) {
              console.error("[Avatar Upload] Cloudinary error:", error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    const imageUrl = cloudinaryResult.secure_url;

    await prisma.user.update({
      where: { id: mongoUser.id },
      data: { profileImage: imageUrl }
    });

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to upload avatar");
  }
}
