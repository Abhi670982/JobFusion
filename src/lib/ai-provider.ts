import { prisma } from "./prisma";
import { decryptApiKey } from "./encryption";
import { usageService } from "./usageService";

export type AIProvider = 'openai' | 'gemini' | 'claude';

export interface AIProviderConfig {
  allowed: boolean;
  provider?: AIProvider;
  key?: string;
  isBYOK?: boolean;
  error?: string;
  code?: string;
}

/**
 * Core Provider Abstraction Layer.
 * Evaluates whether a user can perform an AI action, and which API key they should use.
 * 
 * Flow:
 * 1. Check if user has a configured BYOK (Gemini, OpenAI, or Claude).
 *    -> YES: Return decrypted user key and the specific provider (Unlimited Usage).
 * 2. Check if user has Pro subscription.
 *    -> YES: Return JobFusion platform Gemini key (Unlimited Usage).
 * 3. Check Free user's daily credit limit.
 *    -> CREDITS AVAILABLE: Return JobFusion platform Gemini key (Consumes 1 credit).
 *    -> NO CREDITS: Return error AI_LIMIT_REACHED.
 */
export async function getAIConfig(
  userId: string,
  featureName: string,
  clerkUserId?: string,
  defaultProvider: AIProvider = 'gemini'
): Promise<AIProviderConfig> {
  // 1. Check BYOK (Bring Your Own Key)
  const userApiKey = await prisma.userApiKey.findUnique({
    where: { userId }
  });

  if (userApiKey) {
    let encryptedKey: string | null = null;
    let selectedProvider: AIProvider | null = null;
    
    // Priority: OpenAI > Gemini > Claude (or whatever is found first)
    if (userApiKey.openaiKey) {
      encryptedKey = userApiKey.openaiKey;
      selectedProvider = 'openai';
    } else if (userApiKey.geminiKey) {
      encryptedKey = userApiKey.geminiKey;
      selectedProvider = 'gemini';
    } else if (userApiKey.claudeKey) {
      encryptedKey = userApiKey.claudeKey;
      selectedProvider = 'claude';
    }

    if (encryptedKey && selectedProvider) {
      try {
        const decryptedKey = decryptApiKey(encryptedKey);
        
        console.log(`[AI Request] Feature: ${featureName} | Provider Selected: ${selectedProvider} (User) | Reason: BYOK`);
        
        return {
          allowed: true,
          provider: selectedProvider,
          key: decryptedKey,
          isBYOK: true
        };
      } catch {
        console.error(`[AI Provider] Failed to decrypt ${selectedProvider} key for user ${userId}`);
        // Fallthrough to standard logic if BYOK key is broken
      }
    }
  }

  // 2 & 3. Check Subscription & Daily Limits via Usage Service
  const gateResult = await usageService.checkAndIncrement(userId, featureName, clerkUserId);
  
  if (!gateResult.allowed) {
    console.log(`[AI Request] Feature: ${featureName} | Limit Reached | Reason: ${gateResult.message}`);
    return {
      allowed: false,
      error: gateResult.message || 'Daily AI limit reached.',
      code: gateResult.code || 'AI_LIMIT_REACHED'
    };
  }

  // Determine JobFusion Platform Key
  let platformKey = '';
  if (defaultProvider === 'openai') {
    platformKey = process.env.OPENAI_API_KEY || '';
  } else if (defaultProvider === 'gemini') {
    platformKey = process.env.GEMINI_API_KEY || '';
  } else if (defaultProvider === 'claude') {
    platformKey = process.env.ANTHROPIC_API_KEY || '';
  }

  if (!platformKey) {
    console.warn(`[AI Provider] Missing environment variable for ${defaultProvider} API Key!`);
  }

  const reason = gateResult.message === 'Unlimited access (Pro/Admin)' ? 'Pro' : 'Free Credits';
  console.log(`[AI Request] Feature: ${featureName} | Provider Selected: ${defaultProvider} (JobFusion) | Reason: ${reason}`);

  return {
    allowed: true,
    provider: defaultProvider,
    key: platformKey,
    isBYOK: false
  };
}
