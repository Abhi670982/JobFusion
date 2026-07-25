import { NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";
import { getCurrentSubscription, getAIUsage } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [subscription, usage, userApiKey] = await Promise.all([
      getCurrentSubscription(user.id),
      getAIUsage(user.id),
      prisma.userApiKey.findUnique({ where: { userId: user.id } })
    ]);

    let mode = "free";
    if (subscription.isPro) mode = "pro";

    const connectedProviders = {
      openai: !!userApiKey?.openaiKey,
      gemini: !!userApiKey?.geminiKey,
      claude: !!userApiKey?.claudeKey
    };

    let isBYOK = false;
    let activeProvider = null;

    if (connectedProviders.openai) {
      isBYOK = true;
      activeProvider = "openai";
      mode = "byok";
    } else if (connectedProviders.gemini) {
      isBYOK = true;
      activeProvider = "gemini";
      mode = "byok";
    } else if (connectedProviders.claude) {
      isBYOK = true;
      activeProvider = "claude";
      mode = "byok";
    } else {
      activeProvider = "gemini"; // JobFusion default
    }

    return NextResponse.json({
      success: true,
      data: {
        mode,
        provider: activeProvider,
        isBYOK,
        usage,
        connectedProviders
      }
    });
  } catch (error: any) {
    console.error("Error fetching AI provider config:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
