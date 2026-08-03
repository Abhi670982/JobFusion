'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Brain, CheckCircle2, Loader2 } from 'lucide-react';

const STEPS = [
  { id: 'load',     label: 'Loading resume text',           duration: 800  },
  { id: 'ats',      label: 'Running ATS compatibility check', duration: 1400 },
  { id: 'keywords', label: 'Analyzing keyword density',     duration: 1200 },
  { id: 'skills',   label: 'Evaluating skills & experience', duration: 1600 },
  { id: 'ai',       label: 'Deep AI analysis in progress',   duration: 4000 },
  { id: 'suggest',  label: 'Generating improvement plan',   duration: 1200 },
  { id: 'report',   label: 'Building your report',          duration: 800  },
];

const TIPS = [
  'Resumes with 5+ quantified achievements get 40% more interviews.',
  'Including LinkedIn increases recruiter outreach by 71%.',
  'ATS systems reject up to 75% of resumes before a human sees them.',
  'Action verbs like "Led", "Built", "Reduced" make bullets 3x more impactful.',
  'Tailoring keywords to each job description doubles callback rates.',
  'The ideal resume length is 1 page for under 5 years of experience.',
  'GitHub links increase technical recruiter engagement by 50%.',
  'Resumes with a professional summary get read 19% more often.',
];

interface AnalyzingScreenProps {
  visible: boolean;
}

export function AnalyzingScreen({ visible }: AnalyzingScreenProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    if (!visible) {
      setActiveStep(0);
      setCompletedSteps([]);
      return;
    }

    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEPS.forEach((step, idx) => {
      const t = setTimeout(() => {
        setActiveStep(idx);
        if (idx > 0) setCompletedSteps(prev => [...prev, STEPS[idx - 1].id]);
      }, elapsed);
      timers.push(t);
      elapsed += step.duration;
    });

    return () => timers.forEach(clearTimeout);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % TIPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [visible]);

  // Overall progress percentage
  const totalDuration = STEPS.reduce((s, st) => s + st.duration, 0);
  let elapsedUpToActive = 0;
  for (let i = 0; i < activeStep; i++) elapsedUpToActive += STEPS[i].duration;
  const progress = Math.min(95, Math.round((elapsedUpToActive / totalDuration) * 100));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4 space-y-10"
        >
          {/* Animated brain icon */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="w-24 h-24 rounded-3xl gradient-cta flex items-center justify-center shadow-2xl">
              <Brain className="w-12 h-12 text-white" />
            </div>
            {/* Pulsing rings */}
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-3xl border-2 border-primary/30"
                animate={{ scale: [1, 1.4 + i * 0.2], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
              />
            ))}
          </motion.div>

          <div className="text-center space-y-2 max-w-sm">
            <h2 className="text-xl font-bold">Analyzing Your Resume</h2>
            <p className="text-sm text-muted-foreground">
              Our AI is evaluating every section, keyword, and skill — this takes 10–30 seconds.
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Analyzing…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-brand rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Step list */}
          <div className="w-full max-w-sm space-y-2.5">
            {STEPS.map((step, idx) => {
              const isCompleted = completedSteps.includes(step.id);
              const isActive = activeStep === idx;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: isCompleted || isActive ? 1 : 0.35, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 flex-shrink-0">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </motion.div>
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-border mx-auto" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-foreground' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Rotating tip */}
          <div className="w-full max-w-sm rounded-xl bg-primary/5 border border-primary/15 p-4">
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1.5">💡 Did You Know?</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTip}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-muted-foreground leading-relaxed font-medium"
              >
                {TIPS[currentTip]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
