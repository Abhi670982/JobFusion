'use client';

import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

interface UpgradeBannerProps {
  message?: string;
  className?: string;
  dismissible?: boolean;
}

/**
 * Inline upgrade banner for use within pages to nudge free users.
 */
export function UpgradeBanner({
  message = 'Unlock unlimited AI features, ATS optimization, and more.',
  className,
  dismissible = true,
}: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const onUpgrade = () => {
    // Placeholder — Dodo Payments integration will be added here
    toast.info('Dodo Payments integration will be added soon.', {
      description: 'Pro plan checkout coming next.',
      duration: 4000,
    });
  };

  if (dismissed) return null;

  return (
    <div
      role="banner"
      aria-label="Upgrade to Pro"
      className={cn(
        'relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3',
        'p-4 rounded-2xl border border-primary/20 bg-primary/[0.04]',
        className
      )}
    >
      {/* Content */}
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Upgrade to Pro</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-11 sm:ml-0">
        <Button
          id="upgrade-banner-cta"
          size="sm"
          onClick={onUpgrade}
          className="rounded-xl gradient-brand text-white border-0 text-xs font-semibold hover:opacity-90 shadow-sm"
          aria-label="Upgrade to Pro plan"
        >
          Upgrade — ₹299/mo
        </Button>
        <Link href="/pricing">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-xs text-muted-foreground"
            aria-label="View all pricing plans"
          >
            See plans
          </Button>
        </Link>
      </div>

      {/* Dismiss */}
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss upgrade banner"
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-muted transition-colors touch-auto"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
