'use client';

import { useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from './UpgradeModal';
import { cn } from '@/lib/utils';
import type { PlanId } from '@/types/subscription';

interface LockedFeatureCardProps {
  title: string;
  description: string;
  featureName?: string;
  requiredPlan?: PlanId;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * A locked feature card shown to free users in place of a premium feature.
 * Shows a lock icon, feature name, and upgrade CTA.
 */
export function LockedFeatureCard({
  title,
  description,
  featureName,
  requiredPlan = 'pro_monthly',
  icon,
  className,
}: LockedFeatureCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          'relative rounded-2xl border border-border/60 bg-card p-6',
          'flex flex-col items-center text-center gap-4',
          'overflow-hidden',
          className
        )}
        aria-label={`${title} — Pro feature locked`}
      >
        {/* Subtle locked background */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, oklch(0.53 0.24 258 / 0.03) 8px, oklch(0.53 0.24 258 / 0.03) 9px)',
          }}
          aria-hidden="true"
        />

        {/* Icon */}
        <div className="relative z-10 w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          {icon ?? <Sparkles className="w-6 h-6 text-muted-foreground" aria-hidden="true" />}
          {/* Lock badge */}
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-muted-foreground" aria-hidden="true" />
          </span>
        </div>

        <div className="relative z-10">
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>

        <Button
          id={`locked-${title.replace(/\s+/g, '-').toLowerCase()}`}
          size="sm"
          onClick={() => setModalOpen(true)}
          className="relative z-10 rounded-xl gradient-brand text-white border-0 text-xs font-semibold hover:opacity-90 shadow-sm"
          aria-label={`Unlock ${featureName ?? title} with Pro plan`}
        >
          <Sparkles className="w-3 h-3 mr-1.5" aria-hidden="true" />
          Unlock with Pro
        </Button>
      </div>

      <UpgradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        featureName={featureName ?? title}
        requiredPlan={requiredPlan}
      />
    </>
  );
}
