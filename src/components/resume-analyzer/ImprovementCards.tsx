'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface Suggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface ImprovementCardsProps {
  suggestions: Suggestion[];
}

const PRIORITY_CONFIG = {
  high: {
    label: 'High Priority',
    icon: AlertCircle,
    border: 'border-l-red-500',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    iconColor: 'text-red-500',
    bg: 'hover:bg-red-500/3',
  },
  medium: {
    label: 'Medium Priority',
    icon: AlertTriangle,
    border: 'border-l-amber-500',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    iconColor: 'text-amber-500',
    bg: 'hover:bg-amber-500/3',
  },
  low: {
    label: 'Low Priority',
    icon: Info,
    border: 'border-l-blue-500',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    iconColor: 'text-blue-500',
    bg: 'hover:bg-blue-500/3',
  },
};

function SuggestionCard({ suggestion, index }: { suggestion: Suggestion; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const cfg = PRIORITY_CONFIG[suggestion.priority];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      className={cn(
        'rounded-xl border border-border border-l-4 overflow-hidden transition-colors duration-200',
        cfg.border, cfg.bg
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left touch-auto"
      >
        <Icon className={cn('w-4 h-4 flex-shrink-0', cfg.iconColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">{suggestion.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border hidden sm:inline-flex', cfg.badge)}>
            {cfg.label}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <div className="h-px bg-border mb-3" />
              <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ImprovementCards({ suggestions }: ImprovementCardsProps) {
  const highCount   = suggestions.filter(s => s.priority === 'high').length;
  const mediumCount = suggestions.filter(s => s.priority === 'medium').length;
  const lowCount    = suggestions.filter(s => s.priority === 'low').length;

  if (suggestions.length === 0) {
    return (
      <div className="card-premium p-5 text-center py-10">
        <Info className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No improvement suggestions available. Excellent resume!</p>
      </div>
    );
  }

  return (
    <div className="card-premium p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Improvement Plan</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{suggestions.length} actionable suggestions</p>
        </div>
        {/* Priority summary */}
        <div className="flex gap-1.5">
          {highCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              {highCount} high
            </span>
          )}
          {mediumCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {mediumCount} med
            </span>
          )}
          {lowCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {lowCount} low
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {suggestions.map((s, i) => (
          <SuggestionCard key={i} suggestion={s} index={i} />
        ))}
      </div>
    </div>
  );
}
