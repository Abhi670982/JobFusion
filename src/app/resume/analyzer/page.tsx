'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Upload, AlertCircle, ArrowLeft, Target, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  AnalyzingScreen,
  AnalyzerDashboard,
  PremiumAccessModal,
  ResumePreview,
  ActionPlayground
} from '@/components/resume-analyzer';
import type { AnalysisReport } from '@/lib/resume-analyzer';

type PageState = 'loading' | 'no-resume' | 'no-access' | 'idle' | 'analyzing' | 'results' | 'error';

interface StatusData {
  isPro: boolean;
  hasResume: boolean;
  hasAccess: boolean;
  resumeName: string | null;
  resumeCategory: string | null;
  resumeUpdatedAt: string | null;
  existingAnalysis: {
    overallScore: number;
    atsScore: number;
    createdAt: string;
    updatedAt: string;
  } | null;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-muted rounded-xl w-48" />
      <div className="h-64 bg-muted rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-36 bg-muted rounded-2xl" />
        ))}
      </div>
      <div className="h-48 bg-muted rounded-2xl" />
    </div>
  );
}

// ── Empty states ──────────────────────────────────────────────────────────────

function NoResumeState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-12 text-center space-y-4 max-w-md mx-auto"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
        <Upload className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2">No Resume Uploaded</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Upload your resume to unlock the full Resume Analyzer. We support PDF and DOCX files.
        </p>
      </div>
      <Button asChild className="rounded-xl gradient-brand text-white border-0 shadow-md">
        <Link href="/resume">
          <Upload className="w-4 h-4 mr-2" />
          Upload Resume
        </Link>
      </Button>
    </motion.div>
  );
}

function ReadyToAnalyzeState({
  status,
  onAnalyze,
}: {
  status: StatusData;
  onAnalyze: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-10 text-center space-y-6 max-w-lg mx-auto"
    >
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-3xl gradient-cta flex items-center justify-center mx-auto shadow-xl"
      >
        <Brain className="w-10 h-10 text-white" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold">Ready to Analyze</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {status.resumeName && (
            <span className="block font-medium text-foreground mb-1">{status.resumeName}</span>
          )}
          Our AI will examine every section, keyword, and skill in your resume and give you a comprehensive score with actionable improvements.
        </p>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/50 text-xs font-semibold text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Powered by JobFusion AI
      </div>

      <Button
        onClick={onAnalyze}
        className="w-full rounded-xl gradient-brand text-white border-0 font-semibold shadow-md hover:opacity-90 h-12 text-base"
        id="start-analysis-btn"
      >
        <Brain className="w-5 h-5 mr-2" />
        Analyze My Resume
      </Button>

      <p className="text-xs text-muted-foreground">Usually takes 15–30 seconds</p>
    </motion.div>
  );
}

// ── Main Page Controller ──────────────────────────────────────────────────────

