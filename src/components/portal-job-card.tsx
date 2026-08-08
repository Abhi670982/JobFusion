'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, ExternalLink, Building2, Wifi, Star, DollarSign, Lock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PortalUnifiedJob as PortalJobDTOV1 } from '@/lib/portal-fetcher/adapters/base-adapter';
import { openJob } from '@/lib/open-job';
import { isPremiumPortal } from '@/lib/portal-gating';
import { trackMonetizationEvent } from '@/lib/analytics';

interface PortalJobCardProps {
  job: PortalJobDTOV1;
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

function formatRelativeTime(dateISO: string | null | undefined): string | null {
  if (!dateISO) return null;
  const d = new Date(dateISO);
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
  const portalKey = (job.sourcePortal || 'linkedin').toLowerCase();
  const srcConfig = portalSourceConfig[portalKey] ?? {
    label: job.sourcePortal,
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    dot: 'bg-muted-foreground',
  };

  const isPremium = isPremiumPortal(portalKey, "JOB_PORTAL");
  const isLocked = isPremium && !isPro;

  const postedStr = formatRelativeTime(job.postedAtISO);
  const displaySkills = job.matchedSkills?.slice(0, 4) ?? [];

  const handleApply = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (isLocked) {
      trackMonetizationEvent('Premium Job Click', { portal: portalKey, title: job.title });
    }

    try {
      const res = await fetch('/api/jobs/apply-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, source: portalKey }),
      });
      const data = await res.json();

      if (!res.ok || !data.allowed) {
        trackMonetizationEvent('Portal Click Attempt', { portal: portalKey, allowed: false });
        if (onRequirePremiumPortal) {
          onRequirePremiumPortal(portalKey || 'Premium');
        }
        return;
      }

      openJob(data.applyUrl || job.applyUrl);
    } catch {
      if (isLocked && onRequirePremiumPortal) {
        onRequirePremiumPortal(portalKey || 'Premium');
      } else {
        openJob(job.applyUrl);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="card-premium cursor-pointer group relative overflow-hidden"
      onClick={handleApply}
      style={{ transition: 'box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease' }}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, #6366f108, transparent 70%)` }} />

      <div className="p-5 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Company Logo */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0 overflow-hidden transition-transform group-hover:scale-105 duration-300 bg-white"
            >
              {job.companyLogo && (job.companyLogo.startsWith('http') || job.companyLogo.includes('/')) ? (
                <img
                  src={`/api/proxy-image?url=${encodeURIComponent(job.companyLogo)}&company=${encodeURIComponent(job.company || 'Company')}&color=${encodeURIComponent('#6366f1')}`}
                  alt={job.company}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className={cn(
                  'w-full h-full flex items-center justify-center font-bold text-base',
                  srcConfig.bg, srcConfig.text
                )}>
                  {job.company?.charAt(0)?.toUpperCase() || <Building2 className="w-5 h-5" />}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1" title={job.title}>
                  {job.title}
                </h3>
                {isLocked && (
                  <Badge className="text-[9px] h-4 px-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 flex-shrink-0 rounded-full font-bold gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Premium
                  </Badge>
                )}
                {/* Portal Badge */}
                <span className={cn(
                  'inline-flex items-center gap-1 text-[9px] h-4 font-bold uppercase tracking-wide px-1.5 rounded-full border flex-shrink-0',
                  srcConfig.bg, srcConfig.text, srcConfig.border
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', srcConfig.dot)} />
                  {srcConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">{job.company || 'Unknown Company'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {job.isRemote && (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 rounded-full text-xs border">
              <Wifi className="w-3 h-3 mr-1" />
              Remote
            </Badge>
          )}
          {job.employmentType && (
            <Badge variant="secondary" className="rounded-full text-xs capitalize">{job.employmentType}</Badge>
          )}
          {job.experienceLevel && (
            <Badge variant="secondary" className="rounded-full text-xs capitalize">{job.experienceLevel}</Badge>
          )}
        </div>

        {/* Location & Salary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3.5">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[140px]">{job.location || 'Location not specified'}</span>
          </div>
          {job.salaryText && job.salaryText !== 'Not disclosed' && (
            <span className="font-semibold text-foreground text-xs">{job.salaryText}</span>
          )}
        </div>

        {/* Skills */}
        {displaySkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {displaySkills.map((skill: string) => (
              <span
                key={skill}
                className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground border border-border/60 font-medium capitalize"
              >
                {skill}
              </span>
            ))}
            {(job.matchedSkills?.length ?? 0) > 4 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                +{(job.matchedSkills?.length ?? 0) - 4} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{job.isDateless || !postedStr ? "Date unknown" : postedStr}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={(e) => handleApply(e)}
              size="sm"
              className="h-7 px-3 text-xs rounded-full gradient-brand text-white border-0 hover:opacity-90 transition-opacity z-10 shadow-sm"
            >
              <Zap className="w-3 h-3 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
