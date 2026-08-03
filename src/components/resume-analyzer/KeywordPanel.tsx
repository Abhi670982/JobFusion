'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Star, Zap, Hash } from 'lucide-react';

type KeywordTab = 'matched' | 'missing' | 'weak' | 'industry' | 'technical' | 'valuable';

interface KeywordPanelProps {
  matched: string[];
  missing: string[];
  weak: string[];
  industry: string[];
  technical: string[];
  mostValuable: string[];
  density: number;
}

const TABS: { id: KeywordTab; label: string; icon: React.ElementType; colorClass: string; emptyMsg: string }[] = [
  { id: 'matched',    label: 'Matched',    icon: TrendingUp,   colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20',  emptyMsg: 'No matched keywords detected. Try adding more industry-specific terms.' },
  { id: 'missing',    label: 'Missing',    icon: TrendingDown, colorClass: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/25 hover:bg-red-500/20',                      emptyMsg: 'No missing keywords! Your resume is well-optimized.' },
  { id: 'weak',       label: 'Weak',       icon: Minus,        colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/20',            emptyMsg: 'No weak keywords found.' },
  { id: 'industry',   label: 'Industry',   icon: Hash,         colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25 hover:bg-blue-500/20',                emptyMsg: 'No industry keywords detected.' },
  { id: 'technical',  label: 'Technical',  icon: Zap,          colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/25 hover:bg-purple-500/20',       emptyMsg: 'No technical keywords detected.' },
  { id: 'valuable',   label: 'Top Value',  icon: Star,         colorClass: 'text-primary bg-primary/10 border-primary/25 hover:bg-primary/20',                                        emptyMsg: 'No high-value keywords identified.' },
];

function KeywordChip({ keyword, colorClass, delay }: { keyword: string; colorClass: string; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.25 }}
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-default transition-colors',
        colorClass
      )}
    >
      {keyword}
    </motion.span>
  );
}

export function KeywordPanel({ matched, missing, weak, industry, technical, mostValuable, density }: KeywordPanelProps) {
  const [activeTab, setActiveTab] = useState<KeywordTab>('matched');

  const keywordMap: Record<KeywordTab, string[]> = {
    matched:   matched,
    missing:   missing,
    weak:      weak,
    industry:  industry,
    technical: technical,
    valuable:  mostValuable,
  };

  const activeTabConfig = TABS.find(t => t.id === activeTab)!;
  const activeKeywords = keywordMap[activeTab];

  return (
    <div className="card-premium p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Keyword Analysis</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {matched.length} matched · {missing.length} missing · density {(density * 100).toFixed(1)}%
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/8 border border-primary/20">
          <Hash className="w-3 h-3 text-primary" />
          <span className="text-xs font-bold text-primary">{matched.length + industry.length}</span>
          <span className="text-[10px] text-muted-foreground">keywords</span>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const count = keywordMap[tab.id].length;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all touch-auto',
                isActive
                  ? tab.colorClass
                  : 'text-muted-foreground border-border hover:bg-muted/60'
              )}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  isActive ? 'bg-current/20' : 'bg-muted'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Keyword chips */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeKeywords.length === 0 ? (
            <div className="text-center py-8">
              <activeTabConfig.icon className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">{activeTabConfig.emptyMsg}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeKeywords.map((kw, i) => (
                <KeywordChip
                  key={kw}
                  keyword={kw}
                  colorClass={activeTabConfig.colorClass}
                  delay={i * 0.03}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
