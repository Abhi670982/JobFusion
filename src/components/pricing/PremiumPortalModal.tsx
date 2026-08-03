'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { trackMonetizationEvent } from '@/lib/analytics';

interface PremiumPortalModalProps {
  open: boolean;
  onClose: () => void;
  portalName?: string;
}

const PORTAL_BENEFITS = [
  'Indeed Jobs',
  'Internshala Jobs',
  'Foundit Jobs',
  'Naukri Jobs',
  'Company Career Pages',
  'Future Premium Integrations',
  'Unlimited Resume Analysis',
  'Premium AI Features',
  'Priority Job Access',
  'AI Resume Analyzer',
  'AI Resume Rewrite',
];

export function PremiumPortalModal({ open, onClose, portalName }: PremiumPortalModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (open) {
      trackMonetizationEvent('Premium Modal Opened', { portal: portalName });
    }
  }, [open, portalName]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        trackMonetizationEvent('Modal Closed', { portal: portalName });
        onClose();
      }
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, portalName]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleUpgrade = () => {
    trackMonetizationEvent('Upgrade Clicked', { portal: portalName });
    onClose();
    router.push('/pricing');
  };

  const handleViewPricing = () => {
    trackMonetizationEvent('Pricing Clicked', { portal: portalName });
    onClose();
    router.push('/pricing');
  };

  const handleCloseModal = () => {
    trackMonetizationEvent('Modal Closed', { portal: portalName });
    onClose();
  };

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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={handleCloseModal}
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-lg bg-card rounded-3xl border border-primary/30 shadow-2xl overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Banner */}
              <div className="gradient-cta p-6 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
                </div>
                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                    className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-lg"
                  >
                    <Lock className="w-7 h-7 text-amber-300" />
                  </motion.div>
                  <span className="px-3 py-1 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-wider border border-white/20 mb-2 inline-block">
                    {portalName ? `${portalName} · Premium Portal` : 'Subscription Exclusive'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold mb-1.5 leading-snug">
                    Unlock Premium Job Portals
                  </h2>
                  <p className="text-white/85 text-xs max-w-sm mx-auto leading-relaxed">
                    Upgrade to JobFusion Premium to access exclusive job opportunities from India&apos;s leading job platforms.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors z-20 touch-auto text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content Body */}
              <div className="p-6 space-y-5">
                {/* Benefits List */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-primary/15 pb-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                      Included with JobFusion Premium
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {PORTAL_BENEFITS.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Display */}
                <div className="text-center pt-1">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-3xl font-extrabold text-foreground">₹299</span>
                    <span className="text-xs text-muted-foreground mb-1">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    or ₹2,999/year · Cancel anytime · Instant activation
                  </p>
                </div>

                {/* Buttons */}
                <div className="space-y-2.5 pt-1">
                  <Button
                    onClick={handleUpgrade}
                    className="w-full rounded-xl gradient-brand text-white border-0 font-bold shadow-lg hover:opacity-90 h-11 text-sm gap-2"
                    id="portal-modal-upgrade-btn"
                  >
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Premium
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleViewPricing}
                    className="w-full rounded-xl h-10 border-border font-semibold text-xs"
                    id="portal-modal-pricing-btn"
                  >
                    View Pricing
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCloseModal}
                    className="w-full rounded-xl text-muted-foreground text-xs touch-auto"
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
