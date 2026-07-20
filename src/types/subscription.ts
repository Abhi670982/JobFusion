// ============================================================
// Subscription & Pricing — Shared TypeScript Types
// ============================================================

export type PlanId = 'free' | 'pro_monthly' | 'pro_yearly' | 'recruiter';
export type BillingInterval = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trialing';

export interface PlanFeature {
  label: string;
  included: boolean;
  highlight?: boolean; // show in gold/amber
}

export interface PricingPlan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number | null; // INR, null = contact sales
  yearlyPrice: number | null;  // INR, null = contact sales
  badge?: string;              // e.g. "Save 17%", "Most Popular"
  recommended?: boolean;
  buttonText: string;
  buttonVariant: 'default' | 'outline' | 'ghost' | 'secondary';
  features: string[];
  // Placeholder for future Dodo Payments integration
  dodoMonthlyProductId?: string;
  dodoYearlyProductId?: string;
}

export interface SubscriptionInfo {
  planId: PlanId;
  status: SubscriptionStatus;
  interval: BillingInterval | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  // Payment provider fields (null until Dodo is integrated)
  paymentProvider: string | null;
  customerId: string | null;
  providerSubscriptionId: string | null;
}

export interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
  planRequired?: PlanId;
}

export interface AIUsageInfo {
  used: number;
  limit: number | null; // null = unlimited
  resetAt: Date | null;
}
