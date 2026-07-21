'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Zap, Shield, Users, Star, ArrowRight, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PricingToggle } from '@/components/pricing/PricingToggle';
import { PricingCard } from '@/components/pricing/PricingCard';
import { FeatureComparison } from '@/components/pricing/FeatureComparison';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { PricingCTA } from '@/components/pricing/PricingCTA';
import { PricingSection } from '@/components/pricing/PricingSection';
import { PLANS, TRUST_BADGES, TESTIMONIALS, ENTERPRISE_HIGHLIGHTS } from '@/lib/plans';
import { cn } from '@/lib/utils';

// Helper map to resolve Lucide Icon components dynamically based on iconName
const ICON_MAP = {
  Shield,
  Zap,
  Users,
  Star,
};

export default function PricingPage() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <main className="min-h-screen bg-background" id="pricing-main">
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
            className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            From your first job search to landing your dream role, JobFusion grows with you.
            Start free, upgrade when you&apos;re ready.
          </motion.p>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <PricingToggle
              value={interval}
              onChange={setInterval}
              savingsPercent={17}
            />
          </motion.div>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section
        className="py-8 pb-20"
        aria-labelledby="pricing-cards-heading"
        id="plans"
      >
        <h2 id="pricing-cards-heading" className="sr-only">Pricing Plans</h2>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {PLANS.map((plan, i) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                interval={interval}
                index={i}
              />
            ))}
          </div>

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
              const Icon = ICON_MAP[iconName];
              return (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
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

      {/* ── TESTIMONIALS ── */}
      <PricingSection
        id="testimonials"
        className="bg-muted/20 border-y border-border"
        title="Loved by job seekers"
        subtitle="Real stories from people who accelerated their careers with JobFusion Pro."
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-premium p-6 flex flex-col gap-4"
              >
                {/* Stars */}
                <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" aria-hidden="true" />
                  ))}
                </div>

                <blockquote className="text-sm text-muted-foreground leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: t.color }}
                    aria-hidden="true"
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </PricingSection>

      {/* ── ENTERPRISE BANNER ── */}
      <PricingSection id="enterprise" className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
              'rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-8',
              'flex flex-col md:flex-row items-center justify-between gap-6'
            )}
          >
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-2 bg-purple-500/10 px-3 py-1 rounded-full">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                Recruiter / Enterprise
              </div>
              <h2 className="text-xl font-bold mb-2">Building for your team?</h2>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Custom AI models, bulk resume processing, dedicated support, API access,
                and SLA-backed uptime. Let&apos;s talk.
              </p>
              <ul className="mt-4 space-y-1.5" aria-label="Enterprise features">
                {ENTERPRISE_HIGHLIGHTS.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <Link href="/contact">
                <Button
                  id="enterprise-contact-sales"
                  size="lg"
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white border-0 font-semibold min-w-[160px]"
                  aria-label="Contact sales for enterprise pricing"
                >
                  Contact Sales <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground">
                Response within 24 hours
              </p>
            </div>
          </motion.div>
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
    </main>
  );
}
