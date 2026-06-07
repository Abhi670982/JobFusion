import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Auth Check
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    console.log(`[Avatar Upload] Starting avatar upload to Cloudinary for user: ${mongoUser._id}`);

    // Stream upload to Cloudinary
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
    console.log(`[Avatar Upload] Uploaded successfully: ${imageUrl}`);

    // Update User model in MongoDB
    await User.findByIdAndUpdate(mongoUser._id, { profileImage: imageUrl });

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error: any) {
    console.error("[Avatar Upload] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
