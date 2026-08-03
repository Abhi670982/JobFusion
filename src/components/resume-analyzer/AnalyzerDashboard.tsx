'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Sparkles, BarChart3, Target, FileText, Star, Briefcase, ShieldCheck,
  ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScoreRing } from './ScoreCard';
import type { AnalysisReport } from '@/lib/resume-analyzer';
import { cn } from '@/lib/utils';

interface AnalyzerDashboardProps {
  report: AnalysisReport;
  cached?: boolean;
  onReanalyze: () => void;
  reanalyzing?: boolean;
  onSelectBullet: (text: string, type: 'experience' | 'project' | 'summary', suggestedText?: string, rationale?: string) => void;
}

type DashboardTab = 'coach' | 'scores' | 'experience' | 'keywords' | 'grammar';

const SCORE_KEYS = ['overall', 'skills', 'ats', 'formatting', 'experience', 'projects', 'education', 'achievements', 'grammar'] as const;

const SCORE_WEIGHTS: Record<string, string> = {
  experience: '30% Weight',
  projects: '25% Weight',
  skills: '15% Weight',
  ats: '10% Weight',
  achievements: '10% Weight',
  education: '5% Weight',
  formatting: '5% Weight',
  grammar: '5% Weight',
  overall: 'Recruiter Weighted'
};

