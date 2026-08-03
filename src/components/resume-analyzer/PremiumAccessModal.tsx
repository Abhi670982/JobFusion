'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Key, Zap, Brain, Target, FileSearch, Lightbulb, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PremiumAccessModalProps {
  open: boolean;
  onClose: () => void;
}

const FREE_FEATURES = [
  { text: 'BYOK Required', note: 'Bring Your Own API Key' },
  { text: 'Resume Analysis via your API', note: '' },
  { text: 'Limited ecosystem access', note: '' },
];

const PREMIUM_FEATURES = [
  { icon: Zap, text: 'Unlimited Resume Analysis', color: 'text-yellow-500' },
  { icon: Brain, text: 'Powered by JobFusion AI', color: 'text-purple-500' },
  { icon: Target, text: 'ATS Compatibility Score', color: 'text-blue-500' },
  { icon: FileSearch, text: 'Keyword Optimization', color: 'text-emerald-500' },
  { icon: Lightbulb, text: 'Missing Skills Detection', color: 'text-amber-500' },
  { icon: TrendingUp, text: 'AI Improvement Suggestions', color: 'text-primary' },
  { icon: Sparkles, text: 'Future: AI Resume Rewrite', color: 'text-pink-500' },
  { icon: Sparkles, text: 'Future: Cover Letter Generator', color: 'text-indigo-500' },
];

export function PremiumAccessModal({ open, onClose }: PremiumAccessModalProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="gradient-cta p-6 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
                </div>
                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                    className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3"
                  >
                    <Brain className="w-7 h-7" />
                  </motion.div>
                  <h2 className="text-xl font-bold mb-1">Unlock Resume Analyzer</h2>
                  <p className="text-white/75 text-sm">AI-powered insights to land your dream job</p>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors z-20 touch-auto"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Comparison */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* FREE column */}
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                        <span className="text-[9px] font-extrabold text-muted-foreground">F</span>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Free</span>
                    </div>
                    <ul className="space-y-2">
                      {FREE_FEATURES.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <div className="w-3 h-3 rounded-full border border-muted-foreground/30 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs text-muted-foreground font-medium">{f.text}</span>
                            {f.note && <p className="text-[10px] text-muted-foreground/60">{f.note}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* PREMIUM column */}
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Premium</span>
                    </div>
                    <ul className="space-y-2">
                      {PREMIUM_FEATURES.map((f, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          className="flex items-center gap-1.5"
                        >
                          <Check className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className={cn('text-xs font-medium', i >= 6 ? 'text-muted-foreground' : 'text-foreground')}>
                            {f.text}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Price */}
                <div className="text-center mb-5">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-3xl font-extrabold">₹299</span>
                    <span className="text-muted-foreground mb-1">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">or ₹2,999/year · Save 17%</p>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  <Button
                    onClick={() => { onClose(); router.push('/pricing'); }}
                    className="w-full rounded-xl gradient-brand text-white border-0 font-semibold shadow-md hover:opacity-90 h-11"
                    id="analyzer-upgrade-cta"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { onClose(); router.push('/settings/ai-providers'); }}
                    className="w-full rounded-xl h-11"
                    id="analyzer-byok-cta"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Use My API Key
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="w-full rounded-xl text-muted-foreground text-sm touch-auto"
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
