'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PricingToggleProps {
  value: 'monthly' | 'yearly';
  onChange: (value: 'monthly' | 'yearly') => void;
  savingsPercent?: number;
}

export function PricingToggle({ value, onChange, savingsPercent = 17 }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4" role="group" aria-label="Billing interval">
      <button
        id="toggle-monthly"
        aria-pressed={value === 'monthly'}
        onClick={() => onChange('monthly')}
        className={cn(
          'text-sm font-medium transition-colors focus-ring',
          value === 'monthly'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Monthly
      </button>

      {/* Toggle pill */}
      <button
        id="billing-toggle"
        role="switch"
        aria-checked={value === 'yearly'}
        aria-label="Toggle between monthly and yearly billing"
        onClick={() => onChange(value === 'monthly' ? 'yearly' : 'monthly')}
        className={cn(
          'relative w-14 h-7 rounded-full transition-colors duration-300 focus-ring',
          value === 'yearly'
            ? 'bg-primary'
            : 'bg-muted border border-border'
        )}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className={cn(
            'absolute top-1 w-5 h-5 rounded-full shadow-sm',
            value === 'yearly'
              ? 'bg-white left-8'
              : 'bg-muted-foreground/60 left-1'
          )}
        />
        <span className="sr-only">
          {value === 'yearly' ? 'Yearly billing selected' : 'Monthly billing selected'}
        </span>
      </button>

      <button
        id="toggle-yearly"
        aria-pressed={value === 'yearly'}
        onClick={() => onChange('yearly')}
        className={cn(
          'text-sm font-medium transition-colors flex items-center gap-2 focus-ring',
          value === 'yearly'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Yearly
        <span className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded-full transition-all',
          value === 'yearly'
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : 'bg-muted text-muted-foreground'
        )}>
          Save {savingsPercent}%
        </span>
      </button>
    </div>
  );
}
