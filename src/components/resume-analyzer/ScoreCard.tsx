'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScoreCardProps {
  label: string;
  score: number;
  explanation: string;
  tips?: string[];
  icon?: React.ReactNode;
  delay?: number;
  compact?: boolean;
}

function scoreColor(score: number) {
  if (score >= 75) return {
    ring: 'stroke-emerald-500',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    label: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-emerald-500/20',
  };
  if (score >= 50) return {
    ring: 'stroke-amber-500',
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    label: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-amber-500/20',
  };
  return {
    ring: 'stroke-red-500',
    bar: 'bg-red-500',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    label: 'text-red-600 dark:text-red-400',
    glow: 'shadow-red-500/20',
  };
}

export function ScoreCard({ label, score, explanation, tips = [], icon, delay = 0, compact = false }: ScoreCardProps) {
  const colors = scoreColor(score);
  const clamped = Math.max(0, Math.min(100, score));

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="card-premium p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <span className="text-xs font-semibold text-foreground">{label}</span>
          </div>
          <span className={cn('text-sm font-extrabold tabular-nums', colors.label)}>{clamped}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', colors.bar)}
            initial={{ width: 0 }}
            animate={{ width: `${clamped}%` }}
            transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card-premium p-5 space-y-4 hover:shadow-lg transition-shadow duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
              {icon}
            </div>
          )}
          <span className="text-sm font-semibold text-foreground leading-tight">{label}</span>
        </div>
        <span className={cn(
          'px-2.5 py-0.5 rounded-full text-xs font-extrabold border tabular-nums flex-shrink-0',
          colors.badge
        )}>
          {clamped}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', colors.bar)}
            initial={{ width: 0 }}
            animate={{ width: `${clamped}%` }}
            transition={{ delay: delay + 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Explanation */}
      <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>

      {/* Tips */}
      {tips.length > 0 && (
        <ul className="space-y-1.5 pt-1 border-t border-border">
          {tips.slice(0, 2).map((tip, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <span className="text-primary mt-0.5 flex-shrink-0">→</span>
              <span className="leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

// ── Large circular score ring ─────────────────────────────────────────────────

interface ScoreRingProps {
  score: number;
  label: string;
  subtitle?: React.ReactNode;
  size?: number;
  strokeWidth?: number;
  delay?: number;
}

export function ScoreRing({ score, label, subtitle, size = 140, strokeWidth = 10, delay = 0 }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const colors = scoreColor(clamped);

  // Determine ring color class → convert to hex for SVG stroke
  const strokeColorMap: Record<string, string> = {
    'stroke-emerald-500': '#10b981',
    'stroke-amber-500': '#f59e0b',
    'stroke-red-500': '#ef4444',
  };
  const strokeHex = strokeColorMap[colors.ring] || '#6366f1';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/60"
          />
          {/* Score arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeHex}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
            transition={{ delay: delay + 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.5, duration: 0.4 }}
            className={cn('text-3xl font-extrabold tabular-nums leading-none', colors.label)}
          >
            {clamped}
          </motion.span>
          <span className="text-[10px] text-muted-foreground font-medium mt-1">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-foreground">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
