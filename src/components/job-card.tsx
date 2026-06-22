'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  MapPin, Clock, Bookmark, BookmarkCheck, Zap, Building2,
  Wifi, Home, Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DbJob, saveJob, unsaveJob, logActivity } from '@/lib/api-helper';
import { trackVisitedJob } from '@/lib/visited-jobs';

interface JobCardProps {
  job: DbJob;
  index?: number;
  variant?: 'default' | 'compact';
  userId?: string;
  initialIsSaved?: boolean;
  initialIsApplied?: boolean;
  onSavedToggle?: (jobId: string, nowSaved: boolean) => void;
}

const locationTypeConfig = {
  remote: { icon: Wifi,  label: 'Remote',  className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  hybrid: { icon: Home,  label: 'Hybrid',  className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  onsite: { icon: Users, label: 'On-site', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
};

const getSourceStyle = (src: string) => {
  switch (src) {
    case 'linkedin':   return { label: 'LinkedIn',        cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    case 'indeed':     return { label: 'Indeed',          cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' };
    case 'wellfound':  return { label: 'Wellfound',       cls: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' };
    case 'internshala':return { label: 'Internshala',     cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
    case 'careers':    return { label: 'Company Careers', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    default: return null;
  }
};

export default function JobCard({
  job, index = 0, variant = 'default', userId,
  initialIsSaved = false, initialIsApplied = false, onSavedToggle
}: JobCardProps) {
  const [saved, setSaved] = useState(initialIsSaved);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => { setSaved(initialIsSaved); }, [initialIsSaved]);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;
    trackVisitedJob(job);
    if (userId) {
      logActivity({ type: 'viewed', jobId: job._id, jobTitle: job.title, company: job.company })
        .catch(() => {});
    }
    router.push(`/jobs/${job._id}`);
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!userId || loading) return;
    setLoading(true);
    const nextSaved = !saved;
    setSaved(nextSaved);
    try {
      if (nextSaved) {
        const result = await saveJob(userId, job._id);
        if (!result) { setSaved(saved); } else if (onSavedToggle) onSavedToggle(job._id, true);
      } else {
        const success = await unsaveJob(userId, job._id);
        if (!success) { setSaved(saved); } else if (onSavedToggle) onSavedToggle(job._id, false);
      }
    } catch { setSaved(saved); }
    finally { setLoading(false); }
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackVisitedJob(job);
    if (userId) {
      logActivity({ type: 'viewed', jobId: job._id, jobTitle: job.title, company: job.company }).catch(() => {});
    }
    if (job.applyUrl) window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    else router.push(`/jobs/${job._id}`);
  };

  const locType = locationTypeConfig[job.locationType] || locationTypeConfig.remote;
  const LocIcon = locType.icon;
  const source = getSourceStyle((job.source || '').toLowerCase());

  // Relative time
  const getTimeAgo = () => {
    const d = job.postedAtDate ? new Date(job.postedAtDate) : null;
    if (!d || isNaN(d.getTime())) return typeof job.postedAt === 'string' ? job.postedAt : 'Just now';
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="card-premium cursor-pointer group relative overflow-hidden"
      onClick={handleCardClick}
      style={{ transition: 'box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease' }}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${job.companyColor || '#6366f1'}08, transparent 70%)` }} />

      <div className="p-5 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Company Logo */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0 overflow-hidden transition-transform group-hover:scale-105 duration-300"
              style={{ backgroundColor: job.companyColor || '#6366f1' }}
            >
              {job.companyLogo && (job.companyLogo.startsWith('http') || job.companyLogo.includes('/')) ? (
                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
              ) : (
                job.companyLogo || job.company.charAt(0)
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1">
                  {job.title}
                </h3>
                {job.featured && (
                  <Badge className="text-[10px] h-4 px-1.5 gradient-brand text-white border-0 flex-shrink-0 rounded-full">Featured</Badge>
                )}
                {initialIsApplied && (
                  <Badge className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex-shrink-0 rounded-full">Visited</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{job.company}</span>
              </div>
            </div>
          </div>

          {/* Save button */}
          {userId && (
            <button
              onClick={handleSaveToggle}
              disabled={loading}
              className={cn(
                'rounded-xl p-2 transition-all duration-200 flex-shrink-0 z-10 touch-auto',
                saved
                  ? 'text-primary bg-primary/12 hover:bg-primary/20'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/8',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          <Badge variant="secondary" className={cn('rounded-full text-xs border', locType.className)}>
            <LocIcon className="w-3 h-3 mr-1" />
            {locType.label}
          </Badge>
          <Badge variant="secondary" className="rounded-full text-xs">{job.type}</Badge>
          {job.experience && (
            <Badge variant="secondary" className="rounded-full text-xs">{job.experience}</Badge>
          )}
          {source && (
            <Badge variant="outline" className={cn('rounded-full text-xs border font-medium', source.cls)}>
              {source.label}
            </Badge>
          )}
        </div>

        {/* Location & Salary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3.5">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[140px]">{job.location}</span>
          </div>
          {job.salary && job.salary !== 'Not disclosed' && (
            <span className="font-semibold text-foreground text-xs">{job.salary}</span>
          )}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground border border-border/60 font-medium"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              +{job.skills.length - 4} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{getTimeAgo()}</span>
          </div>

          <div className="flex items-center gap-2">
            {job.matchScore && (
              <div className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-full',
                job.matchScore >= 85
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              )}>
                {job.matchScore}% match
              </div>
            )}
            <Button
              onClick={handleApplyClick}
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
