'use client';

import React, { useState } from 'react';
import { UpgradeModal } from './UpgradeModal';
import type { PlanId } from '@/types/subscription';

interface PremiumGateProps {
  /** If true, the user has access; if false, the upgrade modal is shown */
  hasAccess?: boolean;
  /** Feature name shown in the upgrade modal */
  featureName: string;
  /** Minimum plan required to access this feature */
  requiredPlan?: PlanId;
  /** The actual content to show if the user has access */
  children: React.ReactNode;
  /** Optional fallback to show instead of the modal trigger */
  fallback?: React.ReactNode;
}

/**
 * Wraps premium features.
 * - If hasAccess = true: renders children normally.
 * - If hasAccess = false: renders children with a click-to-unlock overlay.
 * 
 * Usage:
 *   <PremiumGate hasAccess={hasProAccess} featureName="AI Resume Builder">
 *     <ResumeAIBuilder />
 *   </PremiumGate>
 */
export function PremiumGate({
  hasAccess = false,
  featureName,
  requiredPlan = 'pro_monthly',
  children,
  fallback,
}: PremiumGateProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      {/* Clickable locked overlay */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Unlock ${featureName} — Pro feature`}
        onClick={() => setModalOpen(true)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setModalOpen(true)}
        className="relative group cursor-pointer focus-ring rounded-2xl"
      >
        {/* Blurred content */}
        <div className="pointer-events-none select-none" aria-hidden="true">
          <div className="blur-sm opacity-50 transition-all group-hover:blur-[6px]">
            {children}
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/40 backdrop-blur-[1px] transition-all group-hover:bg-background/50">
          <div className="text-center px-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-foreground/80">Pro Feature</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Click to unlock {featureName}</p>
          </div>
        </div>
      </div>

      <UpgradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        featureName={featureName}
        requiredPlan={requiredPlan}
      />
    </>
  );
}
