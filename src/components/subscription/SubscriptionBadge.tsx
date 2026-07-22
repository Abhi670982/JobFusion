import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionBadgeProps {
  planId: string;
  className?: string;
}

export function SubscriptionBadge({ planId, className }: SubscriptionBadgeProps) {
  const isPro = planId === 'pro_monthly' || planId === 'pro_yearly';
  const isRecruiter = planId === 'recruiter';

  if (isPro) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/5 dark:border-amber-500/10 shadow-sm",
          className
        )}
      >
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" />
        Pro Member
      </span>
    );
  }

  if (isRecruiter) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-purple-700 bg-purple-500/10 border border-purple-500/20 dark:text-purple-400 dark:bg-purple-500/5 dark:border-purple-500/10 shadow-sm",
          className
        )}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
        Recruiter
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground bg-muted border border-border/80",
        className
      )}
    >
      Free Plan
    </span>
  );
}
