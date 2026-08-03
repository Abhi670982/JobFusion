'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Code2, Layers, Database, Cloud, Terminal, Brain, Wrench, Heart, Plus, Lightbulb } from 'lucide-react';

type SkillCategory = 'programmingLanguages' | 'frameworks' | 'databases' | 'cloud' | 'devops' | 'aiMl' | 'tools' | 'softSkills';

interface SkillsPanelProps {
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  cloud: string[];
  devops: string[];
  aiMl: string[];
  tools: string[];
  softSkills: string[];
  missing: string[];
  recommended: string[];
}

const CATEGORIES: { id: SkillCategory; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'programmingLanguages', label: 'Languages',   icon: Code2,    color: 'text-blue-500' },
  { id: 'frameworks',           label: 'Frameworks',  icon: Layers,   color: 'text-purple-500' },
  { id: 'databases',            label: 'Databases',   icon: Database, color: 'text-emerald-500' },
  { id: 'cloud',                label: 'Cloud',       icon: Cloud,    color: 'text-sky-500' },
  { id: 'devops',               label: 'DevOps',      icon: Terminal, color: 'text-orange-500' },
  { id: 'aiMl',                 label: 'AI / ML',     icon: Brain,    color: 'text-pink-500' },
  { id: 'tools',                label: 'Tools',       icon: Wrench,   color: 'text-amber-500' },
  { id: 'softSkills',           label: 'Soft Skills', icon: Heart,    color: 'text-rose-500' },
];

function SkillBadge({ skill, variant = 'default', delay = 0 }: { skill: string; variant?: 'default' | 'missing' | 'recommended'; delay?: number }) {
  const styles = {
    default:     'bg-muted/70 border-border text-foreground hover:border-primary/30',
    missing:     'bg-red-500/8 border-red-500/25 text-red-600 dark:text-red-400 border-dashed',
    recommended: 'bg-primary/8 border-primary/25 text-primary',
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.2 }}
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-default',
        styles[variant]
      )}
    >
      {variant === 'missing' && <Plus className="w-2.5 h-2.5 mr-1 opacity-70" />}
      {skill}
    </motion.span>
  );
}

export function SkillsPanel(props: SkillsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<SkillCategory>('programmingLanguages');

  const skillsMap: Record<SkillCategory, string[]> = {
    programmingLanguages: props.programmingLanguages,
    frameworks:           props.frameworks,
    databases:            props.databases,
    cloud:                props.cloud,
    devops:               props.devops,
    aiMl:                 props.aiMl,
    tools:                props.tools,
    softSkills:           props.softSkills,
  };

  const activeCfg = CATEGORIES.find(c => c.id === activeCategory)!;
  const activeSkills = skillsMap[activeCategory];
  const totalSkills = Object.values(skillsMap).flat().length;

  return (
    <div className="card-premium p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Skills Breakdown</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{totalSkills} skills detected across {CATEGORIES.filter(c => skillsMap[c.id].length > 0).length} categories</p>
        </div>
        {props.missing.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
            <Plus className="w-3 h-3 text-red-500" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">{props.missing.length} missing</span>
          </div>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => {
          const count = skillsMap[cat.id].length;
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all touch-auto',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/60'
              )}
            >
              <Icon className={cn('w-3 h-3', isActive ? 'text-primary' : cat.color)} />
              {cat.label}
              {count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Skill badges */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {/* Found skills */}
          {activeSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeSkills.map((skill, i) => (
                <SkillBadge key={skill} skill={skill} delay={i * 0.04} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <activeCfg.icon className="w-7 h-7 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No {activeCfg.label.toLowerCase()} detected in your resume.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Missing & Recommended skills */}
      {(props.missing.length > 0 || props.recommended.length > 0) && (
        <div className="space-y-3 pt-3 border-t border-border">
          {props.missing.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-red-500" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Missing from your resume</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {props.missing.slice(0, 10).map((skill, i) => (
                  <SkillBadge key={skill} skill={skill} variant="missing" delay={i * 0.04} />
                ))}
              </div>
            </div>
          )}
          {props.recommended.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Recommended to add</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {props.recommended.slice(0, 8).map((skill, i) => (
                  <SkillBadge key={skill} skill={skill} variant="recommended" delay={i * 0.04} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
