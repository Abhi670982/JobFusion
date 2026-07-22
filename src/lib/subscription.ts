// ============================================================
// lib/subscription.ts — Subscription Utility Functions
// ============================================================

import type { PlanId, SubscriptionInfo, FeatureGateResult, AIUsageInfo } from '@/types/subscription';
import { prisma } from './prisma';
import { getOrCreateMongoUser } from './auth-sync';
import { usageService } from './usageService';

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
 * Free: 2/day limit. Pro: Unlimited.
 */
export async function canUseResumeAI(userId?: string): Promise<FeatureGateResult> {
  let targetUserId = userId;
  if (!targetUserId) {
    const user = await getOrCreateMongoUser();
    if (!user) return { allowed: false, reason: 'Authentication required.', planRequired: 'pro_monthly' };
    targetUserId = user.id;
  }

  const check = await usageService.canUseAI(targetUserId, 'resume-review');
  if (check.allowed) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Daily AI limit reached for Resume Review. Upgrade to Pro for unlimited access.',
    planRequired: 'pro_monthly',
  };
}

/**
 * Check if user can generate cover letters.
 * Free: 2/day limit. Pro: Unlimited.
 */
export async function canGenerateCoverLetter(userId?: string): Promise<FeatureGateResult> {
  let targetUserId = userId;
  if (!targetUserId) {
    const user = await getOrCreateMongoUser();
    if (!user) return { allowed: false, reason: 'Authentication required.', planRequired: 'pro_monthly' };
    targetUserId = user.id;
  }

  const check = await usageService.canUseAI(targetUserId, 'cover-letter');
  if (check.allowed) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Daily AI limit reached for Cover Letter. Upgrade to Pro for unlimited access.',
    planRequired: 'pro_monthly',
  };
}

/**
 * Check if user can access Interview Preparation.
 * Free: 2/day limit. Pro: Available.
 */
export async function canUseInterviewPrep(userId?: string): Promise<FeatureGateResult> {
  let targetUserId = userId;
  if (!targetUserId) {
    const user = await getOrCreateMongoUser();
    if (!user) return { allowed: false, reason: 'Authentication required.', planRequired: 'pro_monthly' };
    targetUserId = user.id;
  }

  const check = await usageService.canUseAI(targetUserId, 'interview-prep');
  if (check.allowed) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Daily AI limit reached for Interview Prep. Upgrade to Pro for unlimited access.',
    planRequired: 'pro_monthly',
  };
}

/**
 * Check if user can use Smart Job Matching.
 * Free: 2/day limit. Pro: AI-powered smart matching.
 */
export async function canUseSmartMatch(userId?: string): Promise<FeatureGateResult> {
  let targetUserId = userId;
  if (!targetUserId) {
    const user = await getOrCreateMongoUser();
    if (!user) return { allowed: false, reason: 'Authentication required.', planRequired: 'pro_monthly' };
    targetUserId = user.id;
  }

  const check = await usageService.canUseAI(targetUserId, 'job-match');
  if (check.allowed) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Daily AI limit reached for Smart Job Matching. Upgrade to Pro for unlimited access.',
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
    if (!user) return { used: 0, limit: 2, resetAt: null };
    targetUserId = user.id;
  }

  const isPro = await hasProAccess(targetUserId);
  if (isPro) {
    return { used: 0, limit: null, resetAt: null };
  }

  try {
    // Get the maximum usage across the main AI features or the primary one (resume-review)
    const used = await usageService.getTodayUsage(targetUserId, 'resume-review');
    
    // Reset date is tomorrow at 00:00:00 local time
    const resetAt = new Date();
    resetAt.setHours(23, 59, 59, 999);

    return {
      used,
      limit: 2,
      resetAt,
    };
  } catch (error) {
    console.error("[getAIUsage] Error calculating usage:", error);
    return { used: 0, limit: 2, resetAt: null };
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleUpgrade(_planId?: PlanId, _interval?: 'monthly' | 'yearly'): void {
  // handoff is managed by routing directly to create-checkout endpoint on client side
}
