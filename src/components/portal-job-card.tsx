'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, ExternalLink, Building2, Wifi, Star, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PortalUnifiedJob } from '@/lib/portal-fetcher/adapters/base-adapter';
import { openJob } from '@/lib/open-job';

import { isPremiumPortal } from '@/lib/portal-gating';
import { trackMonetizationEvent } from '@/lib/analytics';
import { Lock } from 'lucide-react';

interface PortalJobCardProps {
  job: PortalUnifiedJob;
  index?: number;
  isPro?: boolean;
  onRequirePremiumPortal?: (portalName: string) => void;
}

const portalSourceConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  linkedin:    { label: 'LinkedIn',    bg: 'bg-blue-500/10',   text: 'text-blue-600 dark:text-blue-400',   border: 'border-blue-500/20',   dot: 'bg-blue-500' },
  indeed:      { label: 'Indeed',      bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20', dot: 'bg-violet-500' },
  internshala: { label: 'Internshala', bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  wellfound:   { label: 'Wellfound',   bg: 'bg-teal-500/10',   text: 'text-teal-600 dark:text-teal-400',   border: 'border-teal-500/20',   dot: 'bg-teal-500' },
};

function formatRelativeTime(dateInput: Date | string | null | undefined): string | null {
  if (!dateInput) return null;
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return null;
  
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

export default function PortalJobCard({ job, index = 0, isPro = false, onRequirePremiumPortal }: PortalJobCardProps) {
  const srcConfig = portalSourceConfig[job.source] ?? {
    label: job.source,
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    dot: 'bg-muted-foreground',
  };

  const isPremium = isPremiumPortal(job.source, (job as any).sourceCategory);
  const isLocked = isPremium && !isPro;

  const postedStr = formatRelativeTime(job.postedDate);
  const displaySkills = job.skills?.slice(0, 4) ?? [];

  const handleApply = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (isLocked) {
      trackMonetizationEvent('Premium Job Click', { portal: job.source, title: job.title });
    }

    try {
      const res = await fetch('/api/jobs/apply-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.sourceId, source: job.source }),
      });
      const data = await res.json();

      if (!res.ok || !data.allowed) {
        trackMonetizationEvent('Portal Click Attempt', { portal: job.source, allowed: false });
        if (onRequirePremiumPortal) {
          onRequirePremiumPortal(job.source || 'Premium');
        }
        return;
      }

      openJob(data.applyUrl || job.applyUrl || job.sourceUrl);
    } catch {
      if (isLocked && onRequirePremiumPortal) {
        onRequirePremiumPortal(job.source || 'Premium');
      } else {
        openJob(job.applyUrl || job.sourceUrl);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/70',
        'p-4 shadow-sm backdrop-blur-sm transition-all duration-200',
        'hover:border-border hover:shadow-md hover:bg-card/90',
        'cursor-pointer'
      )}
      onClick={handleApply}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {job.logo ? (
            <img 
              src={job.logo} 
              alt={job.company} 
              className="w-9 h-9 rounded-xl object-contain bg-white p-1 border border-border/40 flex-shrink-0"
              onError={(e) => {
                // Remove img and fallback to placeholder
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold',
              srcConfig.bg, srcConfig.text
            )}>
              {job.company?.charAt(0)?.toUpperCase() || <Building2 className="w-4 h-4" />}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground truncate">{job.company || 'Unknown Company'}</p>
            <h3 className="text-sm font-bold text-foreground truncate leading-tight mt-0.5" title={job.title}>
              {job.title}
            </h3>
          </div>
        </div>

        {/* Portal Tag Badge */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isLocked && (
            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Lock className="w-2.5 h-2.5" /> Premium
            </span>
          )}
          <span className={cn(
            'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border',
            srcConfig.bg, srcConfig.text, srcConfig.border
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', srcConfig.dot)} />
            {srcConfig.label}
          </span>
        </div>
      </div>

      {/* Meta Indicators */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
            <span className="truncate max-w-[150px]">{job.location}</span>
          </span>
        )}
        {job.isRemote && (
          <span className="flex items-center gap-1 text-emerald-500 font-semibold">
            <Wifi className="w-3.5 h-3.5" />
            Remote
          </span>
        )}
        {job.employmentType && (
          <Badge variant="secondary" className="text-[10px] px-2 py-0 h-auto rounded-full font-bold capitalize">
            {job.employmentType}
          </Badge>
        )}
        {job.experience && (
          <span className="flex items-center gap-1 text-[11px]">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span className="capitalize">{job.experience}</span>
          </span>
        )}
      </div>

      {/* Short Job Description snippet */}
      <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
        {job.description || "No description provided."}
      </p>

      {/* Extracted Skills */}
      {displaySkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {displaySkills.map((skill) => (
            <span
              key={skill}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground capitalize"
            >
              {skill}
            </span>
          ))}
          {(job.skills?.length ?? 0) > 4 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              +{job.skills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Footer Compensation & Date Posted */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center gap-1 text-xs font-bold text-foreground">
            <DollarSign className="w-3.5 h-3.5 text-primary" />
            <span>{job.salary || "Not disclosed"}</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {job.isDateless || !postedStr ? "Date unknown" : postedStr}
          </span>
        </div>

        <Button
          size="sm"
          className={cn(
            'h-7 px-3 text-[11px] font-bold rounded-lg flex-shrink-0 gap-1',
            'bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground',
            'transition-all duration-150'
          )}
          onClick={(e) => handleApply(e)}
        >
          Apply
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