export function AnalyzerDashboard({ report, cached, onReanalyze, reanalyzing, onSelectBullet }: AnalyzerDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('coach');
  const [expandedScore, setExpandedScore] = useState<string | null>('overall');
  const [copiedText, setCopiedText] = useState(false);

  const formattedDate = new Date(report.analyzedAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  const maxPotentialScore = report.scores.overall?.expectedScoreAfterFix || report.overallScore;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const getPriorityColor = (p?: 'high' | 'medium' | 'low') => {
    if (p === 'high') return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    if (p === 'medium') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  };

  return (
    <div className="space-y-5 flex flex-col h-full overflow-hidden">
      {/* Top action details */}
      <div className="flex items-center justify-between gap-3 flex-shrink-0">
        <p className="text-[10px] text-muted-foreground">
          {cached ? '✓ Live Coach Report Cached' : '✓ Live Coach Report Synced'} · {formattedDate}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={onReanalyze}
          disabled={reanalyzing}
          className="rounded-xl gap-1.5 text-xs h-8 touch-auto"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', reanalyzing && 'animate-spin')} />
          {reanalyzing ? 'Consulting Coach…' : 'Ask Coach to Re-analyze'}
        </Button>
      </div>

      {/* Hero Header Overview */}
      <div className="card-premium p-5 bg-gradient-to-br from-card to-primary/3 border-primary/10 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-around">
          {/* Main Score Arc */}
          <ScoreRing
            score={report.overallScore}
            label="Recruiter Score"
            subtitle={
              <div className="text-[9px] font-bold text-muted-foreground mt-1">
                Optimized Potential: <span className="text-primary font-extrabold">{maxPotentialScore}</span>
              </div>
            }
            size={110}
            strokeWidth={9}
          />

          {/* Coach Identity stats & Shortlist badge */}
          <div className="space-y-2.5 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary">Candidate Category Benchmark</span>
                <h4 className="text-base font-bold text-foreground leading-tight truncate">{report.verdict?.careerCategory || report.seniority.title}</h4>
              </div>
              {report.verdict?.wouldShortlist && (
                <span className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border shadow-sm self-center sm:self-auto',
                  report.verdict.wouldShortlist === 'YES' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                  report.verdict.wouldShortlist === 'MAYBE' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                  report.verdict.wouldShortlist === 'NO' && 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                )}>
                  Shortlist: {report.verdict.wouldShortlist}
                </span>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-0.5">
              Resume Tier: <span className="font-semibold text-foreground">{report.verdict?.resumeTier || 'Tier 2 - Competitive Candidate'}</span>
            </p>
            
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                Shortlist Prob: {report.verdict?.shortlistingProbability || '75% Moderate'}
              </div>
              <div className="px-2 py-0.5 bg-primary/8 border border-primary/20 rounded-lg text-[9px] font-bold text-primary">
                ATS Pass: {report.verdict?.atsPassProbability || `${report.atsScore}%`}
              </div>
              <div className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                Market Rank: {report.verdict?.marketCompetitiveness || 'Top 25%'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coach Tab Selectors */}
      <div className="flex border-b border-border gap-1 flex-shrink-0 overflow-x-auto scrollbar-thin">
        {[
          { id: 'coach',     label: 'Recruiter Dashboard', icon: Sparkles },
          { id: 'scores',    label: 'Detailed Scores', icon: BarChart3 },
          { id: 'experience',label: 'Experience & Projects', icon: Briefcase },
          { id: 'keywords',  label: 'ATS Keywords', icon: Target },
          { id: 'grammar',   label: 'Summary & Grammar', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={cn(
                'px-3 py-2 text-xs font-bold border-b-2 capitalize transition-all whitespace-nowrap flex items-center gap-1.5 touch-auto',
                isActive
                  ? 'border-primary text-primary bg-primary/3'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Pane Audits */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-4">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: EXECUTIVE RECRUITER DASHBOARD */}
          {activeTab === 'coach' && (
            <motion.div key="coach" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Senior Recruiter Shortlist Banner */}
              {report.verdict && (
                <div className="card-premium p-4 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">Senior Recruiter Shortlist Verdict</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                        Category: {report.verdict.careerCategory}
                      </span>
                      <span className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border shadow-sm',
                        report.verdict.wouldShortlist === 'YES' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                        report.verdict.wouldShortlist === 'MAYBE' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                        report.verdict.wouldShortlist === 'NO' && 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                      )}>
                        Shortlist: {report.verdict.wouldShortlist}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">{report.verdict.verdict}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
                    <div className="p-2 bg-muted/40 rounded-lg border border-border/40">
                      <span className="text-muted-foreground block font-medium">Shortlisting Prob:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">{report.verdict.shortlistingProbability}</span>
                    </div>
                    <div className="p-2 bg-muted/40 rounded-lg border border-border/40">
                      <span className="text-muted-foreground block font-medium">ATS Pass Prob:</span>
                      <span className="font-extrabold text-primary text-xs">{report.verdict.atsPassProbability}</span>
                    </div>
                    <div className="p-2 bg-muted/40 rounded-lg border border-border/40">
                      <span className="text-muted-foreground block font-medium">Market Rank:</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs truncate block">{report.verdict.marketCompetitiveness}</span>
                    </div>
                    <div className="p-2 bg-muted/40 rounded-lg border border-border/40">
                      <span className="text-muted-foreground block font-medium">Resume Tier:</span>
                      <span className="font-extrabold text-foreground text-xs truncate block">{report.verdict.resumeTier}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground pt-1 italic border-t border-border/40">
                    <span className="font-semibold text-foreground">Peer Category Benchmark:</span> {report.verdict.peerBenchmarkComparison}
                  </div>
                </div>
              )}

              {/* Highest ROI Improvement Spotlight Card */}
              {report.verdict?.highestROIImprovement && (
                <div className="card-premium p-4 bg-gradient-to-br from-emerald-500/5 via-card to-card border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">#1 Highest ROI Fix for Shortlisting</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                      +{report.verdict.highestROIImprovement.scoreGain} Points ({report.verdict.highestROIImprovement.shortlistGain} Shortlist Boost)
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-foreground">{report.verdict.highestROIImprovement.title}</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">{report.verdict.highestROIImprovement.action}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Current Score: <span className="font-bold text-foreground">{report.verdict.highestROIImprovement.currentScore}</span></span>
                      <span className="text-muted-foreground">→ Expected: <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{report.verdict.highestROIImprovement.expectedScore}</span></span>
                    </div>
                    <span className="text-muted-foreground italic">{report.verdict.highestROIImprovement.rationale}</span>
                  </div>
                </div>
              )}

              {/* Top Strengths & Biggest Weakness Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card-premium p-4 space-y-2">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Top Candidate Strengths</span>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    {(report.verdict?.topStrengths || report.coach.strengths).map((s, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground leading-relaxed">{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="card-premium p-4 bg-red-500/3 border-red-500/20 space-y-2">
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider block">Primary Bottleneck (Biggest Weakness)</span>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    {report.verdict?.biggestWeakness || 'Lack of quantified metric outputs in work experience statements.'}
                  </p>
                </div>
              </div>

              {/* ROI Improvement Matrix Table */}
              {report.verdict?.roiImprovements && report.verdict.roiImprovements.length > 0 && (
                <div className="card-premium p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="font-bold text-xs text-foreground">Actionable ROI Improvement Matrix</span>
                    <span className="text-[10px] text-muted-foreground">Sorted by Shortlist Impact</span>
                  </div>

                  <div className="space-y-2.5">
                    {report.verdict.roiImprovements.map((item, idx) => (
                      <div key={idx} className="p-3 bg-muted/30 rounded-xl border border-border/40 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] rounded border border-emerald-500/30">
                              +{item.scoreGain} Points
                            </span>
                            <h5 className="font-bold text-xs text-foreground">{item.title}</h5>
                          </div>
                          <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                            {item.shortlistGain} Shortlist Gain
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">{item.action}</p>

                        <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-border/40">
                          <span className="text-muted-foreground">
                            Category: <span className="font-semibold text-foreground">{item.category}</span> · Score Transition: <span className="font-bold text-foreground">{item.currentScore}</span> → <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{item.expectedScore}</span>
                          </span>
                          <span className="text-muted-foreground italic">{item.rationale}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recruiter Impression */}
              <div className="card-premium p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Star className="w-4 h-4" />
                  <span>Executive Impression Summary</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{report.coach.recruiterImpression}</p>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase">Target Roles:</span>
                    <p className="text-[11px] font-medium text-foreground leading-tight">{report.coach.mostSuitableRoles.join(', ')}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-red-500 uppercase">Roles to Avoid:</span>
                    <p className="text-[11px] font-medium text-foreground leading-tight">{report.coach.rolesToAvoid.join(', ')}</p>
                  </div>
                </div>
              </div>

              {/* AI Parser Confidence Audit */}
              <div className="card-premium p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">AI Parser Extraction Audit</span>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{report.confidenceScore}% Confidence</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{report.confidenceReason}</p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card-premium p-4 space-y-2">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Resume Strengths</span>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    {report.coach.strengths.map((s, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground leading-relaxed">{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="card-premium p-4 space-y-2">
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider block">Resume Weaknesses</span>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    {report.coach.weaknesses.map((w, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground leading-relaxed">{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Collapsible Action Checklist */}
              <div className="card-premium p-4 space-y-3">
                <span className="font-bold text-xs border-b border-border pb-2 block">AI Action Checklist</span>
                
                <div className="space-y-2">
                  {report.coach.recommendations.learning.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-primary uppercase block">1. Skills to Acquire</span>
                      <ul className="list-disc list-inside pl-1 space-y-0.5">
                        {report.coach.recommendations.learning.map((l, i) => <li key={i} className="text-xs text-muted-foreground">{l}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.coach.recommendations.portfolio.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-border/40">
                      <span className="text-[9px] font-bold text-primary uppercase block">2. Portfolio Adjustments</span>
                      <ul className="list-disc list-inside pl-1 space-y-0.5">
                        {report.coach.recommendations.portfolio.map((p, i) => <li key={i} className="text-xs text-muted-foreground">{p}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.coach.recommendations.github.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-border/40">
                      <span className="text-[9px] font-bold text-primary uppercase block">3. GitHub Cleanups</span>
                      <ul className="list-disc list-inside pl-1 space-y-0.5">
                        {report.coach.recommendations.github.map((g, i) => <li key={i} className="text-xs text-muted-foreground">{g}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.coach.recommendations.linkedin.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-border/40">
                      <span className="text-[9px] font-bold text-primary uppercase block">4. LinkedIn Optimization</span>
                      <ul className="list-disc list-inside pl-1 space-y-0.5">
                        {report.coach.recommendations.linkedin.map((l, i) => <li key={i} className="text-xs text-muted-foreground">{l}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Roadmaps Steps Timeline */}
              <div className="card-premium p-4 space-y-3">
                <span className="font-bold text-xs border-b border-border pb-2 block">Prioritized Improvement Roadmap</span>
                <div className="relative pl-6 space-y-4 border-l border-border/80 ml-2 pt-2">
                  {report.roadmap.map((step, idx) => (
                    <div key={idx} className="relative space-y-1">
                      {/* Circle indicator */}
                      <div className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full bg-primary border-4 border-card" />
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border', getPriorityColor(step.priority))}>
                          {step.priority}
                        </span>
                        <h5 className="font-bold text-xs text-foreground">{step.title}</h5>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{step.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: SCORE BREAKDOWN & PERSPECTIVES */}
          {activeTab === 'scores' && (
            <motion.div key="scores" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {SCORE_KEYS.map(key => {
                const detail = report.scores[key];
                if (!detail) return null;
                const isExpanded = expandedScore === key;
                const weightLabel = SCORE_WEIGHTS[key];
                return (
                  <div
                    key={key}
                    className={cn(
                      'card-premium overflow-hidden transition-all duration-200',
                      isExpanded ? 'border-primary/20 bg-primary/2' : 'hover:border-border/80'
                    )}
                  >
                    <button
                      onClick={() => setExpandedScore(isExpanded ? null : key)}
                      className="w-full flex items-center justify-between p-4 text-left touch-auto"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-xs capitalize text-foreground">{key} Score</span>
                        {weightLabel && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {weightLabel}
                          </span>
                        )}
                        <span className={cn('text-[8px] uppercase font-extrabold px-1.5 py-0.5 rounded border', getPriorityColor(detail.priority))}>
                          {detail.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{detail.score} / {detail.maxScore}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 space-y-3"
                        >
                          <div className="h-px bg-border/40" />
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground">Why this score:</span> {detail.reason}
                          </p>

                          {detail.evidence && detail.evidence.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-border/40">
                              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase block">Evidence Extracted from Resume:</span>
                              <div className="space-y-1">
                                {detail.evidence.map((quote, i) => (
                                  <div key={i} className="text-[11px] italic bg-muted/40 p-2 rounded border border-border/40 text-foreground">
                                    "{quote}"
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {detail.positives.length > 0 && (
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-emerald-600 uppercase block">Positives:</span>
                              <ul className="list-disc list-inside pl-1">
                                {detail.positives.map((p, i) => <li key={i} className="text-xs text-muted-foreground">{p}</li>)}
                              </ul>
                            </div>
                          )}

                          {detail.problems.length > 0 && (
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-red-500 uppercase block">Problems Detected:</span>
                              <ul className="list-disc list-inside pl-1">
                                {detail.problems.map((p, i) => <li key={i} className="text-xs text-muted-foreground">{p}</li>)}
                              </ul>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-primary uppercase block">Recruiter Review:</span>
                              <p className="text-[11px] text-muted-foreground leading-normal">{detail.recruiterPerspective}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-primary uppercase block">ATS Check:</span>
                              <p className="text-[11px] text-muted-foreground leading-normal">{detail.atsPerspective}</p>
                            </div>
                          </div>

                          {detail.missingSkills && detail.missingSkills.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-border/40">
                              <span className="text-[9px] font-bold text-red-500 uppercase block">Critical Missing Skills:</span>
                              <div className="flex flex-wrap gap-1">
                                {detail.missingSkills.map(s => (
                                  <span key={s} className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-semibold">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-border/40 flex justify-between items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span>Expected Score after optimizations:</span>
                            <span>{detail.expectedScoreAfterFix} / 100</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* TAB 3: EXPERIENCE & PROJECTS AUDIT */}
          {activeTab === 'experience' && (
            <motion.div key="experience" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Job experience audits */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs flex items-center gap-1.5 text-primary px-1">
                  <Briefcase className="w-4 h-4" />
                  <span>Work Experience Line Audit</span>
                </h4>
                {report.experienceAnalysis.map((job, idx) => (
                  <div key={idx} className="card-premium p-4 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div>
                        <h5 className="font-bold text-xs">{job.role}</h5>
                        <p className="text-[10px] text-muted-foreground">{job.company} · {job.period}</p>
                      </div>
                    </div>

                    {/* Evaluations maps */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] leading-relaxed bg-muted/30 p-2.5 rounded-xl border">
                      <div><span className="font-bold text-primary">Impact:</span> {job.evaluations.impact}</div>
                      <div><span className="font-bold text-primary">Leadership:</span> {job.evaluations.leadership}</div>
                      <div><span className="font-bold text-primary">Ownership:</span> {job.evaluations.ownership}</div>
                      <div><span className="font-bold text-primary">Achievements:</span> {job.evaluations.achievements}</div>
                      <div className="col-span-2 border-t border-border/40 pt-1 mt-1"><span className="font-bold text-primary">Business Value:</span> {job.evaluations.businessValue}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <span className="font-bold text-primary block">Recruiter Impression:</span>
                        <p className="text-muted-foreground mt-0.5 leading-normal">{job.recruiterImpression}</p>
                      </div>
                      <div>
                        <span className="font-bold text-primary block">ATS Compatibility:</span>
                        <p className="text-muted-foreground mt-0.5 leading-normal">{job.atsCompatibility}</p>
                      </div>
                    </div>

                    {/* Bullet list suggestions */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground block">Select weak lines below to optimize:</span>
                      {job.bulletSuggestions.map((suggestion, sIdx) => (
                        <div
                          key={sIdx}
                          onClick={() => onSelectBullet(suggestion.original, 'experience', suggestion.improved, suggestion.rationale)}
                          className="p-2.5 border border-dashed border-border/80 hover:border-primary/40 hover:bg-primary/3 rounded-lg cursor-pointer transition-colors space-y-1.5 group"
                        >
                          <p className="text-xs leading-normal text-muted-foreground group-hover:text-foreground line-clamp-2">
                            "{suggestion.original}"
                          </p>
                          <div className="flex items-center justify-between text-[9px] font-bold text-primary">
                            <span>⚡ Optimize with AI Coach</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Select Line →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Projects audit */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs flex items-center gap-1.5 text-primary px-1">
                  <Star className="w-4 h-4" />
                  <span>Project Evaluations</span>
                </h4>
                {report.projectAnalysis.map((proj, idx) => (
                  <div key={idx} className="card-premium p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div>
                        <h5 className="font-bold text-xs">{proj.projectName}</h5>
                        <p className="text-[10px] text-muted-foreground">Complexity: <span className="font-semibold text-foreground">{proj.complexity}</span></p>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full">
                        Audit: {proj.score}%
                      </span>
                    </div>

                    <div className="space-y-2 text-[10px] leading-relaxed">
                      <div><span className="font-bold text-primary">Manager Review:</span> <span className="text-muted-foreground">{proj.recruiterImpression}</span></div>
                      <div><span className="font-bold text-primary">Business Value:</span> <span className="text-muted-foreground">{proj.missingBusinessImpact}</span></div>
                      {proj.missingMetrics.length > 0 && (
                        <div><span className="font-bold text-primary">Metrics Missing:</span> <span className="text-red-500 font-semibold">{proj.missingMetrics.join(', ')}</span></div>
                      )}
                      {proj.missingActionVerbs.length > 0 && (
                        <div><span className="font-bold text-primary">Suggested Verbs:</span> <span className="text-primary font-semibold">{proj.missingActionVerbs.join(', ')}</span></div>
                      )}
                    </div>

                    <div className="space-y-2 pt-1">
                      {proj.suggestions.map((suggestion, sIdx) => (
                        <div
                          key={sIdx}
                          onClick={() => onSelectBullet(suggestion.original, 'project', suggestion.improved, suggestion.rationale)}
                          className="p-2.5 border border-dashed border-border/80 hover:border-primary/40 hover:bg-primary/3 rounded-lg cursor-pointer transition-colors space-y-1 group"
                        >
                          <p className="text-xs leading-normal text-muted-foreground group-hover:text-foreground line-clamp-2">
                            "{suggestion.original}"
                          </p>
                          <div className="flex items-center justify-between text-[9px] font-bold text-primary">
                            <span>⚡ Optimize Project Description</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Select Line →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: ATS KEYWORDS */}
          {activeTab === 'keywords' && (
            <motion.div key="keywords" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="card-premium p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-bold text-xs">Target Matches & Missing Keywords</h4>
                  <span className="text-[10px] text-muted-foreground">Density: {(report.keywords.density * 100).toFixed(1)}%</span>
                </div>

                <div className="space-y-2.5">
                  {report.keywords.detailedList.map(kw => (
                    <div
                      key={kw.term}
                      className={cn(
                        'p-3 border rounded-xl space-y-1.5 transition-colors',
                        kw.status === 'missing'
                          ? 'border-red-500/20 bg-red-500/4'
                          : kw.status === 'weak'
                          ? 'border-amber-500/20 bg-amber-500/4'
                          : 'border-emerald-500/20 bg-emerald-500/4'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{kw.term}</span>
                          <span className="text-[8px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground border">
                            {kw.category}
                          </span>
                        </div>
                        {kw.status === 'missing' && (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400">+{kw.estimatedAtsImpact} pts ATS match</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground">Importance ({kw.importance}):</span> {kw.recruiterReason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: GRAMMAR & SUMMARY REVIEW */}
          {activeTab === 'grammar' && (
            <motion.div key="grammar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Summary Audit */}
              <div className="card-premium p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-bold text-xs">Summary Review</h4>
                  <span className="text-xs font-bold text-foreground">Score: {report.summaryReview.score}/100</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] leading-relaxed bg-muted/30 p-2.5 rounded-xl border">
                  <div><span className="font-bold text-primary">Professionalism:</span> {report.summaryReview.professionalism}</div>
                  <div><span className="font-bold text-primary">Confidence:</span> {report.summaryReview.confidence}</div>
                  <div><span className="font-bold text-primary">Readability:</span> {report.summaryReview.readability}</div>
                  <div><span className="font-bold text-primary">Appeal:</span> {report.summaryReview.recruiterAppeal}</div>
                </div>

                {/* suggested summary */}
                <div className="p-3 bg-primary/4 border border-primary/20 rounded-xl space-y-2 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-primary uppercase">Optimized Summary Rewrite:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(report.summaryReview.suggestedRewrite)}
                      className="h-6 gap-1 text-[10px] touch-auto"
                    >
                      {copiedText ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedText ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed italic">"{report.summaryReview.suggestedRewrite}"</p>
                </div>
              </div>

              {/* Grammar warnings */}
              {(report.grammar.passiveVoiceLines.length > 0 || report.grammar.weakWordings.length > 0 || report.grammar.repetitivePhrases.length > 0) && (
                <div className="card-premium p-4 space-y-3">
                  <h4 className="font-bold text-xs border-b border-border pb-2">Grammar & Word Choice Audits</h4>
                  
                  {report.grammar.passiveVoiceLines.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-red-500 uppercase block">Passive Voice Detected (Change to Active):</span>
                      <ul className="list-disc list-inside space-y-0.5 pl-1">
                        {report.grammar.passiveVoiceLines.map((l, i) => <li key={i} className="text-xs text-muted-foreground italic">"{l}"</li>)}
                      </ul>
                    </div>
                  )}

                  {report.grammar.weakWordings.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-border/40">
                      <span className="text-[9px] font-bold text-amber-500 uppercase block">Weak Wordings:</span>
                      <ul className="list-disc list-inside space-y-0.5 pl-1">
                        {report.grammar.weakWordings.map((w, i) => <li key={i} className="text-xs text-muted-foreground">{w}</li>)}
                      </ul>
                    </div>
                  )}

                  {report.grammar.repetitivePhrases.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-border/40">
                      <span className="text-[9px] font-bold text-amber-500 uppercase block">Repetitive Phrases:</span>
                      <ul className="list-disc list-inside space-y-0.5 pl-1">
                        {report.grammar.repetitivePhrases.map((r, i) => <li key={i} className="text-xs text-muted-foreground">{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
