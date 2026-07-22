'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Zap, Shield, Users, Star, ArrowRight, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PricingCard } from '@/components/pricing/PricingCard';
import { FeatureComparison } from '@/components/pricing/FeatureComparison';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { PricingCTA } from '@/components/pricing/PricingCTA';
import { PricingSection } from '@/components/pricing/PricingSection';
import { TRUST_BADGES, FREE_PLAN_FEATURES, PRO_PLAN_FEATURES } from '@/lib/plans';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import Navbar from '@/components/navbar';

const Footer = dynamic(() => import('@/components/footer'), { ssr: true });

// Helper map to resolve Lucide Icon components dynamically based on iconName
const ICON_MAP = {
  Shield,
  Zap,
  Users,
  Star,
};

const CARD_PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    description: 'Perfect for getting started with your job search.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    buttonText: 'Get Started Free',
    buttonVariant: 'outline' as const,
    features: FREE_PLAN_FEATURES,
  },
  {
    id: 'pro_monthly' as const,
    name: 'Pro Monthly',
    description: 'Unlock the full power of AI-driven job search.',
    monthlyPrice: 299,
    yearlyPrice: null,
    buttonText: 'Upgrade Monthly',
    buttonVariant: 'outline' as const,
    features: PRO_PLAN_FEATURES,
  },
  {
    id: 'pro_yearly' as const,
    name: 'Pro Yearly',
    description: 'Best value for long-term career growth.',
    monthlyPrice: null,
    yearlyPrice: 2999,
    badge: 'Most Popular',
    recommended: true,
    buttonText: 'Upgrade Yearly',
    buttonVariant: 'default' as const,
    features: PRO_PLAN_FEATURES,
  },
];

export default function PricingPage() {
  const [currentPlanId, setCurrentPlanId] = useState<string>('free');

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch('/api/subscription/status');
        const data = await res.json();
        if (data && data.status) {
          setCurrentPlanId(data.status.planId);
        }
      } catch (err) {
        console.error('Error fetching subscription status:', err);
      }
    }
    loadStatus();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 bg-background" id="pricing-main">
        {/* ── HERO ── */}
      <section
        className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20"
        aria-labelledby="pricing-hero-heading"
      >
        {/* Background radial gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.53 0.24 258 / 0.1) 0%, transparent 60%),
              radial-gradient(ellipse 40% 30% at 85% 20%, oklch(0.5 0.25 272 / 0.07) 0%, transparent 50%)
            `,
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6"
          >
            <Zap className="w-3.5 h-3.5" aria-hidden="true" />
            Simple, transparent pricing
          </motion.div>

          {/* Heading */}
          <motion.h1
            id="pricing-hero-heading"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-5"
          >
            Invest in your{' '}
            <span className="gradient-brand-text">career growth</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            From your first job search to landing your dream role, JobFusion grows with you.
            Find all our pricing plans below.
          </motion.p>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section
        className="py-8 pb-20"
        aria-labelledby="pricing-cards-heading"
        id="plans"
      >
        <h2 id="pricing-cards-heading" className="sr-only">Pricing Plans</h2>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {CARD_PLANS.map((plan, i) => (
              <PricingCard
                key={plan.id}
                plan={plan as any}
                interval={plan.id === 'pro_yearly' ? 'yearly' : 'monthly'}
                index={i}
                currentPlanId={currentPlanId}
              />
            ))}
          </div>

          {/* BYOK Banner */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/>
                  <path d="m21 2-9.6 9.6"/>
                  <circle cx="7.5" cy="15.5" r="5.5"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Bring Your Own Key (BYOK)</h3>
                <p className="text-sm text-muted-foreground">
                  Already have an OpenAI, Gemini, or Claude API key? Connect it to your JobFusion account to unlock <span className="font-semibold text-foreground">unlimited AI features</span> without upgrading to Pro.
                </p>
              </div>
              <div>
                <Link href="/settings/ai-providers">
                  <Button className="rounded-xl gradient-brand text-white border-0 shadow-md">
                    Connect API Key
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Money-back guarantee note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-muted-foreground mt-8"
          >
            <span className="font-semibold text-foreground/80">No hidden fees.</span>{' '}
            Cancel anytime. All prices are in Indian Rupees (INR) and inclusive of applicable taxes.
          </motion.p>
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section
        className="py-10 border-y border-border bg-muted/20"
        aria-label="Trust and security information"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map(({ iconName, label, sub }) => {
              const Icon = ICON_MAP[iconName as keyof typeof ICON_MAP];
              return (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left"
                >
                  {Icon && (
                    <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARISON TABLE ── */}
      <PricingSection
        id="comparison"
        title="Compare all features"
        subtitle="See exactly what's included in each plan before you decide."
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="card-premium p-4 sm:p-6 lg:p-8">
            <FeatureComparison />
          </div>
        </div>
      </PricingSection>





      {/* ── FAQ ── */}
      <PricingSection id="faq" className="bg-muted/10 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <PricingFAQ />
        </div>
      </PricingSection>

      {/* ── BOTTOM CTA ── */}
      <PricingSection id="cta" className="pt-8 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <PricingCTA />
        </div>
      </PricingSection>
      
      <Footer />
      </main>
    </div>
  );
}
