import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      success: true,
      message: "MongoDB Connected Successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to connect to MongoDB" },
      { status: 500 }
    );
  }
}