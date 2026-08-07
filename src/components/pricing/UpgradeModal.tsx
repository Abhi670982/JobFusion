'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import type { PlanId } from '@/types/subscription';
import { PRO_PLAN_FEATURES } from '@/lib/plans';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  featureName?: string;
  requiredPlan?: PlanId;
}

export function UpgradeModal({
  open,
  onClose,
  title,
  subtitle,
  featureName = 'this feature',
}: UpgradeModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const onUpgrade = () => {
    onClose();
    window.location.href = '/pricing';
  };
  const highlightedFeatures = PRO_PLAN_FEATURES.slice(0, 5);
  const displayTitle = title || `Unlock ${featureName}`;
  const displaySubtitle = subtitle || "This is a Pro feature. Upgrade to access it.";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="upgrade-modal-title">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'relative w-full max-w-md',
                'bg-card rounded-2xl border border-border shadow-2xl overflow-hidden'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header gradient */}
              <div className="gradient-cta p-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h2 id="upgrade-modal-title" className="text-xl font-bold mb-1">
                    {displayTitle}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {displaySubtitle}
                  </p>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close upgrade modal"
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors touch-auto z-20"
              >
                <X className="w-4 h-4 text-white" aria-hidden="true" />
              </button>

              {/* Body */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-4xl font-extrabold">₹299</span>
                    <span className="text-muted-foreground mb-1.5">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">or ₹2,999/year · Save 17%</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6" aria-label="Pro plan features">
                  {highlightedFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-primary" aria-hidden="true" />
                      </span>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                  <li className="text-xs text-muted-foreground pl-6">+ more features</li>
                </ul>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={onUpgrade}
                    className="w-full rounded-xl gradient-brand text-white border-0 font-semibold shadow-md hover:opacity-90"
                  >
                    <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                    Upgrade to Pro
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="w-full rounded-xl text-muted-foreground text-sm"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

