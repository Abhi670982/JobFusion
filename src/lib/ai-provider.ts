import { usageService } from "./usageService";

export type AIProvider = 'gemini' | 'openai' | 'claude';

export interface AIProviderConfig {
  allowed: boolean;
  provider?: AIProvider;
  key?: string;
  error?: string;
  code?: string;
}

/**
 * Core AI Provider Layer.
 * Exclusively uses Gohyred's internal AI provider and subscription-based access.
 */
export async function getAIConfig(
  userId: string,
  featureName: string,
  clerkUserId?: string,
  defaultProvider: AIProvider = 'gemini'
): Promise<AIProviderConfig> {
  // Check Subscription & Daily Limits via Usage Service
  const gateResult = await usageService.checkAndIncrement(userId, featureName, clerkUserId);
  
  if (!gateResult.allowed) {
    console.log(`[AI Request] Feature: ${featureName} | Limit Reached | Reason: ${gateResult.message}`);
    return {
      allowed: false,
      error: gateResult.message || 'Daily AI limit reached.',
      code: gateResult.code || 'AI_LIMIT_REACHED'
    };
  }

  // Determine Gohyred Platform Key
  let platformKey = '';
  if (defaultProvider === 'openai') {
    platformKey = process.env.OPENAI_API_KEY || '';
  } else if (defaultProvider === 'gemini') {
    platformKey = process.env.GEMINI_API_KEY || '';
  } else if (defaultProvider === 'claude') {
    platformKey = process.env.ANTHROPIC_API_KEY || '';
  }

  if (!platformKey) {
    platformKey = process.env.GEMINI_API_KEY || '';
  }

  const reason = gateResult.message === 'Unlimited access (Pro/Admin)' ? 'Pro' : 'Free Credits';
  console.log(`[AI Request] Feature: ${featureName} | Provider Selected: ${defaultProvider} (Gohyred Internal) | Reason: ${reason}`);

  return {
    allowed: true,
    provider: defaultProvider,
    key: platformKey
  };
}

