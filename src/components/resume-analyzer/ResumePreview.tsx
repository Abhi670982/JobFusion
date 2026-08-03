'use client';

import { motion } from 'framer-motion';
import { Sparkles, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumePreviewProps {
  resumeText: string;
  auditBullets: Array<{ original: string; type: 'experience' | 'project' | 'summary' }>;
  selectedText: string | null;
  onSelectText: (text: string, type: 'experience' | 'project' | 'summary') => void;
}

export function ResumePreview({ resumeText, auditBullets, selectedText, onSelectText }: ResumePreviewProps) {
  if (!resumeText) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted/20 border border-dashed rounded-2xl h-full min-h-[300px]">
        <FileText className="w-10 h-10 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">Preview text is unavailable.</p>
      </div>
    );
  }

  // Pre-split text by lines to parse structure
  const lines = resumeText.split('\n');

  return (
    <div className="card-premium h-full flex flex-col overflow-hidden bg-card border-border">
      {/* Pane Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">Resume Document Preview</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>Interactive Audit</span>
        </div>
      </div>

      {/* Pane Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-2 font-mono text-xs leading-relaxed selection:bg-primary/20 scrollbar-thin">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-3" />;

          // Check if this line is audited
          const match = auditBullets.find(bullet => 
            trimmed.toLowerCase().includes(bullet.original.trim().toLowerCase()) ||
            bullet.original.trim().toLowerCase().includes(trimmed.toLowerCase()) && trimmed.length > 10
          );

          // Header line formatting
          const isHeader = 
            trimmed === trimmed.toUpperCase() && 
            trimmed.length > 3 && 
            trimmed.length < 35 ||
            /^(education|experience|work|skills|projects|certifications|achievements|summary)/i.test(trimmed);

          if (match) {
            const isSelected = selectedText === match.original;
            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.008 }}
                onClick={() => onSelectText(match.original, match.type)}
                className={cn(
                  'relative pl-7 pr-3 py-1.5 rounded-lg cursor-pointer transition-all border group',
                  isSelected 
                    ? 'bg-primary/10 border-primary/30 text-foreground'
                    : 'bg-primary/3 border-transparent hover:border-primary/20 text-muted-foreground hover:text-foreground'
                )}
              >
                {/* Highlight icon indicator */}
                <div className="absolute left-2.5 top-2">
                  <Sparkles className={cn(
                    'w-3 h-3 transition-colors',
                    isSelected ? 'text-primary' : 'text-primary/40 group-hover:text-primary/70'
                  )} />
                </div>
                {line}
              </motion.div>
            );
          }

          return (
            <div 
              key={idx} 
              className={cn(
                'px-3 py-0.5 text-muted-foreground/80',
                isHeader && 'text-foreground font-extrabold text-sm border-b border-border/40 pb-1 mt-4 mb-2 font-sans tracking-wide'
              )}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
}
