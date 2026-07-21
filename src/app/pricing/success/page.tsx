'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Home, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PricingSuccessPage() {
  return (
    <main className="min-h-screen bg-background relative flex items-center justify-center p-4">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(circle 500px at 50% 50%, oklch(0.62 0.17 150 / 0.08) 0%, transparent 80%)
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
          {/* Animated checkmark container */}
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.15)]">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight mb-3">
            Upgrade Initiated!
          </h1>
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm bg-emerald-500/8 border border-emerald-500/15 px-4 py-1.5 rounded-full mb-6">
            Payment completed successfully.
          </p>

          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
            Thank you for upgrading! Your subscription activation will occur shortly after we receive payment confirmation from Dodo Payments.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full rounded-xl gradient-brand text-white border-0 shadow-md font-semibold gap-2 min-w-[160px]">
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full rounded-xl font-semibold gap-2 min-w-[160px]">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </motion.div>

        {/* Footer help note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-muted-foreground pt-4"
        >
          Need help? Contact us at{' '}
          <a href="mailto:support@jobfusion.ai" className="text-primary hover:underline">
            support@jobfusion.ai
          </a>
        </motion.p>
      </div>
    </main>
  );
}
