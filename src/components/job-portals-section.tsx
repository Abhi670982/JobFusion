'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
  SlidersHorizontal, X, MapPin,
  LayoutGrid, List, Activity, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import PortalJobCard from '@/components/portal-job-card';
import { PortalUnifiedJob } from '@/lib/portal-fetcher/adapters/base-adapter';
import { parsePostedDate } from '@/lib/parse-posted-date';
import { JobsErrorBoundary } from '@/components/error-boundary';

// ─── Types & Config ───────────────────────────────────────────────────────────

interface PortalTab {
  id: string;
  label: string;
  dotColor: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  gradient: string;
}

const PORTAL_TABS: PortalTab[] = [
  {
    id: 'all',
    label: 'All Portals',
    dotColor: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    activeBg: 'bg-indigo-500/10',
    activeBorder: 'border-indigo-500/40',
    activeText: 'text-indigo-600 dark:text-indigo-400',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    dotColor: 'bg-blue-500',
    activeBg: 'bg-blue-500/10',
    activeBorder: 'border-blue-500/40',
    activeText: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'indeed',
    label: 'Indeed',
    dotColor: 'bg-violet-500',
    activeBg: 'bg-violet-500/10',
    activeBorder: 'border-violet-500/40',
    activeText: 'text-violet-600 dark:text-violet-400',
    gradient: 'from-violet-500 to-violet-600',
  },
  {
    id: 'internshala',
    label: 'Internshala',
    dotColor: 'bg-orange-500',
    activeBg: 'bg-orange-500/10',
    activeBorder: 'border-orange-500/40',
    activeText: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'wellfound',
    label: 'Wellfound',
    dotColor: 'bg-teal-500',
    activeBg: 'bg-teal-500/10',
    activeBorder: 'border-teal-500/40',
    activeText: 'text-teal-600 dark:text-teal-400',
    gradient: 'from-teal-500 to-emerald-500',
  },
];

