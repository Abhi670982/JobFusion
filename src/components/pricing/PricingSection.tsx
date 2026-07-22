import { cn } from '@/lib/utils';
import React from 'react';

interface PricingSectionProps {
  id?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  centered?: boolean;
}

/**
 * Generic section wrapper for pricing page sections.
 * Provides consistent spacing, heading structure, and layout.
 */
export function PricingSection({
  id,
  title,
  subtitle,
  children,
  className,
  titleClassName,
  centered = true,
}: PricingSectionProps) {
  return (
    <section
      id={id}
      className={cn('w-full py-16 sm:py-20', className)}
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      {(title || subtitle) && (
        <div className={cn('mb-12', centered && 'text-center')}>
          {title && (
            <h2
              id={id ? `${id}-heading` : undefined}
              className={cn('text-2xl sm:text-3xl font-bold mb-3', titleClassName)}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
