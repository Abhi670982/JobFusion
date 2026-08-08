'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, SlidersHorizontal, X, MapPin,
  LayoutGrid, List, Target, Sparkles,
  Building2, AlertTriangle, Check,
  Activity, ArrowRight, ArrowLeft, Globe, Upload, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AutocompleteInput } from '@/components/ui/autocomplete';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import JobCard from '@/components/job-card';
import JobPortalsSection from '@/components/job-portals-section';
import { JobsErrorBoundary } from '@/components/error-boundary';
import { UpgradeModal } from '@/components/pricing/UpgradeModal';
import { PremiumPortalModal } from '@/components/pricing/PremiumPortalModal';
import { cn } from '@/lib/utils';
import {
  fetchCurrentUser,
  fetchProfile,
  fetchSavedJobs,
  fetchApplications,
  DbUser,
  DbJob,
  DbSavedJob,
  DbProfile,
  DbApplication
} from '@/lib/api-helper';

const EXPERIENCE_LEVELS = [
  { label: 'Entry Level', value: 'entry' },
  { label: 'Mid Level', value: 'mid' },
  { label: 'Senior Level', value: 'senior' },
  { label: 'Lead / Principal', value: 'lead' }
];

const JOB_TYPES = [
  { label: 'Full-time', value: 'full-time' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' },
  { label: 'Freelance', value: 'freelance' }
];

const DATE_POSTED = [
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 3 Days', value: '3d' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' }
];

function PremiumJobsLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const loadingMessages = [
    "Checking Company Careers...",
    "Matching your skills...",
    "Ranking opportunities...",
    "Building personalized recommendations...",
    "Scanning Wellfound startup boards...",
    "Aggregating job listings...",
    "Filtering roles based on experience..."
  ];

  // Map messages to current active source indices
  // Sources: 0: Wellfound, 1: Company Careers, 2: Aggregator
  const getActiveSourceIndex = (msg: string): number => {
    const s = msg.toLowerCase();
    if (s.includes('wellfound')) return 0;
    if (s.includes('company') || s.includes('careers')) return 1;
    if (s.includes('aggregat')) return 2;
    return -1;
  };

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [loadingMessages.length]);

  const currentMsg = loadingMessages[msgIndex];
  const activeSourceIdx = getActiveSourceIndex(currentMsg);

  const sources = [
    { name: 'Wellfound', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
    { name: 'Company Careers', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'Aggregator', color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
  ];

  return (
    <div className="col-span-full card-premium p-8 sm:p-12 flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden bg-gradient-to-br from-card/30 via-primary/5 to-card/30 border border-border/80 rounded-3xl">
      {/* Background Subtle Grid / Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(255,255,255,0))]" />
      
      {/* Moving scanner line */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent z-10"
        initial={{ top: "0%" }}
        animate={{ top: "100%" }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating Particles / Nodes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        {mounted && Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: Math.random() * 8 + 4,
              height: Math.random() * 8 + 4,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Core AI Visualization */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center space-y-8">
        
        {/* Animated circular loader */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Outer track */}
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-muted/30"
              strokeWidth="3.5"
              fill="none"
            />
            {/* Pulsing trace progress */}
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-primary"
              strokeWidth="4"
              fill="none"
              strokeDasharray="263.8"
              animate={{
                strokeDashoffset: [263.8, 0, 263.8],
                stroke: ["oklch(0.53 0.24 258)", "oklch(0.58 0.24 272)", "oklch(0.53 0.24 258)"]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Inner Ring */}
            <circle
              cx="50"
              cy="50"
              r="34"
              className="stroke-purple-500/10 dark:stroke-purple-500/20"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          
          {/* Central Pulsing Dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.4)]"
              animate={{
                scale: [0.95, 1.05, 0.95],
                boxShadow: [
                  "0 0 15px rgba(99,102,241,0.3)",
                  "0 0 30px rgba(139,92,246,0.5)",
                  "0 0 15px rgba(99,102,241,0.3)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Activity className="w-6 h-6 text-white animate-pulse" />
            </motion.div>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Unified Search in Progress
          </h3>
          <p className="text-xs text-muted-foreground font-semibold">
            Searching across multiple job sources...
          </p>
        </div>

        {/* Rotating Message & Current Portal Indicator */}
        <div className="w-full space-y-4">
          <div className="h-7 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-sm text-primary font-bold tracking-wide"
              >
                {currentMsg}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Sequential Sources Progress Animation */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {sources.map((src, idx) => {
              const isActive = activeSourceIdx === idx || (activeSourceIdx === -1 && idx === msgIndex % 5);
              return (
                <div
                  key={src.name}
                  className={cn(
                    "text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border transition-all duration-300 flex items-center gap-1.5",
                    isActive 
                      ? `${src.color} scale-105 opacity-100 shadow-sm`
                      : "opacity-40 border-transparent bg-transparent text-muted-foreground"
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isActive ? "bg-current animate-ping" : "bg-muted-foreground"
                  )} />
                  {src.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modern progress track */}
        <div className="w-full max-w-xs space-y-1">
          <div className="w-full h-1 bg-muted/60 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground/80 font-bold uppercase tracking-wider px-1">
            <span>Query Sent</span>
            <span>Gathering</span>
            <span>Filtering</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function PortalStatusText() {
  const [index, setIndex] = useState(0);
  const statuses = [
    "Checking Company Careers...",
    "Syncing Wellfound startup database...",
    "Scanning Google, Stripe, Vercel careers...",
    "Crawling company career pages...",
    "Filtering openings against your skills...",
    "Structuring unified search results..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % statuses.length);
    }, 700);
    return () => clearInterval(interval);
  }, [statuses.length]);

  return (
    <motion.span
      key={index}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
    >
      {statuses[index]}
    </motion.span>
  );
}

export default function JobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // true on mount — resolved instantly from cache or after fetch
  const [profileLoading, setProfileLoading] = useState(true);
  const [user, setUser] = useState<DbUser | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [totalJobsCount, setTotalJobsCount] = useState(0);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Input states
  const [queryInput, setQueryInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  // Layout states
  const [mobileFilters, setMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'careers' | 'portals'>('careers');
  const [sortBy, setSortBy] = useState<'postedAt' | 'relevance' | 'salaryMin'>('postedAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // Filter states
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExpLevels, setSelectedExpLevels] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [datePosted, setDatePosted] = useState<string>('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [salaryRange, setSalaryRange] = useState<number>(0); // Min salary in lakhs

  // AI Matching States
  const [matching, setMatching] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [skillWarning, setSkillWarning] = useState(false);
  /**
   * relevanceMode = true when the user has activated "Match My Skills".
   * Controls whether sortBy is treated as 'relevance' (tier→score→date)
   * or 'latest' (pure postedAtDate DESC).
   * Reset to false whenever the user explicitly selects a different sort.
   */
  const [relevanceMode, setRelevanceMode] = useState(false);

  // Usage tracking and Modals
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPremiumPortalModal, setShowPremiumPortalModal] = useState(false);
  const [targetPortalName, setTargetPortalName] = useState('Premium Portal');
  const [usageStats, setUsageStats] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    fetch('/api/user-plan/status')
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data && (data.status?.isPro || data.isPro)) setIsPro(true);
      })
      .catch(() => {});
  }, []);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDataLoaded = useRef(false);
  /**
   * Suppresses the filter-change effect for exactly ONE firing cycle.
   * Set to true by handleAISearch right before it calls setSortBy/setRelevanceMode
   * to prevent a redundant re-fetch when the effect fires due to those state changes.
   */
  const skipNextFilterEffect = useRef(false);
  
  // Cache key for sessionStorage based on the current query string
  const JOBS_CACHE_PREFIX = 'jobfusion_jobs_cache_';
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — skip re-fetch entirely if cache is fresh
 
  // 2. Fetch jobs — Stale-While-Revalidate for Company Careers to prevent pre-crawl lock-in
  const fetchFilteredJobs = async (searchParamsString: string) => {
    const cacheKey = JOBS_CACHE_PREFIX + searchParamsString;
    const cached = sessionStorage.getItem(cacheKey);

    const isCareers =
      searchParamsString.includes("source=careers") ||
      (!searchParamsString.includes("source=") && activeTab === "careers");

    if (cached) {
      try {
        const { jobs: cachedJobs, total, totalPages: tp, cachedAt } = JSON.parse(cached);
        const isFresh = Boolean(cachedAt && (Date.now() - Number(cachedAt)) < CACHE_TTL_MS);

        // Restore cached data and turn off skeleton immediately for zero-wait UI
        setJobs(cachedJobs || []);
        setTotalJobsCount(total || 0);
        setTotalPages(tp || 1);
        setLoading(false);

        // For non-careers sources: if cache is fresh (< 5 min), skip background API call.
        // For Company Careers: ALWAYS revalidate in background so fresh crawl results replace cached pre-crawl responses.
        if (!isCareers && isFresh) {
          return;
        }
      } catch {
        /* ignore corrupt cache, fall through to fetch */
      }
    }
    // No cache (or revalidating Careers) — fetch from API to get fresh results
    try {
      const res = await fetch(`/api/jobs?${searchParamsString}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data || []);
        setTotalJobsCount(data.total || 0);
        setTotalPages(data.totalPages || 1);

        if (data.data && data.data.length > 0) {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              jobs: data.data,
              total: data.total || 0,
              totalPages: data.totalPages || 1,
              cachedAt: Date.now(),
            })
          );
        } else {
          sessionStorage.removeItem(cacheKey);
        }
      }
    } catch (err) {
      console.error("Failed to fetch jobs from API:", err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial Load: Fetch auth, saved jobs, applied jobs, health stats, and initial query string
  useEffect(() => {
    // Clear guest search if it was used to route here
    sessionStorage.removeItem('guestSearch');
    
    async function loadData() {
      try {
        // Parse search params from URL immediately (no async needed)
        let searchString = window.location.search;
        if (!searchString) {
          const cachedQuery = sessionStorage.getItem('jobfusion_filter_query');
          if (cachedQuery) {
            searchString = '?' + cachedQuery;
            window.history.replaceState(null, '', searchString);
          }
        }

        const params = new URLSearchParams(searchString.replace(/^\?/, ''));

        // ── OPTIMISTIC JOBS FETCH ──────────────────────────────────────────────
        // Start fetching jobs immediately with URL params (or empty query = all jobs).
        // This runs in parallel with auth+profile fetches, eliminating the waterfall.
        // If the profile later resolves different filters, a second fetch will replace these results.
        const hasExplicitFilters = params.get('q') || params.get('location') || params.get('remote') ||
          params.get('source') || params.get('jobType') || params.get('experienceLevel') ||
          params.get('skills') || params.get('salaryMin');
        
        const optimisticQuery = hasExplicitFilters ? params.toString() : 'source=careers&sortBy=postedAt&order=desc';
        const optimisticFetchPromise = fetchFilteredJobs(optimisticQuery);

        // ── PARALLEL AUTH + DATA FETCH ─────────────────────────────────────────
        let profVal: DbProfile | null = null;
        const currentUser = await fetchCurrentUser();

        if (currentUser) {
          setUser(currentUser);

          // Now that we have the userId, fetch user-specific data in parallel
          const [saved, apps, prof] = await Promise.allSettled([
            fetchSavedJobs(currentUser._id),
            fetchApplications(currentUser._id),
            fetchProfile(currentUser._id),
          ]);

          if (saved.status === 'fulfilled') {
            setSavedJobIds(new Set(saved.value.map((s: DbSavedJob) => s.jobId?._id).filter(Boolean)));
          }
          if (apps.status === 'fulfilled') {
            setAppliedJobIds(new Set(apps.value.map((a: DbApplication) => a.jobId?._id).filter(Boolean)));
          }
          if (prof.status === 'fulfilled' && prof.value) {
            profVal = prof.value;
            setProfile(profVal);
          }

          // Fetch usage stats
          try {
            const usageRes = await fetch(`/api/user/usage?userId=${currentUser._id}`);
            if (usageRes.ok) {
              const usageData = await usageRes.json();
              if (usageData.success) {
                setUsageStats(usageData.data);
              }
            }
          } catch (e) {
            console.error("Failed to fetch usage stats:", e);
          }
        }

        // Restore filter UI state from URL params
        if (params.get('q')) setQueryInput(params.get('q') || '');
        if (params.get('location')) setLocationInput(params.get('location') || '');
        if (params.get('remote') === 'true') setRemoteOnly(true);
        if (params.get('sortBy')) setSortBy(params.get('sortBy') as any);
        if (params.get('order')) setOrder(params.get('order') as any);
        if (params.get('datePosted')) setDatePosted(params.get('datePosted') || '');
        if (params.get('salaryMin')) setSalaryRange(Math.floor(parseInt(params.get('salaryMin') || '0', 10) / 100000));
        if (params.get('page')) setCurrentPage(parseInt(params.get('page') || '1', 10));
        if (params.get('source')) setSelectedSources(params.get('source')!.split(','));
        if (params.get('jobType')) setSelectedJobTypes(params.get('jobType')!.split(','));
        if (params.get('experienceLevel')) setSelectedExpLevels(params.get('experienceLevel')!.split(','));

        let loadedSkills: string[] = [];
        if (params.get('skills')) {
          loadedSkills = params.get('skills')!.split(',');
          setSelectedSkills(loadedSkills);
        }

        // Wait for the optimistic fetch to finish before proceeding
        await optimisticFetchPromise;

        if (!hasExplicitFilters && profVal) {
          // Default load: fetch all fresh Company Careers inventory without restrictive AND gate

          // Default load: fetch all fresh Company Careers inventory without restrictive AND gate
          setSkillWarning(false);
          await fetchFilteredJobs('source=careers&sortBy=postedAt&order=desc');

        } else if (!hasExplicitFilters && !profVal) {
          // No profile at all — optimistic fetch already covers this
          setSkillWarning(false);
        } else {
          // Explicit filters present (URL/sessionStorage) — optimistic fetch already used URL params
        }
        initialDataLoaded.current = true;

      } catch (err) {
        console.error("Error loading initial jobs data:", err);
      } finally {
        setLoading(false);
        setProfileLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // 3. Build search params, update browser URL, and trigger fetch
  // currentRelevanceMode is passed explicitly so callers can override the state
  // (React state updates are asynchronous — the caller may have just changed it).
  const handleFilterChange = (page = currentPage, currentRelevanceMode = relevanceMode) => {
    const params = new URLSearchParams();

    if (queryInput) params.set('q', queryInput);
    if (locationInput) params.set('location', locationInput);
    if (remoteOnly) params.set('remote', 'true');

    // Forward the authenticated user's id so the server resolves their specific
    // profile skills instead of falling back to a random profile.
    if (user?._id) params.set('userId', user._id);

    // Compute the effective sort mode.
    // relevanceMode overrides whatever sortBy is set to — the server receives
    // sortBy=relevance so it uses tier→score→date ordering.
    const effectiveSortBy = currentRelevanceMode ? 'relevance' : sortBy;
    params.set('sortBy', effectiveSortBy);
    if (order) params.set('order', order);
    
    // Company Careers tab always restricts to source=careers by default.
    // If the user has manually selected sources via the source filter, honour that instead.
    const effectiveSources = selectedSources.length > 0 ? selectedSources : ['careers'];
    params.set('source', effectiveSources.join(','));
    if (selectedJobTypes.length > 0) params.set('jobType', selectedJobTypes.join(','));
    if (selectedExpLevels.length > 0) params.set('experienceLevel', selectedExpLevels.join(','));
    if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','));
    
    if (salaryRange > 0) {
      params.set('salaryMin', String(salaryRange * 100000));
    }

    if (datePosted) {
      const date = new Date();
      if (datePosted === '24h') date.setHours(date.getHours() - 24);
      else if (datePosted === '3d') date.setDate(date.getDate() - 3);
      else if (datePosted === '7d') date.setDate(date.getDate() - 7);
      else if (datePosted === '30d') date.setDate(date.getDate() - 30);
      params.set('postedAfter', date.toISOString());
      params.set('datePosted', datePosted); // Keep tag in URL
    }

    params.set('page', String(page));

    setSkillWarning(false);

    const newQueryString = params.toString();

    // Cache the filter query in sessionStorage
    sessionStorage.setItem('jobfusion_filter_query', newQueryString);

    // Update URL string
    const newUrl = newQueryString ? `?${newQueryString}` : window.location.pathname;
    window.history.pushState(null, '', newUrl);

    // Fetch jobs
    fetchFilteredJobs(newQueryString);
  };

  // 4. Trigger filter update with 300ms debouncing when query or location inputs change
  useEffect(() => {
    if (!initialDataLoaded.current) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      setCurrentPage(1);
      handleFilterChange(1);
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput, locationInput]);

  // 5. Trigger filter update immediately when checkbox / dropdown filters change
  useEffect(() => {
    if (!initialDataLoaded.current) return;
    // Skip this firing if handleAISearch just set the state (it already fetched directly).
    if (skipNextFilterEffect.current) {
      skipNextFilterEffect.current = false;
      return;
    }
    setCurrentPage(1);
    handleFilterChange(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSources, selectedJobTypes, selectedExpLevels, selectedSkills, datePosted, remoteOnly, salaryRange, sortBy, order]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    handleFilterChange(newPage);
  };

  // Scroll to top on any page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  // AI Matching with Skills in Profile — Decoupled from global crawling.
  // Queries current PostgreSQL inventory directly, computes user relevance, and applies tier ranking.
  const handleAISearch = async () => {
    if (!user || !profile) {
      setSkillWarning(true);
      return;
    }
    
    const hasResume = Boolean(profile?.resumeUrl || profile?.resumeText);
    if (!hasResume) {
      setToastMessage('Upload your resume to unlock personalized job matching.');
      setShowSuccessToast(true);
      return;
    }

    const userSkills = profile.skills?.map(s => s.name.toLowerCase()) || [];
    if (userSkills.length === 0) {
      setSkillWarning(true);
      return;
    }
    
    setSkillWarning(false);
    setMatching(true);

    try {
      // Build the relevance-mode query directly — do NOT rely on the effect chain
      // because React state updates (setRelevanceMode, setSelectedSkills, setSortBy)
      // are batched asynchronously and won't be visible until the next render.
      // We construct the URL params here with the known desired values.
      const params = new URLSearchParams();
      if (queryInput) params.set('q', queryInput);
      if (locationInput) params.set('location', locationInput);
      if (remoteOnly) params.set('remote', 'true');
      // Always forward the authenticated user's id for reliable skill resolution.
      params.set('userId', user._id);
      // Request relevance ordering: tier DESC → score DESC → date DESC.
      params.set('sortBy', 'relevance');
      params.set('order', 'desc');
      const effectiveSources = selectedSources.length > 0 ? selectedSources : ['linkedin', 'wellfound', 'indeed', 'internshala', 'foundit', 'naukri', 'careers'];
      params.set('source', effectiveSources.join(','));
      // Also send skill names as a query-param fallback (belt-and-suspenders).
      params.set('skills', userSkills.join(','));
      if (datePosted) params.set('datePosted', datePosted);
      params.set('page', '1');

      const queryString = params.toString();

      // Perform the fetch and WAIT for the response before updating any UI state.
      const res = await fetch(`/api/jobs?${queryString}`);
      const data = await res.json();

      if (!data.success) {
        console.warn('[Match My Skills] API returned error:', data.error);
        setToastMessage('Matching failed. Please try again.');
        setShowSuccessToast(true);
        return;
      }

      const returnedJobs: DbJob[] = data.data || [];

      if (process.env.NODE_ENV === 'development') {
        console.group('[Match My Skills] Verification');
        console.log('User skills used:', userSkills);
        console.log('Jobs returned:', returnedJobs.length);
        const scores = returnedJobs.map(j => j.matchScore ?? 0);
        console.log('matchScore range:', scores.length > 0 ? `${Math.min(...scores)} – ${Math.max(...scores)}` : 'N/A');
        console.log('Top 10 job titles + scores:',
          returnedJobs.slice(0, 10).map(j => ({ title: j.title, company: j.company, score: j.matchScore }))
        );
        console.groupEnd();
      }

      if (returnedJobs.length === 0) {
        setToastMessage('No matching jobs found for your skills. Try broadening your skills.');
        setShowSuccessToast(true);
        return;
      }

      // Now that we have a successful non-empty response, commit all state updates.
      // Activate relevance mode: the sort dropdown will display "Sort: Relevance".
      // Set skipNextFilterEffect BEFORE the state setters so the dep-array effect
      // that fires due to setSortBy/setSelectedSkills does NOT cause a second fetch.
      skipNextFilterEffect.current = true;
      setRelevanceMode(true);
      setSortBy('relevance');
      setSelectedSkills(userSkills);
      setCurrentPage(1);
      setJobs(returnedJobs);
      setTotalJobsCount(data.total || returnedJobs.length);
      setTotalPages(data.totalPages || 1);

      // Cache the relevance-mode response.
      sessionStorage.setItem(
        'jobfusion_jobs_cache_' + queryString,
        JSON.stringify({
          jobs: returnedJobs,
          total: data.total || returnedJobs.length,
          totalPages: data.totalPages || 1,
          cachedAt: Date.now(),
        })
      );
      sessionStorage.setItem('jobfusion_filter_query', queryString);
      window.history.pushState(null, '', `?${queryString}`);

      setToastMessage(`Matched ${returnedJobs.length} opportunities with your profile skills.`);
      setShowSuccessToast(true);
    } catch (error: any) {
      console.warn('[Match My Skills] Network/parse error:', error.message);
      setToastMessage('Matching failed. Please check your connection.');
      setShowSuccessToast(true);
    } finally {
      setMatching(false);
    }
  };

  const toggleJobType = (type: string) => {
    setSelectedJobTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleExpLevel = (level: string) => {
    setSelectedExpLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const addSkill = (skill: string) => {
    const s = skill.toLowerCase();
    if (!selectedSkills.includes(s)) {
      setSelectedSkills(prev => [...prev, s]);
    }
    setSkillSearch('');
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  };

  const clearAll = () => {
    setSelectedSources([]);
    setSelectedJobTypes([]);
    setSelectedExpLevels([]);
    setDatePosted('');
    setRemoteOnly(false);
    setSalaryRange(0);
    setQueryInput('');
    setLocationInput('');
    setSortBy('postedAt');
    setOrder('desc');
    // Also exit relevance mode so the sort dropdown shows "Latest" again.
    setRelevanceMode(false);
    
    sessionStorage.removeItem('jobfusion_filter_query');
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('jobfusion_jobs_cache_')) {
        sessionStorage.removeItem(key);
      }
    });
    window.history.pushState(null, '', window.location.pathname);

    if (profile && profile.skills && profile.skills.length > 0) {
      setSelectedSkills(profile.skills.map((s: any) => s.name.toLowerCase()));
    } else {
      setSelectedSkills([]);
    }
  };

  const handleSavedToggle = (jobId: string, nowSaved: boolean) => {
    setSavedJobIds(prev => {
      const next = new Set(prev);
      if (nowSaved) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
  };

  // RULE 1: Defensive client-side 10-day filter guard for careers source (matching backend)
  const jobsList = (Array.isArray(jobs) ? jobs : []).filter(job => {
    if (job.source !== 'careers') return true;
    if (!job.postedAtDate) return true; // keep active un-dated listings
    const age = Date.now() - new Date(job.postedAtDate).getTime();
    return age <= 10 * 24 * 60 * 60 * 1000;
  });

  // Warn if client-side filter discarded any stale careers jobs
  if (jobs.length !== jobsList.length) {
    console.warn(
      `CLIENT FILTER: Removed ${jobs.length - jobsList.length} jobs ` +
      `that were older than 24h. Check API or pipeline rules.`
    );
  }

  // Derive authoritative resume skill status
  const profileSkills = profile?.skills?.map((s: any) => typeof s === 'string' ? s : s.name) || [];
  const hasResumeSkills = (Array.isArray(profileSkills) && profileSkills.length > 0) || (Array.isArray(selectedSkills) && selectedSkills.length > 0);

  return (
    <>
      <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-[1440px] w-full mx-auto space-y-5">
        {/* Back Button */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="h-8 px-2.5 rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent -ml-2 transition-all touch-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Button>
        </div>

        {/* Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {activeTab === 'careers' && !hasResumeSkills && !profileLoading && !loading
                ? 'Find Your Next Role'
                : 'Find Your Next Role'
              }
            </h1>
            <p className="text-muted-foreground text-sm">
              {profileLoading || loading
                ? 'Searching opportunities...'
                : activeTab === 'careers'
                ? hasResumeSkills
                  ? `${totalJobsCount} company career opportunities`
                  : 'Upload your resume to discover relevant opportunities'
                : 'Live results from external job portals'
              }
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-1.5">
            {usageStats && !usageStats.isPro && (
              <div className="flex items-center gap-2 mb-1">
                <div className="flex flex-col items-end bg-card px-3 py-1.5 rounded-xl border border-border shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                    AI Usage Today
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", 
                          (usageStats.featureUsage?.['match-my-skills'] || 0) >= usageStats.limit 
                            ? "bg-red-500" 
                            : "bg-primary"
                        )}
                        style={{ width: `${Math.min(100, ((usageStats.featureUsage?.['match-my-skills'] || 0) / usageStats.limit) * 100)}%` }}
                      />
                    </div>
                    <span className={cn("text-[11px] font-bold", 
                      (usageStats.featureUsage?.['match-my-skills'] || 0) >= usageStats.limit ? "text-red-500" : "text-foreground"
                    )}>
                      {(usageStats.featureUsage?.['match-my-skills'] || 0)} / {usageStats.limit} Used
                    </span>
                  </div>
                </div>
              </div>
            )}
            <Button 
              onClick={handleAISearch}
              disabled={loading || matching || !user}
              className="gradient-brand text-white border-0 rounded-xl h-10 px-5 font-semibold hover:opacity-90 shadow-md glow-sm flex items-center btn-press"
            >
              <Target className={cn("w-4.5 h-4.5 mr-2", matching && "animate-spin")} />
              {matching ? 'Matching skills...' : 'Match My Skills'}
            </Button>
            {skillWarning && (
              <p className="text-red-500 text-xs font-semibold mt-1">
                Please <Link href="/resume" className="underline font-bold hover:text-red-600 transition-colors">add your skills</Link> in the resume section first!
              </p>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass bg-white/90 dark:bg-black/60 backdrop-blur-3xl rounded-2xl p-2.5 border border-white/20 dark:border-white/8 shadow-sm relative z-30">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2.5 flex-1 px-3">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input 
                value={queryInput} 
                onChange={(e) => setQueryInput(e.target.value)} 
                placeholder="Role, title, or company..." 
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 px-0 text-sm" 
              />
            </div>
            <div className="hidden sm:block w-px bg-border/60 my-2" />
            <div className="flex items-center gap-2.5 flex-1 px-3">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input 
                value={locationInput} 
                onChange={(e) => setLocationInput(e.target.value)} 
                placeholder="City, country or remote..." 
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 px-0 text-sm" 
              />
            </div>
          </div>
        </div>

        {/* Compact Resume Upload Blocking Card */}
        {!profileLoading && !Boolean(profile?.resumeUrl || profile?.resumeText) && (
          <div className="card-premium p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-primary/20 bg-primary/5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Upload your resume to unlock personalized job matching.
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get AI-powered skill matching, candidate relevance scoring, and accurate recommendations.
                </p>
              </div>
            </div>
            <Link href="/resume">
              <Button size="sm" className="rounded-xl gradient-brand text-white border-0 font-semibold text-xs shadow-md whitespace-nowrap">
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload Resume
              </Button>
            </Link>
          </div>
        )}



        {/* ─── Tab Switcher ─────────────────────────────────────────────────── */}
        <div className="relative flex items-center justify-center">
          {/* Background pill track */}
          <div className="relative flex items-center gap-1 p-1 rounded-2xl bg-card/60 border border-border/70 backdrop-blur-md shadow-sm">

            {/* Careers Tab */}
            <button
              id="tab-company-careers"
              onClick={() => setActiveTab('careers')}
              className={cn(
                'relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                activeTab === 'careers'
                  ? 'text-white shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              {/* Active background */}
              {activeTab === 'careers' && (
                <motion.div
                  layoutId="tab-active-bg"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Careers
              </span>
            </button>

            {/* Portals Tab */}
            <button
              id="tab-job-portals"
              onClick={() => setActiveTab('portals')}
              className={cn(
                'relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                activeTab === 'portals'
                  ? 'text-white shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              {activeTab === 'portals' && (
                <motion.div
                  layoutId="tab-active-bg"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_4px_14px_rgba(99,102,241,0.35)]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Job Portals
              </span>
            </button>
          </div>

          {/* Decorative divider lines */}
          <div className="hidden sm:block absolute left-0 right-0 top-1/2 -z-10 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>

        {/* ─── Company Careers Tab Content ──────────────────────────────────── */}
        {activeTab === 'careers' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="careers-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* 1. Left Filtering Sidebar */}
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



            {/* Job Type Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Job Type</h4>
              <div className="space-y-2.5">
                {JOB_TYPES.map(type => (
                  <div key={type.value} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`type-${type.value}`}
                      checked={selectedJobTypes.includes(type.value)}
                      onCheckedChange={() => toggleJobType(type.value)}
                      className="rounded-lg border-border"
                    />
                    <Label htmlFor={`type-${type.value}`} className="text-xs font-semibold cursor-pointer">
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
                {EXPERIENCE_LEVELS.map(lvl => (
                  <div key={lvl.value} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`lvl-${lvl.value}`}
                      checked={selectedExpLevels.includes(lvl.value)}
                      onCheckedChange={() => toggleExpLevel(lvl.value)}
                      className="rounded-lg border-border"
                    />
                    <Label htmlFor={`lvl-${lvl.value}`} className="text-xs font-semibold cursor-pointer">
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
                <Label htmlFor="remote-toggle" className="text-xs font-bold cursor-pointer">Remote Only</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Show only work-from-home roles</p>
              </div>
              <Checkbox
                id="remote-toggle"
                checked={remoteOnly}
                onCheckedChange={() => setRemoteOnly(prev => !prev)}
                className="rounded-lg border-border"
              />
            </div>

            <Separator />

            {/* Salary Slider (0-50L) */}
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

            <Separator />

            {/* Date Posted */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date Posted</h4>
              <div className="space-y-2.5">
                {DATE_POSTED.map(item => (
                  <div key={item.value} className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      id={`date-${item.value}`}
                      name="datePosted"
                      checked={datePosted === item.value}
                      onChange={() => setDatePosted(item.value)}
                      className="w-3.5 h-3.5 text-primary border-border focus:ring-primary cursor-pointer accent-primary"
                    />
                    <Label htmlFor={`date-${item.value}`} className="text-xs font-semibold cursor-pointer">
                      {item.label}
                    </Label>
                  </div>
                ))}
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    id="date-all"
                    name="datePosted"
                    checked={datePosted === ''}
                    onChange={() => setDatePosted('')}
                    className="w-3.5 h-3.5 text-primary border-border focus:ring-primary cursor-pointer accent-primary"
                  />
                  <Label htmlFor="date-all" className="text-xs font-semibold cursor-pointer">
                    Any Time
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Skills Search */}
            <div className="relative space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filter by Skills</h4>
              <div className="flex gap-1.5 flex-wrap">
                {selectedSkills.map(skill => (
                  <Badge key={skill} variant="secondary" className="rounded-full pl-2 pr-1.5 py-0.5 gap-1 capitalize text-xs">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="touch-auto">
                      <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
              </div>
              <AutocompleteInput
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                dataSource="skills"
                onSelect={(skill) => addSkill(skill)}
                placeholder="Type skill (e.g. React)..."
                className="rounded-xl bg-muted/40 text-xs border-border/80"
              />
            </div>

            {/* Reset All */}
            <Button onClick={clearAll} variant="outline" className="w-full rounded-xl text-xs h-9">
              Reset All Filters
            </Button>
          </aside>

          {/* 2. Right Job Cards feed */}
          <div className={cn("space-y-4", filtersCollapsed ? "lg:col-span-4" : "lg:col-span-3")}>
            
            {/* Header and Toolbar */}
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
                {profileLoading || loading ? (
                  'Searching opportunities...'
                ) : activeTab === 'careers' ? (
                  hasResumeSkills ? (
                    <>
                      Found <strong className="text-foreground text-sm">{totalJobsCount}</strong> relevant company jobs
                    </>
                  ) : (
                    'Add your skills to see matching jobs'
                  )
                ) : (
                  <>
                    Found <strong className="text-foreground text-sm">{totalJobsCount}</strong> portal jobs
                  </>
                )}
              </p>

              <div className="flex items-center gap-3.5">
                {/* Sorting dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl border-border h-9 font-medium gap-1 text-xs select-none hover:bg-accent touch-auto">
                      Sort: {relevanceMode ? 'Relevance' : sortBy === 'postedAt' ? 'Latest' : 'Salary (Min)'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl">
                    <DropdownMenuCheckboxItem
                      checked={!relevanceMode && sortBy === 'postedAt'}
                      onCheckedChange={() => {
                        // Clear relevance mode \u2014 return to pure chronological order.
                        setRelevanceMode(false);
                        setSortBy('postedAt');
                      }}
                      className="rounded-lg text-xs cursor-pointer"
                    >
                      Latest Posted
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={relevanceMode}
                      onCheckedChange={() => {
                        if (selectedSkills.length > 0 || (profile?.skills && profile.skills.length > 0)) {
                          setRelevanceMode(true);
                          setSortBy('relevance');
                        }
                      }}
                      className="rounded-lg text-xs cursor-pointer"
                    >
                      Relevance
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={!relevanceMode && sortBy === 'salaryMin'}
                      onCheckedChange={() => {
                        setRelevanceMode(false);
                        setSortBy('salaryMin');
                      }}
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

            {/* Main Jobs Listing with Error Boundary */}
            <JobsErrorBoundary
              fallback={
                <div className="col-span-full flex flex-col items-center justify-center py-10 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 p-8 space-y-4">
                  <p className="font-semibold text-sm">Something went wrong loading jobs.</p>
                  <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="rounded-xl text-xs h-9">
                    Retry
                  </Button>
                </div>
              }
            >
              <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
                {matching ? (
                  <PremiumJobsLoader />
                ) : (profileLoading || loading) ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="card-premium p-6 rounded-2xl space-y-4 animate-pulse border border-border/40">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted/60" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-3/4 rounded bg-muted/60" />
                          <div className="h-3 w-1/2 rounded bg-muted/60" />
                        </div>
                      </div>
                      <div className="h-12 w-full rounded-xl bg-muted/40" />
                      <div className="flex gap-2 pt-2">
                        <div className="h-6 w-16 rounded-lg bg-muted/60" />
                        <div className="h-6 w-16 rounded-lg bg-muted/60" />
                      </div>
                    </div>
                  ))
                ) : (!hasResumeSkills && activeTab === 'careers') || skillWarning ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-card/10 border border-dashed border-red-500/30 rounded-3xl p-8 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/5 border border-red-500/15 flex items-center justify-center text-red-500 mb-2">
                      <AlertTriangle className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No Skills Added</h3>
                      <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                        To find relevant jobs, please upload your resume or add skills in the resume section.
                      </p>
                    </div>
                    <Link href="/resume">
                      <Button className="rounded-xl gradient-brand text-white border-0 shadow-md btn-press">
                        Go to Resume Section
                      </Button>
                    </Link>
                  </div>
                ) : jobsList.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-card/10 border border-dashed border-border/80 rounded-3xl p-8 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-2">
                      <Activity className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base">No jobs found</h3>
                      <p className="text-muted-foreground text-xs max-w-xs mx-auto">No aggregate jobs match your criteria. Try adjusting filters or clearing them.</p>
                    </div>
                    <Button onClick={clearAll} variant="outline" className="rounded-xl">Clear All Filters</Button>
                  </div>
                ) : (
                  jobsList.map((job, i) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      index={i}
                      userId={user?._id}
                      isPro={isPro}
                      initialIsSaved={savedJobIds.has(job._id)}
                      initialIsApplied={appliedJobIds.has(job._id)}
                      onSavedToggle={handleSavedToggle}
                      onRequirePremiumPortal={(pName) => {
                        setTargetPortalName(pName);
                        setShowPremiumPortalModal(true);
                      }}
                    />
                  ))
                )}
              </div>
            </JobsErrorBoundary>

            {/* Pagination Controls */}
            {!loading && !skillWarning && totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-border/70 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </Button>
                <span className="text-xs text-muted-foreground font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl gap-1"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

        </div>
            </motion.div>
          </AnimatePresence>
        )} {/* end careers tab */}

        {/* ─── Job Portals Tab Content ──────────────────────────────────────── */}
        {activeTab === 'portals' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="portals-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {!hasResumeSkills && !profileLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-card/10 border border-dashed border-red-500/30 rounded-3xl p-8 space-y-4 my-6">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/5 border border-red-500/15 flex items-center justify-center text-red-500 mb-2">
                    <AlertTriangle className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No Skills Added</h3>
                    <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                      To find relevant jobs, please upload your resume or add skills in the resume section.
                    </p>
                  </div>
                  <Link href="/resume">
                    <Button className="rounded-xl gradient-brand text-white border-0 shadow-md btn-press">
                      Go to Resume Section
                    </Button>
                  </Link>
                </div>
              ) : (
                <JobPortalsSection
                  keyword={queryInput}
                  locationInput={locationInput}
                  profileSkills={profile?.skills.map((s) => s.name) || []}
                  mobileFilters={mobileFilters}
                  setMobileFilters={setMobileFilters}
                  filtersCollapsed={filtersCollapsed}
                  setFiltersCollapsed={setFiltersCollapsed}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Premium Upgrade Banner for Free Users */}
        {!isPro && (
          <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-card border border-indigo-500/30 shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 max-w-xl relative z-10">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-wider border border-indigo-500/30 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Unlock All Platforms
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                Unlock jobs from 6+ platforms including Indeed, Internshala, Foundit, Naukri, Company Career Pages, and future integrations.
              </h3>
              <p className="text-xs text-muted-foreground">
                Free members can access LinkedIn and Wellfound. Upgrade to Premium for full multi-platform aggregation.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 relative z-10 w-full sm:w-auto">
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="flex-1 sm:flex-none rounded-xl gradient-brand text-white font-bold h-11 px-6 shadow-lg hover:opacity-90"
              >
                Upgrade
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/pricing')}
                className="flex-1 sm:flex-none rounded-xl border-border h-11 px-6 font-semibold"
              >
                Compare Plans
              </Button>
            </div>
          </div>
        )}

      </main>

      {/* Loading Overlay */}
      <AnimatePresence>
        {matching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full glass rounded-3xl p-8 border border-border shadow-2xl text-center space-y-6 bg-card/50"
            >
              <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                {/* Central pulsing core */}
                <motion.div
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] z-10"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
                </motion.div>
                
                {/* Radar sweep */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-primary/30"
                  style={{ borderStyle: 'dashed' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Outer Ring */}
                <motion.div
                  className="absolute inset-2 rounded-full border border-purple-500/20"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Orbiting nodes */}
                {[0, 1, 2].map((idx) => (
                  <motion.div
                    key={idx}
                    className="absolute w-3 h-3 rounded-full bg-primary"
                    style={{
                      top: '50%',
                      left: '50%',
                      marginTop: '-6px',
                      marginLeft: '-6px',
                    }}
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 4 + idx * 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <motion.div
                      className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-purple-500 shadow-md"
                      style={{
                        transform: `translate(${32 + idx * 10}px, 0)`,
                      }}
                    />
                  </motion.div>
                ))}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Aggregating Job Openings</h3>
                <p className="text-xs text-muted-foreground">Scanning major job portals for roles matching your profile...</p>
              </div>

              {/* Portal Cycle Animation */}
              <div className="h-10 flex items-center justify-center text-sm font-semibold text-primary">
                <PortalStatusText />
              </div>

              {/* Minimal progress bar */}
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute top-0 bottom-0 w-1/3 gradient-brand rounded-full"
                />
              </div>

              <div className="flex justify-center gap-6 pt-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" /> Wellfound
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Company Careers
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" /> Aggregator
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl glass border border-emerald-500/20 shadow-2xl flex items-start gap-3 bg-card/90"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
              <Check className="w-4.5 h-4.5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Skill Match Complete</h4>
              <p className="text-sm font-semibold text-foreground mt-0.5">{toastMessage}</p>
            </div>
            <button onClick={() => setShowSuccessToast(false)} className="text-muted-foreground hover:text-foreground touch-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <UpgradeModal 
        open={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        title="🚀 Daily Free Limit Reached"
        subtitle="You've already used your 2 free Match My Skills refreshes today. Upgrade to Pro for unlimited access."
        featureName="Match My Skills"
      />

      <PremiumPortalModal
        open={showPremiumPortalModal}
        onClose={() => setShowPremiumPortalModal(false)}
        portalName={targetPortalName}
      />
    </>
  );
}
