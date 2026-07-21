// ============================================================
// lib/plans.ts — Single Source of Truth for All Pricing Plans
// ============================================================
// Every pricing component reads from this config.
// When Dodo Payments is integrated, populate dodoMonthlyProductId
// and dodoYearlyProductId with the actual product IDs.

import type { PricingPlan } from '@/types/subscription';

// Re-export so components can import PricingPlan directly from lib/plans
export type { PricingPlan };

export const FREE_PLAN_FEATURES = [
  'Job Search & Discovery',
  'Resume Upload (1 resume)',
  'Basic ATS Score Check',
  'Limited AI Usage (5/month)',
  'Save up to 20 Jobs',
  'Email Notifications',
];

export const PRO_PLAN_FEATURES = [
  'Everything in Free',
  'Unlimited AI Resume Builder',
  'Unlimited ATS Optimization',
  'Unlimited Resume Analysis',
  'Unlimited Cover Letter Generation',
  'Unlimited Saved Jobs',
  'AI Skill Gap Analysis',
  'Interview Preparation',
  'Resume Version History',
  'Smart Job Matching',
  'Priority Notifications',
  'Priority Support',
];

export const RECRUITER_PLAN_FEATURES = [
  'Everything in Pro',
  'Dedicated Account Manager',
  'Custom AI Model Fine-tuning',
  'Bulk Resume Processing',
  'API Access',
  'Custom Integrations',
  'Advanced Analytics Dashboard',
  'SLA-backed Uptime',
];

export const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with your job search.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    buttonText: 'Get Started Free',
    buttonVariant: 'outline',
    features: FREE_PLAN_FEATURES,
    // Dodo placeholder — fill in when integrating payments
    dodoMonthlyProductId: '',
    dodoYearlyProductId: '',
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    description: 'Unlock the full power of AI-driven job search.',
    monthlyPrice: 299,
    yearlyPrice: 2999,
    badge: 'Most Popular',
    recommended: true,
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'default',
    features: PRO_PLAN_FEATURES,
    // Dodo placeholder — fill in when integrating payments
    dodoMonthlyProductId: '',
    dodoYearlyProductId: '',
  },
  {
    id: 'recruiter',
    name: 'Recruiter',
    description: 'Custom solutions for hiring teams and enterprises.',
    monthlyPrice: null,
    yearlyPrice: null,
    buttonText: 'Contact Sales',
    buttonVariant: 'secondary',
    features: RECRUITER_PLAN_FEATURES,
    // Dodo placeholder — enterprise pricing managed manually
    dodoMonthlyProductId: '',
    dodoYearlyProductId: '',
  },
];

/**
 * Feature comparison matrix for the /pricing comparison table.
 * Each entry maps a feature label to whether each plan includes it.
 */
export interface ComparisonRow {
  feature: string;
  category: string;
  free: boolean | string;   // true, false, or a string like "5/month"
  pro: boolean | string;
  recruiter: boolean | string;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  // Core
  { feature: 'Job Search', category: 'Core', free: true, pro: true, recruiter: true },
  { feature: 'Resume Upload', category: 'Core', free: '1 resume', pro: 'Unlimited', recruiter: 'Unlimited' },
  { feature: 'Saved Jobs', category: 'Core', free: '20 max', pro: 'Unlimited', recruiter: 'Unlimited' },
  { feature: 'Email Notifications', category: 'Core', free: true, pro: true, recruiter: true },
  { feature: 'Priority Notifications', category: 'Core', free: false, pro: true, recruiter: true },
  // AI Features
  { feature: 'AI Resume Builder', category: 'AI', free: '5/month', pro: 'Unlimited', recruiter: 'Unlimited' },
  { feature: 'ATS Optimization', category: 'AI', free: 'Basic', pro: 'Unlimited', recruiter: 'Unlimited' },
  { feature: 'Cover Letter Generation', category: 'AI', free: false, pro: 'Unlimited', recruiter: 'Unlimited' },
  { feature: 'AI Skill Gap Analysis', category: 'AI', free: false, pro: true, recruiter: true },
  { feature: 'Smart Job Matching', category: 'AI', free: false, pro: true, recruiter: true },
  // Career Tools
  { feature: 'Interview Preparation', category: 'Career', free: false, pro: true, recruiter: true },
  { feature: 'Resume Version History', category: 'Career', free: false, pro: true, recruiter: true },
  { feature: 'Resume Analysis', category: 'Career', free: '1/month', pro: 'Unlimited', recruiter: 'Unlimited' },
  // Enterprise
  { feature: 'Priority Support', category: 'Support', free: false, pro: true, recruiter: true },
  { feature: 'Dedicated Account Manager', category: 'Support', free: false, pro: false, recruiter: true },
  { feature: 'API Access', category: 'Enterprise', free: false, pro: false, recruiter: true },
  { feature: 'Custom Integrations', category: 'Enterprise', free: false, pro: false, recruiter: true },
  { feature: 'SLA-backed Uptime', category: 'Enterprise', free: false, pro: false, recruiter: true },
];

