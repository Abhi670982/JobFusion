'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Copy, Check, AlertCircle, Wand2, Plus, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionPlaygroundProps {
  originalText: string;
  sectionType: 'experience' | 'project' | 'summary';
  suggestedBullet?: string;
  suggestedRationale?: string;
  onClose?: () => void;
}

export function ActionPlayground({ originalText, sectionType, suggestedBullet, suggestedRationale, onClose }: ActionPlaygroundProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customSuggestions, setCustomSuggestions] = useState<string[]>([]);
  const [selectedVerbs, setSelectedVerbs] = useState<string[]>([]);

  const handleAction = async (actionType: 'rewrite-bullet' | 'rewrite-summary' | 'add-metrics' | 'suggest-verbs') => {
    setLoading(true);
    setError(null);
    setCustomSuggestions([]);
    setSelectedVerbs([]);

    try {
      const res = await fetch('/api/resume-analyzer/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType,
          originalText,
          context: `Target: professional resume improvement for a ${sectionType} segment.`
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Rewriting failed.');

      const output = data.data as string;
      if (actionType === 'suggest-verbs') {
        setSelectedVerbs(output.split(',').map(v => v.trim()));
      } else if (actionType === 'rewrite-summary') {
        setCustomSuggestions(output.split('---SEPARATOR---').map(s => s.trim()));
      } else {
        setCustomSuggestions(output.split('\n').map(s => s.trim()).filter(Boolean));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="card-premium p-5 space-y-4 border-primary/20 bg-gradient-to-br from-card via-card to-primary/2">
      {/* Playground Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary animate-pulse" />
          <h4 className="font-bold text-sm text-foreground">AI Rewrite Playground</h4>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs touch-auto">
            Clear Selection
          </Button>
        )}
      </div>

      {/* Selected Text Context */}
      <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-1.5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Original Line selected:</p>
        <p className="text-xs italic text-foreground leading-relaxed">"{originalText}"</p>
      </div>

      {/* Static Suggestions if provided by analyzer */}
      {suggestedBullet && customSuggestions.length === 0 && !loading && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Default Audit Rewrite:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(suggestedBullet, -1)}
              className="h-6 gap-1 text-[10px] hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 touch-auto"
            >
              {copiedIndex === -1 ? (
                <><Check className="w-3 h-3" />Copied</>
              ) : (
                <><Copy className="w-3 h-3" />Copy</>
              )}
            </Button>
          </div>
          <p className="text-xs text-foreground font-semibold leading-relaxed">"{suggestedBullet}"</p>
          {suggestedRationale && (
            <p className="text-[10px] text-muted-foreground leading-relaxed pt-1.5 border-t border-emerald-500/10">
              💡 {suggestedRationale}
            </p>
          )}
        </div>
      )}

      {/* Live Actions Toolbox */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI Toolbox:</p>
        <div className="flex gap-2 flex-wrap">
          {sectionType !== 'summary' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('rewrite-bullet')}
                disabled={loading}
                className="h-8 rounded-lg text-xs gap-1.5 touch-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                STAR Rewrite
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('add-metrics')}
                disabled={loading}
                className="h-8 rounded-lg text-xs gap-1.5 touch-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Metrics
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('suggest-verbs')}
                disabled={loading}
                className="h-8 rounded-lg text-xs gap-1.5 touch-auto"
              >
                <Type className="w-3.5 h-3.5" />
                Action Verbs
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('rewrite-summary')}
              disabled={loading}
              className="h-8 rounded-lg text-xs gap-1.5 touch-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Optimize Summary
            </Button>
          )}
        </div>
      </div>

      {/* Loading & Error States */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-8 gap-2 text-xs text-muted-foreground"
          >
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Generating suggestions...</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Verb Chips */}
      {selectedVerbs.length > 0 && !loading && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Stronger Action Verbs:</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedVerbs.map((verb, idx) => (
              <span
                key={verb}
                onClick={() => copyToClipboard(verb, idx + 100)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border bg-muted/60 text-xs font-semibold cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors"
              >
                {copiedIndex === idx + 100 ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  verb
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom generated options */}
      {customSuggestions.length > 0 && !loading && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI Generated Options:</p>
          <div className="space-y-2.5">
            {customSuggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="p-3 border border-border bg-card rounded-xl hover:border-primary/20 transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Option {idx + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(suggestion, idx)}
                    className="h-6 gap-1 text-[10px] opacity-70 group-hover:opacity-100 touch-auto"
                  >
                    {copiedIndex === idx ? (
                      <><Check className="w-3 h-3 text-emerald-500" />Copied</>
                    ) : (
                      <><Copy className="w-3 h-3" />Copy Option</>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-foreground leading-relaxed">"{suggestion}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
