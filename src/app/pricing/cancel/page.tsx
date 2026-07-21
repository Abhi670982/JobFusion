'use client';

import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PricingCancelPage() {
  return (
    <main className="min-h-screen bg-background relative flex items-center justify-center p-4">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(circle 500px at 50% 50%, oklch(0.62 0.22 20 / 0.05) 0%, transparent 80%)
          `,
        }}
      />

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="flex flex-col items-center"
        >
          {/* Animated cancel container */}
          <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(244,63,94,0.15)]">
            <XCircle className="w-10 h-10 text-rose-500" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight mb-3">
            Payment Cancelled
          </h1>
          <p className="text-rose-600 dark:text-rose-400 font-semibold text-sm bg-rose-500/8 border border-rose-500/15 px-4 py-1.5 rounded-full mb-6">
            Payment cancelled.
          </p>

          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
            Your payment attempt was cancelled. No charges were made, and your account status remains unchanged.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button className="w-full rounded-xl gradient-brand text-white border-0 shadow-md font-semibold gap-2 min-w-[160px]">
              <ArrowLeft className="w-4 h-4" />
              Return to Pricing
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full rounded-xl font-semibold gap-2 min-w-[160px]">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
