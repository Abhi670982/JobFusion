import { prisma } from './prisma';
import { getCurrentSubscription } from './subscription';

/**
 * Service to manage and enforce AI usage limits.
 */
export const usageService = {
  /**
   * Get the current date formatted as YYYY-MM-DD in local time
   */
  getTodayDateString(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  /**
   * Get the usage count for a user for a specific feature on the current calendar day
   */
  async getTodayUsage(userId: string, featureName: string): Promise<number> {
    const todayStr = this.getTodayDateString();
    const record = await prisma.userUsage.findUnique({
      where: {
        userId_featureName_usageDate: {
          userId,
          featureName,
          usageDate: todayStr,
        },
      },
    });
    return record?.usageCount ?? 0;
  },

  /**
   * Increment the usage count for a user for a specific feature on the current calendar day
   */
  async incrementUsage(userId: string, featureName: string, clerkUserId?: string): Promise<void> {
    const todayStr = this.getTodayDateString();
    await prisma.userUsage.upsert({
      where: {
        userId_featureName_usageDate: {
          userId,
          featureName,
          usageDate: todayStr,
        },
      },
      update: {
        usageCount: {
          increment: 1,
        },
      },
      create: {
        userId,
        clerkUserId: clerkUserId || null,
        featureName,
        usageDate: todayStr,
        usageCount: 1,
      },
    });
  },

  /**
   * Check if a user can use a specific AI feature.
   * If they are Pro, always allowed.
   * If Free, allowed if today's usage < 2.
   */
  async canUseAI(userId: string, featureName: string): Promise<{ allowed: boolean; used: number; limit: number | null }> {
    const sub = await getCurrentSubscription(userId);
    if (sub.isPro) {
      return { allowed: true, used: 0, limit: null };
    }

    const todayUsage = await this.getTodayUsage(userId, featureName);
    const limit = 2; // 2 requests per calendar day for Free users

    if (todayUsage < limit) {
      return { allowed: true, used: todayUsage, limit };
    }

    return { allowed: false, used: todayUsage, limit };
  },

  /**
   * Check and increment the usage of an AI feature in a single workflow.
   * If user is Pro, continues.
   * If Free and today's usage < 2, increments and continues.
   * Otherwise returns allowed: false with AI_LIMIT_REACHED code.
   */
  async checkAndIncrement(userId: string, featureName: string, clerkUserId?: string): Promise<{ allowed: boolean; code?: string; message?: string }> {
    const check = await this.canUseAI(userId, featureName);
    if (!check.allowed) {
      return {
        allowed: false,
        code: 'AI_LIMIT_REACHED',
        message: 'Daily AI limit reached.',
      };
    }

    if (check.limit !== null) {
      await this.incrementUsage(userId, featureName, clerkUserId);
    }

    return { allowed: true };
  }
};
