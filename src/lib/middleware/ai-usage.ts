import { NextRequest, NextResponse } from "next/server";
import { getOrCreateMongoUser } from "@/lib/auth-sync";
import { usageService } from "@/lib/usageService";
import { getAIConfig, AIProvider, AIProviderConfig } from "@/lib/ai-provider";

/**
 * Middleware to enforce AI usage limits for protected API routes.
 * Used for general limit enforcement without a specific AI provider.
 */
export async function withAIUsageCheck(
  req: NextRequest,
  featureName: string
): Promise<{ allowed: boolean; response?: NextResponse; userId?: string; clerkUserId?: string }> {
  try {
    // Authenticate user
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return {
        allowed: false,
        response: NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        ),
      };
    }

    // Check and increment usage
    const gateResult = await usageService.checkAndIncrement(
      mongoUser.id,
      featureName,
      mongoUser.clerkId || undefined
    );

    if (!gateResult.allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            success: false,
            code: "AI_LIMIT_REACHED",
            message: "Daily AI limit reached.",
          },
          { status: 403 }
        ),
      };
    }

    return {
      allowed: true,
      userId: mongoUser.id,
      clerkUserId: mongoUser.clerkId || undefined,
    };
  } catch (error) {
    console.error("[AI Usage Middleware] Error:", error);
    return {
      allowed: false,
      response: NextResponse.json(
        { success: false, error: "Failed to check AI usage" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Middleware to enforce AI usage limits and resolve the appropriate API key for BYOK.
 * Used for AI-specific routes that need a provider key.
 */
export async function withAIProviderCheck(
  req: NextRequest,
  featureName: string,
  provider: AIProvider = 'gemini'
): Promise<{ allowed: boolean; response?: NextResponse; userId?: string; config?: AIProviderConfig }> {
  try {
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return {
        allowed: false,
        response: NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        ),
      };
    }

    const config = await getAIConfig(
      mongoUser.id, 
      featureName, 
      mongoUser.clerkId || undefined, 
      provider
    );

    if (!config.allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            success: false,
            code: config.code || "AI_LIMIT_REACHED",
            message: config.error || "Daily AI limit reached.",
          },
          { status: 403 }
        ),
      };
    }

    return {
      allowed: true,
      userId: mongoUser.id,
      config,
    };
  } catch (error) {
    console.error("[AI Provider Middleware] Error:", error);
    return {
      allowed: false,
      response: NextResponse.json(
        { success: false, error: "Failed to resolve AI provider config" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Helper to extract userId from request body for authorization checks
 */
export async function validateUserAccess(req: NextRequest): Promise<{ 
  allowed: boolean; 
  userId?: string; 
  response?: NextResponse 
}> {
  try {
    const mongoUser = await getOrCreateMongoUser();
    if (!mongoUser) {
      return {
        allowed: false,
        response: NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        ),
      };
    }

    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (!userId) {
      return {
        allowed: false,
        response: NextResponse.json(
          { success: false, error: "userId is required" },
          { status: 400 }
        ),
      };
    }

    if (userId !== mongoUser._id.toString()) {
      return {
        allowed: false,
        response: NextResponse.json(
          { success: false, error: "Forbidden: You can only access your own data" },
          { status: 403 }
        ),
      };
    }

    return { allowed: true, userId };
  } catch (error) {
    console.error("[User Access Validation] Error:", error);
    return {
      allowed: false,
      response: NextResponse.json(
        { success: false, error: "Failed to validate user access" },
        { status: 500 }
      ),
    };
  }
}