export const FAQ_ITEMS = [
  {
    question: 'Can I cancel my subscription at any time?',
    answer:
      'Yes. You can cancel your Pro subscription at any time. You will continue to have access until the end of your current billing period, and you will not be charged again after that.',
  },
  {
    question: 'What happens when my free AI usage runs out?',
    answer:
      'On the Free plan, you get 5 AI operations per month. Once exhausted, AI features will be locked until your next billing cycle. Upgrading to Pro gives you unlimited AI usage.',
  },
  {
    question: 'Is my payment information secure?',
    answer:
      'Absolutely. Payments are processed by Dodo Payments, a PCI-DSS compliant payment processor. JobFusion never stores your card details.',
  },
  {
    question: 'What is the difference between monthly and yearly billing?',
    answer:
      'Yearly billing saves you 17% compared to monthly billing (₹2,999/year vs ₹299/month × 12 = ₹3,588). You are billed once a year and get all Pro features for the entire year.',
  },
  {
    question: 'Can I switch plans at any time?',
    answer:
      'Yes. You can upgrade or downgrade your plan at any time. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period.',
  },
  {
    question: 'Is there a student or non-profit discount?',
    answer:
      'We offer special pricing for students and non-profit organizations. Please contact us at support@jobfusion.ai with a valid institutional email for eligibility.',
  },
  {
    question: 'What payment methods are accepted?',
    answer:
      'We accept all major credit cards, debit cards, UPI, and net banking through our payment partner Dodo Payments. EMI options may be available for eligible cards.',
  },
  {
    question: 'Do you offer a free trial for Pro?',
    answer:
      'We are working on introducing a free trial for the Pro plan. For now, the Free plan gives you a generous set of features to evaluate whether Pro is right for you.',
  },
];

export const TRUST_BADGES = [
  { iconName: 'Shield' as const, label: 'Secure Payments', sub: 'PCI-DSS compliant' },
  { iconName: 'Zap' as const,    label: 'Instant Access',  sub: 'Pro unlocks immediately' },
  { iconName: 'Users' as const,  label: '10,000+ Users',   sub: 'Trusted by job seekers' },
  { iconName: 'Star' as const,   label: '4.9/5 Rating',    sub: 'From verified users' },
];

export const TESTIMONIALS = [
  {
    quote: "JobFusion Pro's AI resume builder helped me land 3x more interviews in just 2 weeks.",
    name: 'Priya Sharma',
    role: 'Software Engineer at Swiggy',
    avatar: 'PS',
    color: '#6366f1',
  },
  {
    quote: "The ATS optimization alone is worth every rupee. My resume pass rate went from 20% to 80%.",
    name: 'Rahul Verma',
    role: 'Product Manager at Razorpay',
    avatar: 'RV',
    color: '#10b981',
  },
  {
    quote: "Cover letter generation saves me hours. I can now apply to 10x more jobs every week.",
    name: 'Anjali Singh',
    role: 'Data Analyst at PhonePe',
    avatar: 'AS',
    color: '#f59e0b',
  },
];

export const ENTERPRISE_HIGHLIGHTS = [
  'Dedicated account manager',
  'API access & integrations',
  'Custom SLA',
];


/**
 * Get a plan by ID.
 */
export function getPlanById(id: string): PricingPlan | undefined {
  return PLANS.find((p) => p.id === id);
}

/**
 * Get the display price for a plan given the billing interval.
 * Returns null for "Contact Sales" plans.
 */
export function getPlanPrice(plan: PricingPlan, interval: 'monthly' | 'yearly'): number | null {
  return interval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
}

/**
 * Format a price in INR.
 */
export function formatPrice(price: number | null): string {
  if (price === null) return 'Custom';
  if (price === 0) return '₹0';
  return `₹${price.toLocaleString('en-IN')}`;
}

/**
 * Calculate savings percentage between monthly and yearly billing.
 */
export function calculateSavings(plan: PricingPlan): number | null {
  if (!plan.monthlyPrice || !plan.yearlyPrice) return null;
  const monthlyTotal = plan.monthlyPrice * 12;
  const savings = ((monthlyTotal - plan.yearlyPrice) / monthlyTotal) * 100;
  return Math.round(savings);
}
