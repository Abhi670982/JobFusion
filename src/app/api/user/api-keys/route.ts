import { NextRequest, NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";
import { encryptApiKey } from "@/lib/encryption";

export const dynamic = "force-dynamic";

// GET - Retrieve user's API keys
export async function GET() {
  try {
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userApiKey = await prisma.userApiKey.findUnique({
      where: { userId: mongoUser.id },
    });

    if (!userApiKey) {
      return NextResponse.json({ success: true, data: null });
    }

    // Return keys without decrypting (for security)
    // Only return whether keys exist, not the actual values
    return NextResponse.json({
      success: true,
      data: {
        hasOpenAIKey: !!userApiKey.openaiKey,
        hasGeminiKey: !!userApiKey.geminiKey,
        hasClaudeKey: !!userApiKey.claudeKey,
      },
    });
  } catch (error: any) {
    console.error("[API Keys GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve API keys" },
      { status: 500 }
    );
  }
}

// POST - Save/update user's API keys
export async function POST(req: NextRequest) {
  try {
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { openaiKey, geminiKey, claudeKey } = body;

    // Encrypt keys before storage
    const encryptedData: any = {};
    if (openaiKey && openaiKey.trim()) {
      encryptedData.openaiKey = encryptApiKey(openaiKey.trim());
    }
    if (geminiKey && geminiKey.trim()) {
      encryptedData.geminiKey = encryptApiKey(geminiKey.trim());
    }
    if (claudeKey && claudeKey.trim()) {
      encryptedData.claudeKey = encryptApiKey(claudeKey.trim());
    }

    // Upsert user API keys
    await prisma.userApiKey.upsert({
      where: { userId: mongoUser.id },
      update: encryptedData,
      create: {
        userId: mongoUser.id,
        ...encryptedData,
      },
    });

    return NextResponse.json({ success: true, message: "API keys saved successfully" });
  } catch (error: any) {
    console.error("[API Keys POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save API keys" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user's API keys
export async function DELETE(req: NextRequest) {
  try {
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (provider) {
      // Delete specific key
      const updateData: any = {};
      if (provider === 'openai') updateData.openaiKey = null;
      if (provider === 'gemini') updateData.geminiKey = null;
      if (provider === 'claude') updateData.claudeKey = null;

      await prisma.userApiKey.update({
        where: { userId: mongoUser.id },
        data: updateData,
      }).catch(() => {});
    } else {
      // Delete all keys
      await prisma.userApiKey.delete({
        where: { userId: mongoUser.id },
      }).catch(() => {
        // Ignore if not found
      });
    }

    return NextResponse.json({ success: true, message: "API key(s) deleted successfully" });
  } catch (error: any) {
    console.error("[API Keys DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete API keys" },
      { status: 500 }
    );
  }
}
