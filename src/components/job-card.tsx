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
import { DbJob, saveJob, unsaveJob } from '@/lib/api-helper';
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
  remote: { icon: Wifi, label: 'Remote', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  hybrid: { icon: Home, label: 'Hybrid', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  onsite: { icon: Users, label: 'On-site', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
};

const matchColor = (score: number) => {
  if (score >= 90) return 'text-emerald-500';
  if (score >= 75) return 'text-blue-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-muted-foreground';
};

export default function JobCard({
  job,
  index = 0,
  variant = 'default',
  userId,
  initialIsSaved = false,
  initialIsApplied = false,
  onSavedToggle
}: JobCardProps) {
  const [saved, setSaved] = useState(initialIsSaved);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }
    trackVisitedJob(job);
    router.push(`/jobs/${job._id}`);
  };

  useEffect(() => {
    setSaved(initialIsSaved);
  }, [initialIsSaved]);

  const locType = locationTypeConfig[job.locationType] || locationTypeConfig.remote;
  const LocIcon = locType.icon;

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId || loading) return;

    setLoading(true);
    const nextSaved = !saved;
    setSaved(nextSaved); // Optimistic UI update

    try {
      if (nextSaved) {
        const result = await saveJob(userId, job._id);
        if (!result) {
          setSaved(saved); // Revert on failure
        } else if (onSavedToggle) {
          onSavedToggle(job._id, true);
        }
      } else {
        const success = await unsaveJob(userId, job._id);
        if (!success) {
          setSaved(saved); // Revert on failure
        } else if (onSavedToggle) {
          onSavedToggle(job._id, false);
        }
      }
    } catch (err) {
      console.error("Error toggling save state:", err);
      setSaved(saved); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackVisitedJob(job);
    if (job.applyUrl) {
      window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    } else {
      // If no applyUrl, navigate to local details page
      router.push(`/jobs/${job._id}`);
    }
  };

  // Determine Source Badge styling
  const getSourceBadge = () => {
    const src = (job.source || "").toLowerCase();
    switch (src) {
      case "linkedin":
        return { label: "LinkedIn", className: "bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
      case "indeed":
        return { label: "Indeed", className: "bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-500/20" };
      case "wellfound":
        return { label: "Wellfound", className: "bg-teal-600/10 text-teal-600 dark:text-teal-400 border-teal-500/20" };
      case "internshala":
        return { label: "Internshala", className: "bg-orange-600/10 text-orange-600 dark:text-orange-400 border-orange-500/20" };
      default:
        return null;
    }
  };

  const sourceBadge = getSourceBadge();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="card-premium card-hover group cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Company Logo */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: job.companyColor || '#6366f1' }}
            >
              {job.companyLogo && (job.companyLogo.startsWith('http') || job.companyLogo.includes('/')) ? (
                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
              ) : (
                job.companyLogo || job.company.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1">
                  {job.title}
                </h3>
                {job.featured && (
                  <Badge className="text-[10px] h-4 px-1.5 gradient-brand text-white border-0 flex-shrink-0">
                    Featured
                  </Badge>
                )}
                {initialIsApplied && (
                  <Badge className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex-shrink-0 font-medium">
                    Visited
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
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
                'rounded-xl p-2 transition-all duration-200 flex-shrink-0 z-10',
                saved
                  ? 'text-primary bg-primary/10 hover:bg-primary/20'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {saved
                ? <BookmarkCheck className="w-4 h-4" />
                : <Bookmark className="w-4 h-4" />
              }
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className={cn('rounded-lg text-xs border', locType.className)}>
            <LocIcon className="w-3 h-3 mr-1" />
            {locType.label}
          </Badge>
          <Badge variant="secondary" className="rounded-lg text-xs">
            {job.type}
          </Badge>
          {job.experience && (
            <Badge variant="secondary" className="rounded-lg text-xs">
              {job.experience}
            </Badge>
          )}
          {sourceBadge && (
            <Badge variant="outline" className={cn('rounded-lg text-xs border font-medium', sourceBadge.className)}>
              {sourceBadge.label}
            </Badge>
          )}
        </div>

        {/* Location & Salary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {job.location}
          </div>
          <span className="font-medium text-foreground">{job.salary}</span>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="text-[11px] px-2 py-0.5 rounded-lg bg-accent text-accent-foreground border border-border/60"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-accent text-muted-foreground">
              +{job.skills.length - 4}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <div className="flex items-center gap-3">
            {/* Match Score */}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-[8px] font-bold text-primary">AI</span>
              </div>
              <span className={cn('text-xs font-semibold', matchColor(job.matchScore))}>
                {job.matchScore}% match
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {typeof job.postedAt === "string" ? job.postedAt : "Just now"}
            </div>
          </div>

          <Button
            onClick={handleApplyClick}
            size="sm"
            className="h-7 px-3 text-xs rounded-lg gradient-brand text-white border-0 hover:opacity-90 z-10"
          >
            <Zap className="w-3 h-3 mr-1" />
            Apply
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