const JOB_TYPES = [
  { label: 'Full-time', value: 'full-time' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' },
  { label: 'Freelance', value: 'freelance' }
];

const EXP_LEVELS = [
  { label: 'Entry Level', value: 'entry' },
  { label: 'Mid Level', value: 'mid' },
  { label: 'Senior Level', value: 'senior' },
  { label: 'Lead', value: 'lead' }
];

const JOBS_PER_PAGE = 8;

// ─── Skeletons ────────────────────────────────────────────────────────────────

function PortalJobSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-4 space-y-3 animate-pulse">
      <div className="flex items-start gap-2">
        <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-2/5 rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-4 w-12 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-4 w-10 rounded-md" />
      </div>
      <div className="flex justify-between items-center pt-1 border-t border-border/40">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-7 w-16 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface JobPortalsSectionProps {
  keyword?: string;
  locationInput?: string;
  profileSkills?: string[];
  // Shared layout states from page.tsx to ensure identical feel and behavior
  mobileFilters: boolean;
  setMobileFilters: React.Dispatch<React.SetStateAction<boolean>>;
  filtersCollapsed: boolean;
  setFiltersCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: 'grid' | 'list';
  setViewMode: React.Dispatch<React.SetStateAction<'grid' | 'list'>>;
}

export default function JobPortalsSection({
  keyword = '',
  locationInput = '',
  profileSkills = [],
  mobileFilters,
  setMobileFilters,
  filtersCollapsed,
  setFiltersCollapsed,
  viewMode,
  setViewMode,
}: JobPortalsSectionProps) {
  const [activePortal, setActivePortal] = useState('all');
  const [portalJobs, setPortalJobs] = useState<Record<string, PortalUnifiedJob[]>>({
    linkedin: [],
    indeed: [],
    internshala: [],
    wellfound: [],
  });
  const [portalLoading, setPortalLoading] = useState<Record<string, boolean>>({
    linkedin: false,
    indeed: false,
    internshala: false,
    wellfound: false,
  });
  const [portalErrors, setPortalErrors] = useState<Record<string, string | null>>({
    linkedin: null,
    indeed: null,
    internshala: null,
    wellfound: null,
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  // Filters State matching company careers structure
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExpLevels, setSelectedExpLevels] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [salaryRange, setSalaryRange] = useState<number>(0);
  const [locationOverride, setLocationOverride] = useState('');
  const [sortBy, setSortBy] = useState<'postedAt' | 'salaryMin'>('postedAt');
  const [optimizeWithSkills, setOptimizeWithSkills] = useState(true);

  const lastFetchedKeys = useRef<Record<string, string>>({});
  const abortControllersRef = useRef<Record<string, AbortController | null>>({});

  // Helper toggle functions
  const toggleJobType = (val: string) => {
    setSelectedJobTypes(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const toggleExpLevel = (val: string) => {
    setSelectedExpLevels(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const clearAllFilters = () => {
    setSelectedJobTypes([]);
    setSelectedExpLevels([]);
    setRemoteOnly(false);
    setSalaryRange(0);
    setLocationOverride('');
  };

  // ── Client-side filter + sort logic ──────────────────────────────────────
  // resolveTs: convert postedDate (any format) to a sortable ms timestamp.
  // Returns 0 for dateless jobs — they sort to the very bottom on DESC order.
  const resolveTs = (job: PortalUnifiedJob): number => {
    if (!job.postedDate) return 0;
    const parsed = parsePostedDate(String(job.postedDate));
    if (parsed) return parsed.timestamp.getTime();
    // Try native Date as last resort (works for ISO strings)
    const d = new Date(job.postedDate as any);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const rawJobs = useMemo(() => {
    let jobs: PortalUnifiedJob[];
    if (activePortal === 'all') {
      jobs = Object.values(portalJobs).flat();
    } else {
      jobs = portalJobs[activePortal] || [];
    }
    // Pre-sort the merged list by resolved timestamp descending (newest first).
    // Dateless jobs (ts = 0) float to the bottom.
    return [...jobs].sort((a, b) => resolveTs(b) - resolveTs(a));
  }, [portalJobs, activePortal]);

  const filteredJobs = useMemo(() => {
    let jobs = [...rawJobs];

    // Job Types
    if (selectedJobTypes.length > 0) {
      jobs = jobs.filter((j) => j.employmentType && selectedJobTypes.includes(j.employmentType));
    }

    // Experience Levels
    if (selectedExpLevels.length > 0) {
      jobs = jobs.filter((j) => j.experience && selectedExpLevels.includes(j.experience));
    }

    // Remote
    if (remoteOnly) {
      jobs = jobs.filter((j) => j.isRemote);
    }

    // Salary Min
    if (salaryRange > 0) {
      const minInUnits = salaryRange * 100000;
      jobs = jobs.filter((j) => (j.salaryMin ?? 0) >= minInUnits || (j.salaryMax ?? 0) >= minInUnits);
    }

    // Sort — uses pre-resolved timestamps for correctness
    if (sortBy === 'postedAt') {
      // rawJobs is already sorted newest-first; only re-sort when user picks 'postedAt'
      // No-op here since rawJobs pre-sort already did it, but re-run to handle filter changes
      jobs.sort((a, b) => resolveTs(b) - resolveTs(a));
    } else if (sortBy === 'salaryMin') {
      jobs.sort((a, b) => (b.salaryMin ?? b.salaryMax ?? 0) - (a.salaryMin ?? a.salaryMax ?? 0));
    }

    return jobs;
  }, [rawJobs, selectedJobTypes, selectedExpLevels, remoteOnly, salaryRange, sortBy]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  const pagedJobs  = filteredJobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchSinglePortal = useCallback(async (
    portal: string,
    kw: string,
    loc: string,
    optSkills: boolean,
    forceRefresh = false
  ) => {
    const skillsQuery = optSkills && profileSkills.length > 0 ? profileSkills.join(",") : "";
    const queryKey = `${kw}::${loc}::${skillsQuery}`;
    const PORTAL_CACHE_PREFIX = 'jobfusion_portal_cache_';
    const cacheKey = `${PORTAL_CACHE_PREFIX}${portal}_${kw}_${loc}_${skillsQuery}`;
    
    if (!forceRefresh) {
      // 1. Check client-side sessionStorage cache
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { jobs, timestamp } = JSON.parse(cached);
          const isFresh = (Date.now() - timestamp) < 5 * 60 * 1000; // 5 min TTL
          
          if (isFresh) {
            setPortalJobs(prev => ({ ...prev, [portal]: jobs || [] }));
            setPortalLoading(prev => ({ ...prev, [portal]: false }));
            setPortalErrors(prev => ({ ...prev, [portal]: null }));
            lastFetchedKeys.current[portal] = queryKey;
            return;
          } else {
            // Stale cache: display immediately but refresh in background
            setPortalJobs(prev => ({ ...prev, [portal]: jobs || [] }));
          }
        } catch (_) {
          // ignore parsing errors
        }
      }

      // 2. Prevent redundant in-flight duplicate triggers
      if (lastFetchedKeys.current[portal] === queryKey) {
        return;
      }
    } else {
      // Manual refresh: invalidate cache
      sessionStorage.removeItem(cacheKey);
      delete lastFetchedKeys.current[portal];
    }
    
    lastFetchedKeys.current[portal] = queryKey;

    // Abort previous in-flight request for this portal if any
    if (abortControllersRef.current[portal]) {
      abortControllersRef.current[portal]?.abort();
    }
    if (typeof AbortController !== 'undefined') {
      abortControllersRef.current[portal] = new AbortController();
    }

    setPortalLoading(prev => ({ ...prev, [portal]: true }));
    setPortalErrors(prev => ({ ...prev, [portal]: null }));

    const params = new URLSearchParams({
      portal,
      location: loc.trim() || 'India',
      page: '1',
    });

    if (kw.trim()) params.append('keyword', kw.trim());
    if (skillsQuery) params.append('skills', skillsQuery);

    try {
      const res = await fetch(`/api/portal-jobs?${params}`, {
        signal: abortControllersRef.current[portal]?.signal
      });
      const data = await res.json();

      if (data.success) {
        const jobsList = data.data || [];
        setPortalJobs(prev => ({ ...prev, [portal]: jobsList }));
        
        // Save to cache
        sessionStorage.setItem(cacheKey, JSON.stringify({
          jobs: jobsList,
          timestamp: Date.now()
        }));

        if (data.errors?.length) {
          setPortalErrors(prev => ({ ...prev, [portal]: data.errors.join(", ") }));
        }
      } else {
        setPortalErrors(prev => ({ ...prev, [portal]: data.error || 'Failed to fetch jobs' }));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`[JobPortalsSection] Fetch for ${portal} was aborted.`);
        return;
      }
      setPortalErrors(prev => ({ ...prev, [portal]: 'Network error' }));
    } finally {
      setPortalLoading(prev => ({ ...prev, [portal]: false }));
    }
  }, [profileSkills]);

  const triggerFetch = useCallback((
    targetPortal: string,
    kw: string,
    loc: string,
    optSkills: boolean,
    forceRefresh = false
  ) => {
    const portalsToCrawl = targetPortal === 'all'
      ? ['linkedin', 'internshala', 'wellfound', 'indeed']
      : [targetPortal];

    if (forceRefresh) {
      portalsToCrawl.forEach(p => {
        setPortalJobs(prev => ({ ...prev, [p]: [] }));
        setPortalErrors(prev => ({ ...prev, [p]: null }));
      });
    }

    portalsToCrawl.forEach(p => {
      fetchSinglePortal(p, kw, loc, optSkills, forceRefresh);
    });
  }, [fetchSinglePortal]);

  const effectiveLocation = locationOverride || locationInput;

  useEffect(() => {
    triggerFetch(activePortal, keyword, effectiveLocation, optimizeWithSkills);
  }, [activePortal, keyword, effectiveLocation, optimizeWithSkills, triggerFetch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedJobTypes, selectedExpLevels, remoteOnly, salaryRange, locationOverride]);

  // Clean up active abort controllers on unmount
  useEffect(() => {
    return () => {
      Object.values(abortControllersRef.current).forEach(ctrl => ctrl?.abort());
    };
  }, []);

  const handleTabChange = (portalId: string) => {
    if (portalId === activePortal) return;
    setActivePortal(portalId);
    setCurrentPage(1);
  };

  const doRefresh = () => {
    const PORTAL_CACHE_PREFIX = 'jobfusion_portal_cache_';
    const portalsToFetch = activePortal === 'all'
      ? ['linkedin', 'internshala', 'wellfound', 'indeed']
      : [activePortal];

    portalsToFetch.forEach(p => {
      delete lastFetchedKeys.current[p];
      
      const skillsQuery = optimizeWithSkills && profileSkills.length > 0 ? profileSkills.join(",") : "";
      const cacheKey = `${PORTAL_CACHE_PREFIX}${p}_${keyword}_${effectiveLocation}_${skillsQuery}`;
      sessionStorage.removeItem(cacheKey);

      if (abortControllersRef.current[p]) {
        abortControllersRef.current[p]?.abort();
        abortControllersRef.current[p] = null;
      }
    });

    triggerFetch(activePortal, keyword, effectiveLocation, optimizeWithSkills, true);
  };

  const isAnyLoading = useMemo(() => {
    if (activePortal === 'all') {
      return Object.values(portalLoading).some(Boolean);
    }
    return portalLoading[activePortal] || false;
  }, [portalLoading, activePortal]);

  const portalErrorMessage = useMemo(() => {
    if (activePortal === 'all') {
      const activeErrors = Object.entries(portalErrors)
        .filter(([, err]) => err !== null)
        .map(([p, err]) => `${p}: ${err}`);
      return activeErrors.length > 0 ? activeErrors.join("; ") : null;
    }
    return portalErrors[activePortal] || null;
  }, [portalErrors, activePortal]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      
      {/* ─── 1. Left Filtering Sidebar ──────────────────────────────────────── */}
      <aside className={cn(
        "lg:col-span-1 space-y-6 card-premium p-5",
        mobileFilters ? "fixed inset-0 z-40 bg-background/95 backdrop-blur-md p-6 overflow-y-auto block space-y-6" : (filtersCollapsed ? "hidden" : "hidden lg:block")
      )}>
        <div className="flex items-center justify-between lg:hidden mb-2">
          <h3 className="font-bold">Filters</h3>
          <Button size="icon" variant="ghost" onClick={() => setMobileFilters(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Optimize with Resume Skills */}
        {profileSkills.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="skills-optimizer" className="text-xs font-bold cursor-pointer select-none flex items-center gap-1.5 text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                Resume Skills Search
              </Label>
              <Checkbox
                id="skills-optimizer"
                checked={optimizeWithSkills}
                onCheckedChange={() => setOptimizeWithSkills(prev => !prev)}
                className="rounded-lg border-border"
              />
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Intelligently query portals using your expanded resume skills: <strong className="text-foreground">{profileSkills.slice(0, 3).join(", ")}</strong>.
            </p>
          </div>
        )}

        {profileSkills.length > 0 && <Separator />}

        {/* Location Override Search */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</h4>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={locationOverride}
              onChange={(e) => setLocationOverride(e.target.value)}
              placeholder="City, country or remote..."
              className="pl-9 h-10 text-xs rounded-xl border-border bg-background"
            />
          </div>
        </div>

        <Separator />

        {/* Job Type Checklist */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Job Type</h4>
          <div className="space-y-2.5">
            {JOB_TYPES.map(type => (
              <div key={type.value} className="flex items-center gap-2.5">
                <Checkbox
                  id={`portal-type-${type.value}`}
                  checked={selectedJobTypes.includes(type.value)}
                  onCheckedChange={() => toggleJobType(type.value)}
                  className="rounded-lg border-border"
                />
                <Label htmlFor={`portal-type-${type.value}`} className="text-xs font-semibold cursor-pointer select-none">
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Experience Level Checklist */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Experience Level</h4>
          <div className="space-y-2.5">
            {EXP_LEVELS.map(lvl => (
              <div key={lvl.value} className="flex items-center gap-2.5">
                <Checkbox
                  id={`portal-lvl-${lvl.value}`}
                  checked={selectedExpLevels.includes(lvl.value)}
                  onCheckedChange={() => toggleExpLevel(lvl.value)}
                  className="rounded-lg border-border"
                />
                <Label htmlFor={`portal-lvl-${lvl.value}`} className="text-xs font-semibold cursor-pointer select-none">
                  {lvl.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Remote Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="portal-remote-toggle" className="text-xs font-bold cursor-pointer select-none">Remote Only</Label>
            <p className="text-[10px] text-muted-foreground mt-0.5">Show only work-from-home roles</p>
          </div>
          <Checkbox
            id="portal-remote-toggle"
            checked={remoteOnly}
            onCheckedChange={() => setRemoteOnly(prev => !prev)}
            className="rounded-lg border-border"
          />
        </div>

        <Separator />

        {/* Salary range slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Min Salary (INR)</h4>
            <span className="text-xs font-bold text-primary">{salaryRange > 0 ? `₹${salaryRange}L+` : 'Any'}</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            value={salaryRange}
            onChange={(e) => setSalaryRange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground font-bold">
            <span>₹0L</span>
            <span>₹25L</span>
            <span>₹50L</span>
          </div>
        </div>

      </aside>

      {/* ─── 2. Right Content feed ─────────────────────────────────────────── */}
      <div className={cn("space-y-4", filtersCollapsed ? "lg:col-span-4" : "lg:col-span-3")}>
        
        {/* Toolbar row matching Careers */}
        <div className="flex items-center justify-between bg-card/60 backdrop-blur-md p-3 rounded-2xl border border-border/85 shadow-sm">
          {/* Mobile Filter toggle button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setMobileFilters(true)}
            className="lg:hidden rounded-xl gap-1.5 h-9 text-xs"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </Button>

          {/* Desktop Filter toggle button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setFiltersCollapsed(!filtersCollapsed)}
            className="hidden lg:flex rounded-xl gap-1.5 h-9 text-xs"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {filtersCollapsed ? 'Show Filters' : 'Hide Filters'}
          </Button>

          <p className="text-xs text-muted-foreground font-semibold">
            Found <strong className="text-foreground text-sm">{filteredJobs.length}</strong> live portal jobs
          </p>

          <div className="flex items-center gap-3.5">
            {/* Sorting dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl border-border h-9 font-medium gap-1 text-xs select-none hover:bg-accent touch-auto">
                  Sort: {sortBy === 'postedAt' ? 'Latest' : 'Salary (Min)'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-xl">
                <DropdownMenuCheckboxItem
                  checked={sortBy === 'postedAt'}
                  onCheckedChange={() => setSortBy('postedAt')}
                  className="rounded-lg text-xs cursor-pointer"
                >
                  Latest Posted
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === 'salaryMin'}
                  onCheckedChange={() => setSortBy('salaryMin')}
                  className="rounded-lg text-xs cursor-pointer"
                >
                  Salary Range (Min)
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Grid/List View switcher */}
            <div className="hidden sm:flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn('rounded-xl w-8 h-8', viewMode === 'grid' && 'bg-accent')} 
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn('rounded-xl w-8 h-8', viewMode === 'list' && 'bg-accent')} 
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Portal selection tabs (LinkedIn, Indeed, Internshala, Wellfound, All) */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {PORTAL_TABS.map((tab) => {
              const isActive = tab.id === activePortal;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  aria-pressed={isActive}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    isActive
                      ? `${tab.activeBg} ${tab.activeBorder} ${tab.activeText} shadow-sm`
                      : 'border-border/60 bg-card/50 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground'
                  )}
                >
                  <span className={cn(
                    'flex-shrink-0',
                    tab.id === 'all'
                      ? `w-2 h-2 rounded-full bg-gradient-to-r ${tab.gradient} ${isActive ? '' : 'opacity-50'}`
                      : `w-2 h-2 rounded-full ${tab.dotColor} ${isActive ? 'animate-pulse' : 'opacity-40'}`
                  )} />
                  {tab.label}
          {isActive && !isAnyLoading && (portalJobs[tab.id]?.length || Object.values(portalJobs).flat().length) > 0 && (
                    <span className={cn('px-1.5 py-0 rounded-full text-[10px] font-bold', tab.activeBg, tab.activeText)}>
                      {tab.id === 'all' ? Object.values(portalJobs).flat().length : portalJobs[tab.id]?.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost" size="sm"
            onClick={doRefresh}
            disabled={isAnyLoading}
            className="h-8 px-2.5 rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isAnyLoading && 'animate-spin')} />
          </Button>
        </div>

        {/* Main listing container */}
        <div className="rounded-2xl border border-border/70 bg-card/30 p-4 min-h-[320px]">
          {/* Status info bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 mb-4">
            {!isAnyLoading && filteredJobs.length > 0 && totalPages > 1 && (
              <span className="text-[10px] text-muted-foreground font-semibold">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {portalErrorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{portalErrorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skeletons / Cards / Empty States */}
          <JobsErrorBoundary
            fallback={
              <div className="flex flex-col items-center justify-center py-10 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 p-8 space-y-4">
                <p className="font-semibold text-sm">Something went wrong loading portal jobs.</p>
                <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="rounded-xl text-xs h-9">
                  Retry
                </Button>
              </div>
            }
          >
            {filteredJobs.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activePortal}-${currentPage}-${viewMode}-${JSON.stringify(selectedJobTypes)}-${JSON.stringify(selectedExpLevels)}-${remoteOnly}-${salaryRange}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}
                  >
                    {pagedJobs.map((job, i) => (
                      <PortalJobCard
                        key={`${job.sourceId || `${job.title}-${i}`}`}
                        job={job}
                        index={i}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
                
                {isAnyLoading && (
                  <div className={cn('grid gap-4 mt-4', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
                    {Array.from({ length: 2 }).map((_, i) => (
                      <PortalJobSkeleton key={`loading-more-${i}`} />
                    ))}
                  </div>
                )}
              </div>
            ) : isAnyLoading ? (
              <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <PortalJobSkeleton key={i} />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-2">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">No jobs found</h3>
                  <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                    {rawJobs.length > 0
                      ? 'No live portal jobs match your filter criteria. Try adjusting them.'
                      : 'No jobs match your search keywords on this portal.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {rawJobs.length > 0 && (
                    <Button onClick={clearAllFilters} variant="outline" className="rounded-xl text-xs">
                      Clear All Filters
                    </Button>
                  )}
                  <Button onClick={doRefresh} variant="outline" className="rounded-xl text-xs gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </Button>
                </div>
              </motion.div>
            )}
          </JobsErrorBoundary>

          {/* Pagination Controls matching Careers style */}
          {!isAnyLoading && filteredJobs.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-border/70 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-xl gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-xl gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