export default function ResumeAnalyzerPage() {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [status, setStatus] = useState<StatusData | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  // Job Description Matching Panel State
  const [jdPanelOpen, setJdPanelOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  // Selected audit line for playground
  const [selectedAudit, setSelectedAudit] = useState<{
    originalText: string;
    sectionType: 'experience' | 'project' | 'summary';
    suggestedBullet?: string;
    suggestedRationale?: string;
  } | null>(null);

  const runAnalysis = async (forceReanalyze = false, silent = false) => {
    if (!silent) setPageState('analyzing');
    setError(null);
    setSelectedAudit(null); // Reset selection

    try {
      const res = await fetch('/api/resume-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceReanalyze, jobDescription }),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.code === 'REQUIRES_PREMIUM_OR_BYOK' || data.code === 'AI_LIMIT_REACHED') {
          setPageState('no-access');
          setPremiumModalOpen(true);
          return;
        }
        throw new Error(data.error || 'Analysis failed.');
      }

      setReport(data.data as AnalysisReport);
      setCached(data.cached ?? false);

      // Fetch profile details to show Left Pane text preview
      const profileRes = await fetch('/api/profile');
      const profileData = await profileRes.json();
      if (profileData.success && profileData.data?.resumeText) {
        setResumeText(profileData.data.resumeText);
      }

      setPageState('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
      setPageState(report ? 'results' : 'error');
    }
  };

  // Load Status initially
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch('/api/resume-analyzer/status');
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        const s: StatusData = data.data;
        setStatus(s);

        if (!s.hasResume) {
          setPageState('no-resume');
        } else if (!s.hasAccess) {
          setPageState('no-access');
          setPremiumModalOpen(true);
        } else if (s.existingAnalysis) {
          // Trigger silent cached load
          await runAnalysis(false, true);
        } else {
          setPageState('idle');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load status.');
        setPageState('error');
      }
    }
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReanalyze = () => runAnalysis(true);

  // Parse audit bullet highlights from experience and project lists
  const auditBullets: Array<{ original: string; type: 'experience' | 'project' | 'summary' }> = [];
  if (report) {
    (report.experienceAnalysis || []).forEach(job => {
      (job.bulletSuggestions || []).forEach(s => {
        auditBullets.push({ original: s.original, type: 'experience' });
      });
    });
    (report.projectAnalysis || []).forEach(proj => {
      (proj.suggestions || []).forEach(s => {
        auditBullets.push({ original: s.original, type: 'project' });
      });
    });
  }

  // Right pane callback selecting highlighted text
  const handleSelectText = (text: string, type: 'experience' | 'project' | 'summary') => {
    // Find suggest bullets matching the click line
    let suggestedBullet = '';
    let suggestedRationale = '';

    if (report) {
      if (type === 'experience') {
        (report.experienceAnalysis || []).forEach(job => {
          const match = (job.bulletSuggestions || []).find(s => s.original === text);
          if (match) {
            suggestedBullet = match.improved;
            suggestedRationale = match.rationale;
          }
        });
      } else if (type === 'project') {
        (report.projectAnalysis || []).forEach(proj => {
          const match = (proj.suggestions || []).find(s => s.original === text);
          if (match) {
            suggestedBullet = match.improved;
            suggestedRationale = match.rationale;
          }
        });
      }
    }

    setSelectedAudit({
      originalText: text,
      sectionType: type,
      suggestedBullet,
      suggestedRationale
    });
  };

  return (
    <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full flex flex-col min-h-screen">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/resume"
            className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors touch-auto"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Resume Analyzer <span className="text-xs px-2 py-0.5 rounded-full gradient-brand text-white">PRO</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Optimized for job callbacks and ATS compatibility</p>
          </div>
        </div>
        {pageState === 'results' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Audit Active
          </div>
        )}
      </div>

      {/* Target JD Matcher Accordion Card */}
      {pageState === 'results' && (
        <div className="mb-4 card-premium border-primary/10 overflow-hidden flex-shrink-0">
          <button
            onClick={() => setJdPanelOpen(!jdPanelOpen)}
            className="w-full flex items-center justify-between p-4 text-xs font-bold text-foreground touch-auto"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span>Target Mode: Match against specific Job Description</span>
            </div>
            {jdPanelOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {jdPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 space-y-3"
              >
                <div className="h-px bg-border/40" />
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description here (e.g. key technologies, responsibilities, years of experience)..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground focus:outline-primary/40 scrollbar-thin resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setJobDescription(''); }}
                    className="h-8 text-[11px]"
                  >
                    Clear Matcher
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { setJdPanelOpen(false); runAnalysis(true); }}
                    className="h-8 text-[11px] gradient-brand text-white border-0 shadow"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Match Resume Against JD
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 flex-shrink-0"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main split dashboard view */}
      <div className="flex-1 min-h-[500px]">
        <AnimatePresence mode="wait">
          {pageState === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DashboardSkeleton />
            </motion.div>
          )}

          {pageState === 'no-resume' && (
            <motion.div key="no-resume" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <NoResumeState />
            </motion.div>
          )}

          {pageState === 'no-access' && !premiumModalOpen && (
            <motion.div
              key="no-access"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <Button onClick={() => setPremiumModalOpen(true)} className="rounded-xl gradient-brand text-white border-0">
                Unlock Premium Analyzer
              </Button>
            </motion.div>
          )}

          {pageState === 'idle' && status && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReadyToAnalyzeState status={status} onAnalyze={() => runAnalysis(false)} />
            </motion.div>
          )}

          {pageState === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnalyzingScreen visible />
            </motion.div>
          )}

          {pageState === 'results' && report && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-190px)] min-h-[600px] items-stretch pb-4"
            >
              {/* Left Pane (Scrollable text highlights) */}
              <div className="h-full overflow-hidden">
                <ResumePreview
                  resumeText={resumeText}
                  auditBullets={auditBullets}
                  selectedText={selectedAudit ? selectedAudit.originalText : null}
                  onSelectText={handleSelectText}
                />
              </div>

              {/* Right Pane (Dashboard tabbed audit, seniority charts, action playgrounds) */}
              <div className="h-full overflow-hidden flex flex-col space-y-4">
                {selectedAudit ? (
                  <div className="flex-1 overflow-y-auto">
                    <ActionPlayground
                      originalText={selectedAudit.originalText}
                      sectionType={selectedAudit.sectionType}
                      suggestedBullet={selectedAudit.suggestedBullet}
                      suggestedRationale={selectedAudit.suggestedRationale}
                      onClose={() => setSelectedAudit(null)}
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden">
                    <AnalyzerDashboard
                      report={report}
                      cached={cached}
                      onReanalyze={handleReanalyze}
                      reanalyzing={false}
                      onSelectBullet={handleSelectText}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {pageState === 'error' && !report && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 space-y-4"
            >
              <AlertCircle className="w-12 h-12 mx-auto text-destructive/50" />
              <p className="text-sm text-muted-foreground">Something went wrong during analysis.</p>
              <Button onClick={() => runAnalysis(false)} className="rounded-xl gradient-brand text-white border-0">
                Retry Analysis
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Premium Gated Modal */}
      <PremiumAccessModal
        open={premiumModalOpen}
        onClose={() => {
          setPremiumModalOpen(false);
          if (pageState === 'no-access') setPageState('no-access');
        }}
      />
    </main>
  );
}
