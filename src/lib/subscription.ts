// ============================================================
// lib/subscription.ts — Subscription Utility Functions
// ============================================================
// Currently returns mocked data.
// When Dodo Payments is integrated, replace the mock returns
// with real DB queries and Dodo API calls.
// ============================================================

import type { PlanId, SubscriptionInfo, FeatureGateResult, AIUsageInfo } from '@/types/subscription';

// ── Mock data ── ────────────────────────────────────────────
// Replace this with a real DB query (prisma.subscription.findUnique)
// once the Dodo integration is complete.
const MOCK_SUBSCRIPTION: SubscriptionInfo = {
  planId: 'free',
  status: 'active',
  interval: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  paymentProvider: null,
  customerId: null,
  providerSubscriptionId: null,
};

// ────────────────────────────────────────────────────────────

/**
 * Get the current user's active subscription and plan.
 * 
 * TODO (Dodo Integration): Replace mock with:
 *   const sub = await prisma.subscription.findUnique({ where: { userId }, include: { plan: true } });
 *   return sub ?? defaultFreeSubscription;
 */
export async function getCurrentPlan(_userId?: string): Promise<SubscriptionInfo> {
  // MOCK — always returns Free plan
  return MOCK_SUBSCRIPTION;
}

/**
 * Check if the user has an active Pro (or higher) subscription.
 * 
 * TODO (Dodo Integration): Replace mock with a real DB check.
 */
export async function hasProAccess(_userId?: string): Promise<boolean> {
  // MOCK — always returns false (free tier)
  return false;
}

/**
 * Check if the user's subscription is currently active (not expired/cancelled).
 * 
 * TODO (Dodo Integration): Check subscription.status and currentPeriodEnd.
 */
export async function isSubscriptionActive(_userId?: string): Promise<boolean> {
  // MOCK — free plan is always "active"
  return true;
}

/**
 * Check if user can use the AI Resume Builder feature.
 * Free: 5/month limit. Pro: Unlimited.
 * 
 * TODO (Dodo Integration): Track usage in DB and check against plan limits.
 */
export async function canUseResumeAI(_userId?: string): Promise<FeatureGateResult> {
  // MOCK — always limited (free tier)
  return {
    allowed: false,
    reason: 'AI Resume Builder is a Pro feature.',
    planRequired: 'pro_monthly',
  };
}

/**
 * Check if user can generate cover letters.
 * Free: Not available. Pro: Unlimited.
 * 
 * TODO (Dodo Integration): Check user's plan from DB.
 */
export async function canGenerateCoverLetter(_userId?: string): Promise<FeatureGateResult> {
  // MOCK — blocked for free tier
  return {
    allowed: false,
    reason: 'Cover Letter Generation is a Pro feature.',
    planRequired: 'pro_monthly',
  };
}

/**
 * Check if user can access Interview Preparation.
 * Free: Not available. Pro: Available.
 * 
 * TODO (Dodo Integration): Check user's plan from DB.
 */
export async function canUseInterviewPrep(_userId?: string): Promise<FeatureGateResult> {
  // MOCK — blocked for free tier
  return {
    allowed: false,
    reason: 'Interview Preparation is a Pro feature.',
    planRequired: 'pro_monthly',
  };
}

/**
 * Check if user can use Smart Job Matching.
 * Free: Basic matching only. Pro: AI-powered smart matching.
 * 
 * TODO (Dodo Integration): Check user's plan from DB.
 */
export async function canUseSmartMatch(_userId?: string): Promise<FeatureGateResult> {
  // MOCK — blocked for free tier
  return {
    allowed: false,
    reason: 'Smart Job Matching is a Pro feature.',
    planRequired: 'pro_monthly',
  };
}

/**
 * Get current AI usage stats for the user.
 * 
 * TODO (Dodo Integration): Track real usage in DB.
 */
export async function getAIUsage(_userId?: string): Promise<AIUsageInfo> {
  // MOCK — shows 3/5 used on free plan
  return {
    used: 3,
    limit: 5,
    resetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  };
}

/**
 * Get the plan display name from a planId.
 */
export function getPlanDisplayName(planId: PlanId): string {
  const names: Record<PlanId, string> = {
    free: 'Free',
    pro_monthly: 'Pro (Monthly)',
    pro_yearly: 'Pro (Yearly)',
    recruiter: 'Recruiter',
  };
  return names[planId] ?? 'Free';
}

/**
 * Get a human-readable status string.
 */
export function getStatusLabel(status: SubscriptionInfo['status']): string {
  const labels: Record<SubscriptionInfo['status'], string> = {
    active: 'Active',
    cancelled: 'Cancelled',
    expired: 'Expired',
    trialing: 'Trial',
  };
  return labels[status] ?? 'Unknown';
}

/**
 * Placeholder upgrade handler.
 * 
 * TODO (Dodo Integration): Replace with Dodo checkout session creation.
 * Example: const session = await dodo.createCheckoutSession({ productId, customerId });
 *          window.location.href = session.url;
 */
export function handleUpgrade(_planId?: PlanId, _interval?: 'monthly' | 'yearly'): void {
  // PLACEHOLDER — Dodo Payments integration will be added here
  // This function is intentionally empty.
  // The UI components call this and show a toast notification.
}
