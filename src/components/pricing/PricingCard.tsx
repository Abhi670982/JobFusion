'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PricingBadge } from './PricingBadge';
import { cn } from '@/lib/utils';
import { formatPrice, type PricingPlan } from '@/lib/plans';
import { toast } from 'sonner';

interface PricingCardProps {
  plan: PricingPlan;
  interval: 'monthly' | 'yearly';
  index?: number;
  currentPlanId?: string;
}

export function PricingCard({ plan, interval, index = 0, currentPlanId }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const price = interval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const isCurrentPlan = currentPlanId === plan.id;
  const isContactSales = price === null;

  const onUpgradeClick = async () => {
    if (isCurrentPlan || loading) return;

    if (plan.id === 'recruiter') {
      // Contact Sales — redirect to contact page
      window.location.href = '/contact';
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: interval }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate checkout.');
      }

      // Redirect to Dodo Checkout
      window.location.href = data.checkout_url;
    } catch (err: any) {
      console.error('[Upgrade Error]:', err);
      toast.error(err.message || 'Unable to start checkout. Please try again.');
      setLoading(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        'relative rounded-2xl p-7 flex flex-col border transition-all duration-300',
        plan.recommended
          ? 'border-primary/40 bg-card shadow-xl shadow-primary/8 ring-1 ring-primary/20'
          : 'border-border bg-card hover:border-border/80',
        'hover:-translate-y-1 hover:shadow-lg'
      )}
    >
      {/* Recommended glow */}
      {plan.recommended && (
        <div className="absolute inset-0 rounded-2xl bg-primary/[0.03] pointer-events-none" />
      )}

      {/* Badge row */}
      <div className="flex items-start justify-between mb-5">
        <div>
          {plan.recommended && (
            <PricingBadge label="Most Popular" variant="popular" className="mb-2" />
          )}
          {plan.id === 'recruiter' && (
            <PricingBadge label="Enterprise" variant="enterprise" className="mb-2" />
          )}
        </div>
        {interval === 'yearly' && !isContactSales && plan.id !== 'free' && (
          <PricingBadge label="Save 17%" variant="savings" />
        )}
      </div>

      {/* Plan name & description */}
      <div className="mb-6">
        <h3
          className={cn(
            'text-xl font-bold mb-1',
            plan.recommended && 'gradient-brand-text'
          )}
        >
          {plan.name}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-7">
        {isContactSales ? (
          <div>
            <span className="text-3xl font-extrabold">Custom</span>
            <p className="text-sm text-muted-foreground mt-1">Talk to our team</p>
          </div>
        ) : (
          <div className="flex items-end gap-1.5">
            <span className="text-4xl font-extrabold tabular-nums">
              {formatPrice(price)}
            </span>
            {price !== 0 && (
              <span className="text-sm text-muted-foreground mb-1">
                /{interval === 'monthly' ? 'month' : 'year'}
              </span>
            )}
          </div>
        )}
        {interval === 'yearly' && plan.monthlyPrice && plan.monthlyPrice > 0 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Billed annually · {formatPrice(plan.monthlyPrice)}/mo equivalent
          </p>
        )}
      </div>

      {/* CTA Button */}
      <Button
        id={`upgrade-${plan.id}`}
        variant={isCurrentPlan ? 'secondary' : plan.buttonVariant}
        onClick={onUpgradeClick}
        disabled={isCurrentPlan || loading}
        aria-label={isCurrentPlan ? `You are on the ${plan.name} plan` : `${plan.buttonText} — ${plan.name} plan`}
        className={cn(
          'w-full rounded-xl font-semibold mb-7 transition-all',
          plan.recommended && !isCurrentPlan
            ? 'gradient-brand text-white border-0 shadow-md hover:opacity-90'
            : '',
          (isCurrentPlan || loading) ? 'cursor-default' : ''
        )}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Processing...</>
        ) : isCurrentPlan ? (
          <><Check className="w-4 h-4 mr-1.5" /> Current Plan</>
        ) : plan.recommended ? (
          <><Sparkles className="w-4 h-4 mr-1.5" />{plan.buttonText}</>
        ) : (
          plan.buttonText
        )}
      </Button>

      {/* Divider */}
      <div className="h-px bg-border mb-6" />

      {/* Features list */}
      <ul className="space-y-3 flex-1" aria-label={`${plan.name} plan features`}>
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className={cn(
              'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              plan.recommended
                ? 'bg-primary/15 text-primary'
                : 'bg-emerald-500/10 text-emerald-500'
            )}>
              <Check className="w-2.5 h-2.5" />
            </span>
            <span className="text-sm text-muted-foreground leading-snug">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
