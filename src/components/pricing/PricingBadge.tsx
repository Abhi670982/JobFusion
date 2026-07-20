import { cn } from '@/lib/utils';

type BadgeVariant = 'popular' | 'savings' | 'enterprise' | 'new';

interface PricingBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  popular:    'bg-primary/10 text-primary border-primary/20',
  savings:    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  enterprise: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  new:        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

export function PricingBadge({ label, variant = 'popular', className }: PricingBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
