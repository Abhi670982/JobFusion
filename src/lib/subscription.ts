// ============================================================
// lib/subscription.ts — Subscription Utility Functions
// ============================================================

import type { PlanId, SubscriptionInfo, FeatureGateResult, AIUsageInfo } from '@/types/subscription';
import { prisma } from './prisma';
import { getOrCreateMongoUser } from './auth-sync';
import { startOfMonth } from 'date-fns';

const DEFAULT_FREE_SUBSCRIPTION: SubscriptionInfo = {
  planId: 'free',
  status: 'active',
  interval: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  paymentProvider: null,
  customerId: null,
  providerSubscriptionId: null,
};

/**
 * Get the current user's active subscription and plan.
 */
export async function getCurrentPlan(userId?: string): Promise<SubscriptionInfo> {
  let targetUserId = userId;
  if (!targetUserId) {
    const user = await getOrCreateMongoUser();
    if (!user) return DEFAULT_FREE_SUBSCRIPTION;
    targetUserId = user.id;
  }

  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: targetUserId },
      include: { plan: true },
    });

    if (!sub) {
      return DEFAULT_FREE_SUBSCRIPTION;
    }

    return {
      planId: sub.plan.planId as PlanId,
      status: sub.status as any,
      interval: sub.interval as any,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      paymentProvider: sub.paymentProvider,
      customerId: sub.customerId,
      providerSubscriptionId: sub.providerSubscriptionId,
    };
  } catch (error) {
    console.error("[getCurrentPlan] Error fetching plan from database:", error);
    return DEFAULT_FREE_SUBSCRIPTION;
  }
}

/**
 * Get current subscription info
 */
export async function getCurrentSubscription(userId?: string) {
  const planInfo = await getCurrentPlan(userId);
  const isPro = planInfo.planId === 'pro_monthly' || planInfo.planId === 'pro_yearly';
  const isActive = planInfo.status === 'active' || planInfo.status === 'trialing';

  return {
    plan: planInfo.planId,
    status: planInfo.status,
    expiry: planInfo.currentPeriodEnd,
    billingCycle: planInfo.interval,
    isPro: isPro && isActive,
  };
}

/**
 * Check if the user has an active Pro (or higher) subscription.
 */
export async function hasProAccess(userId?: string): Promise<boolean> {
  const sub = await getCurrentSubscription(userId);
  return sub.isPro;
}

/**
 * Check if the user's subscription is currently active (not expired/cancelled).
 */
export async function isSubscriptionActive(userId?: string): Promise<boolean> {
  const planInfo = await getCurrentPlan(userId);
  return planInfo.status === 'active' || planInfo.status === 'trialing';
}

/**
 * Check if user can use the AI Resume Builder feature.
 * Free: 5/month limit. Pro: Unlimited.
 */
export async function canUseResumeAI(userId?: string): Promise<FeatureGateResult> {
  let targetUserId = userId;
  if (!targetUserId) {
    const user = await getOrCreateMongoUser();
    if (!user) return { allowed: false, reason: 'Authentication required.', planRequired: 'pro_monthly' };
    targetUserId = user.id;
  }

  const isPro = await hasProAccess(targetUserId);
  if (isPro) {
    return { allowed: true };
  }

  // Count parsing logs for the current month
  try {
    const count = await prisma.resumeParsingLog.count({
      where: {
        userId: targetUserId,
        status: "success",
        timestamp: {
          gte: startOfMonth(new Date()),
        },
      },
    });

    if (count < 5) {
      return { allowed: true };
    }
  } catch (error) {
    console.error("[canUseResumeAI] Error counting parsing logs:", error);
  }

  return {
    allowed: false,
    reason: 'AI Resume Builder monthly limit of 5 runs reached on the Free plan. Upgrade to Pro for unlimited access.',
    planRequired: 'pro_monthly',
  };
}

/**
 * Check if user can generate cover letters.
 * Free: Not available. Pro: Unlimited.
 */
export async function canGenerateCoverLetter(userId?: string): Promise<FeatureGateResult> {
  const isPro = await hasProAccess(userId);
  if (isPro) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: 'Cover Letter Generation is a Pro feature.',
    planRequired: 'pro_monthly',
  };
}

/**
 * Check if user can access Interview Preparation.
 * Free: Not available. Pro: Available.
 */
export async function canUseInterviewPrep(userId?: string): Promise<FeatureGateResult> {
  const isPro = await hasProAccess(userId);
  if (isPro) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: 'Interview Preparation is a Pro feature.',
    planRequired: 'pro_monthly',
  };
}

/**
 * Check if user can use Smart Job Matching.
 * Free: Basic matching only. Pro: AI-powered smart matching.
 */
export async function canUseSmartMatch(userId?: string): Promise<FeatureGateResult> {
  const isPro = await hasProAccess(userId);
  if (isPro) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: 'Smart Job Matching is a Pro feature.',
    planRequired: 'pro_monthly',
  };
}

/**
 * Get current AI usage stats for the user.
 */
export async function getAIUsage(userId?: string): Promise<AIUsageInfo> {
  let targetUserId = userId;
  if (!targetUserId) {
    const user = await getOrCreateMongoUser();
    if (!user) return { used: 0, limit: 5, resetAt: null };
    targetUserId = user.id;
  }

  const isPro = await hasProAccess(targetUserId);
  if (isPro) {
    return { used: 0, limit: null, resetAt: null };
  }

  try {
    const count = await prisma.resumeParsingLog.count({
      where: {
        userId: targetUserId,
        status: "success",
        timestamp: {
          gte: startOfMonth(new Date()),
        },
      },
    });

    // Reset date is the start of next month
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      used: count,
      limit: 5,
      resetAt: nextMonth,
    };
  } catch (error) {
    console.error("[getAIUsage] Error calculating usage:", error);
    return { used: 0, limit: 5, resetAt: null };
  }
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
 * Upgrade handler.
 */
export function handleUpgrade(_planId?: PlanId, _interval?: 'monthly' | 'yearly'): void {
  // handoff is managed by routing directly to create-checkout endpoint on client side
}
