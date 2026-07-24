'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


interface PricingCTAProps {
  className?: string;
  variant?: 'default' | 'minimal';
}

export function PricingCTA({ className, variant = 'default' }: PricingCTAProps) {
  const onUpgrade = () => {
    const plansSection = document.getElementById('plans');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '#plans';
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex flex-col sm:flex-row items-center gap-3', className)}>
        <Button
          id="cta-upgrade-minimal"
          onClick={onUpgrade}
          className="rounded-xl gradient-brand text-white border-0 font-semibold shadow-md hover:opacity-90"
          aria-label="Upgrade to Pro plan"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade to Pro
        </Button>
        <Link href="/pricing">
          <Button variant="ghost" className="rounded-xl text-muted-foreground">
            View all plans <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative overflow-hidden rounded-3xl',
        'gradient-cta text-white p-10 sm:p-14 text-center',
        className
      )}
      aria-labelledby="cta-heading"
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/15 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          Start your Pro journey today
        </div>

        <h2
          id="cta-heading"
          className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight"
        >
          Land your dream job{' '}
          <span className="opacity-80">faster with AI</span>
        </h2>

        <p className="text-white/70 text-sm sm:text-base mb-8 leading-relaxed">
          Join thousands of job seekers using JobFusion Pro to craft better resumes,
          ace ATS filters, and get matched with the right opportunities.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            id="cta-upgrade-pro"
            onClick={onUpgrade}
            size="lg"
            className="rounded-xl bg-white text-primary font-bold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl min-w-[160px]"
            aria-label="Upgrade to Pro — ₹299 per month"
          >
            Upgrade to Pro — ₹299/mo
          </Button>

        </div>

        <p className="text-white/50 text-xs mt-5">
          Cancel anytime · 100% secure
        </p>
      </div>
    </motion.section>
  );
}
