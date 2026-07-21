import { prisma } from "@/lib/prisma";
import { SubscriptionStatus, BillingInterval, PlanId } from "@prisma/client";

// Map Dodo Payments Product ID to database PlanId enum
export function getPlanIdFromProductId(productId: string): PlanId {
  const monthlyId = process.env.DODO_MONTHLY_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_MONTHLY_PRODUCT_ID;
  const yearlyId = process.env.DODO_YEARLY_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_YEARLY_PRODUCT_ID;

  if (productId === monthlyId) {
    return PlanId.pro_monthly;
  }
  if (productId === yearlyId) {
    return PlanId.pro_yearly;
  }
  return PlanId.free;
}

// Map Dodo status to Prisma SubscriptionStatus
export function mapDodoStatus(dodoStatus: string): SubscriptionStatus {
  switch (dodoStatus.toLowerCase()) {
    case "active":
      return SubscriptionStatus.active;
    case "trialing":
      return SubscriptionStatus.trialing;
    case "cancelled":
      return SubscriptionStatus.cancelled;
    case "paused":
    case "past_due":
      return SubscriptionStatus.cancelled;
    default:
      return SubscriptionStatus.expired;
  }
}

// Map Dodo interval to Prisma BillingInterval
export function mapDodoInterval(interval: string | null): BillingInterval | null {
  if (!interval) return null;
  const normalized = interval.toLowerCase();
  if (normalized.includes("month")) {
    return BillingInterval.monthly;
  }
  if (normalized.includes("year")) {
    return BillingInterval.yearly;
  }
  return null;
}

// Seed plans dynamically if they are missing
export async function ensurePlansExist() {
  const planIds: PlanId[] = [PlanId.free, PlanId.pro_monthly, PlanId.pro_yearly, PlanId.recruiter];

  for (const pid of planIds) {
    let name = "Free";
    let price = 0;
    let interval: BillingInterval | null = null;
    let features: string[] = [];

    if (pid === PlanId.pro_monthly) {
      name = "Pro Monthly";
      price = 29900; // in paise
      interval = BillingInterval.monthly;
      features = ["AI Resume Builder", "Smart Matching", "Interview Prep"];
    } else if (pid === PlanId.pro_yearly) {
      name = "Pro Yearly";
      price = 299900; // in paise
      interval = BillingInterval.yearly;
      features = ["AI Resume Builder", "Smart Matching", "Interview Prep"];
    } else if (pid === PlanId.recruiter) {
      name = "Recruiter Plan";
      price = 0;
      features = ["Enterprise Features", "Dedicated Manager"];
    }

    await prisma.plan.upsert({
      where: { planId: pid },
      update: {
        name,
        price,
        interval,
        features,
      },
      create: {
        planId: pid,
        name,
        price,
        interval,
        features,
      },
    });
  }
}

export interface SyncSubscriptionPayload {
  clerkUserId?: string | null;
  email?: string | null;
  dodoCustomerId: string;
  dodoSubscriptionId: string;
  checkoutSessionId?: string | null;
  productId: string;
  status: string;
  billingInterval: string | null;
  currentPeriodStart?: string | Date | null;
  currentPeriodEnd?: string | Date | null;
  cancelAtPeriodEnd?: boolean;
}

export async function syncSubscription(payload: SyncSubscriptionPayload) {
  // 1. Ensure plans are seeded in Postgres
  await ensurePlansExist();

  // 2. Identify the user
  let user = null;
  if (payload.clerkUserId) {
    user = await prisma.user.findUnique({
      where: { clerkId: payload.clerkUserId },
    });
  }

  if (!user && payload.email) {
    user = await prisma.user.findUnique({
      where: { email: payload.email },
    });
  }

  if (!user) {
    throw new Error(`User not found for clerkUserId: ${payload.clerkUserId} and email: ${payload.email}`);
  }

  const targetPlanId = getPlanIdFromProductId(payload.productId);

  // Find database Plan ID (UUID) for this PlanId enum
  const dbPlan = await prisma.plan.findUnique({
    where: { planId: targetPlanId },
  });

  if (!dbPlan) {
    throw new Error(`Plan configuration not found for plan enum: ${targetPlanId}`);
  }

  const status = mapDodoStatus(payload.status);
  const interval = mapDodoInterval(payload.billingInterval);
  const start = payload.currentPeriodStart ? new Date(payload.currentPeriodStart) : new Date();
  const end = payload.currentPeriodEnd ? new Date(payload.currentPeriodEnd) : null;

  // Use Prisma transaction to ensure atomicity
  return prisma.$transaction(async (tx) => {
    // 3. Find or Create subscription
    const existingSubscription = await tx.subscription.findUnique({
      where: { userId: user.id },
    });

    const data = {
      planId: dbPlan.id,
      status,
      interval,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: !!payload.cancelAtPeriodEnd,
      clerkUserId: user.clerkId || payload.clerkUserId || null,
      email: user.email || payload.email || null,
      checkoutSessionId: payload.checkoutSessionId || null,
      dodoCustomerId: payload.dodoCustomerId,
      dodoSubscriptionId: payload.dodoSubscriptionId,
      paymentProvider: "dodo",
      customerId: payload.dodoCustomerId,
      providerSubscriptionId: payload.dodoSubscriptionId,
    };

    let subscription;
    if (existingSubscription) {
      subscription = await tx.subscription.update({
        where: { userId: user.id },
        data,
      });
      console.log(`[Subscription Service] Updated subscription for user: ${user.email} status: ${status}`);
    } else {
      subscription = await tx.subscription.create({
        data: {
          ...data,
          userId: user.id,
        },
      });
      console.log(`[Subscription Service] Created subscription for user: ${user.email} status: ${status}`);
    }

    return subscription;
  });
}
