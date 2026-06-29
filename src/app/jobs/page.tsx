'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, SlidersHorizontal, X, MapPin,
  Briefcase, LayoutGrid, List, Sparkles,
  Building2, Clock, AlertTriangle, Check,
  Activity, ArrowRight, ArrowLeft, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import JobCard from '@/components/job-card';
import { cn } from '@/lib/utils';
import { PREDEFINED_SKILLS } from '@/lib/skills-extractor';
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
  const loadingMessages = [
    "Searching LinkedIn...",
    "Checking Company Careers...",
    "Matching your skills...",
    "Ranking opportunities...",
    "Building personalized recommendations...",
    "Aggregating Indeed listings...",
    "Scanning Wellfound startup boards...",
    "Connecting to Internshala...",
    "Filtering roles based on experience..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

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
        {Array.from({ length: 12 }).map((_, i) => (
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
        
        {/* Pulsing Central Node with orbiting source items */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Outer Ripple Rings */}
          <motion.div
            className="absolute inset-0 rounded-full border border-primary/20"
            animate={{ scale: [0.9, 1.4, 0.9], opacity: [0.6, 0.1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-purple-500/20"
            animate={{ scale: [0.95, 1.25, 0.95], opacity: [0.8, 0.2, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
          />
          
          {/* AI Center Hub */}
          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] z-20"
            animate={{
              boxShadow: [
                "0 0 20px rgba(99,102,241,0.4)",
                "0 0 35px rgba(139,92,246,0.6)",
                "0 0 20px rgba(99,102,241,0.4)"
              ],
              rotate: [0, 360],
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>

          {/* Orbiting Sources */}
          {[
            { label: 'LinkedIn', color: 'bg-blue-500', delay: 0, x: -60, y: -40 },
            { label: 'Indeed', color: 'bg-purple-500', delay: 1.2, x: 60, y: -40 },
            { label: 'Wellfound', color: 'bg-teal-500', delay: 2.4, x: -50, y: 50 },
            { label: 'Internshala', color: 'bg-orange-500', delay: 3.6, x: 50, y: 50 },
          ].map((node, idx) => (
            <motion.div
              key={idx}
              className="absolute w-4 h-4 rounded-full flex items-center justify-center shadow-lg"
              animate={{
                x: [node.x, node.x * 1.15, node.x],
                y: [node.y, node.y * 1.15, node.y],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: node.delay,
              }}
            >
              <span className={`w-3.5 h-3.5 rounded-full ${node.color} ring-4 ring-background shadow-md`} />
              <span className={`absolute w-3.5 h-3.5 rounded-full ${node.color} animate-ping opacity-75`} />
            </motion.div>
          ))}
        </div>

        {/* Text Area */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-bold tracking-wide uppercase animate-pulse">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            AI Aggregator Active
          </div>
          
          <h3 className="text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Unified Search in Progress
          </h3>
          
          {/* Rotating Message */}
          <div className="h-6 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-sm text-muted-foreground font-medium"
              >
                {loadingMessages[msgIndex]}
              </motion.p>
            </AnimatePresence>
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
    "Connecting to LinkedIn API...",
    "Searching Indeed listings...",
    "Syncing Wellfound startup database...",
    "Scraping Internshala internships...",
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
  }, []);

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
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // Layout states
  const [mobileFilters, setMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'postedAt' | 'salaryMin'>('postedAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // Filter states
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExpLevels, setSelectedExpLevels] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [datePosted, setDatePosted] = useState<string>('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [salaryRange, setSalaryRange] = useState<number>(0); // Min salary in lakhs

  // Health and Sync Stats
  const [health, setHealth] = useState<any>({});
  const [outdatedSources, setOutdatedSources] = useState<string[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);

  // AI Matching States
  const [matching, setMatching] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [skillWarning, setSkillWarning] = useState(false);
  const [sourceCounts, setSourceCounts] = useState<{ [key: string]: number }>({
    linkedin: 0,
    indeed: 0,
    wellfound: 0,
    internshala: 0,
    careers: 0
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDataLoaded = useRef(false);
  
  // Cache key for sessionStorage based on the current query string
  const JOBS_CACHE_PREFIX = 'jobfusion_jobs_cache_';
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — skip re-fetch entirely if cache is fresh

  // 2. Fetch jobs — skips the API call completely if cache is fresh (< 5 min)
  const fetchFilteredJobs = async (searchParamsString: string, showSkeleton = false) => {
    const cacheKey = JOBS_CACHE_PREFIX + searchParamsString;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      try {
        const { jobs: cachedJobs, total, totalPages: tp, sourceCounts: sc, cachedAt } = JSON.parse(cached);
        const isFresh = cachedAt && (Date.now() - cachedAt) < CACHE_TTL_MS;

        // Restore cached data and turn off skeleton immediately
        setJobs(cachedJobs || []);
        setTotalJobsCount(total || 0);
        setTotalPages(tp || 1);
        if (sc) setSourceCounts(sc);
        setLoading(false); // ← skeleton dismissed immediately when cache exists

        if (isFresh) {
          // Cache is fresh — skip API call entirely, user sees jobs with zero wait
          return;
        }
        // Cache is stale — silently re-fetch in background (jobs already visible, no skeleton)
      } catch (_) { /* ignore corrupt cache, fall through to fetch */ }
    }
    // No cache — skeleton stays on (loading was true from mount) until API responds

    // ── Fetch from API (first load or stale cache) ──
    try {
      const res = await fetch(`/api/jobs?${searchParamsString}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data || []);
        setTotalJobsCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.sourceCounts) setSourceCounts(data.sourceCounts);
        // Save with timestamp so TTL check works on next visit
        sessionStorage.setItem(cacheKey, JSON.stringify({
          jobs: data.data || [],
          total: data.total || 0,
          totalPages: data.totalPages || 1,
          sourceCounts: data.sourceCounts || {},
          cachedAt: Date.now(),
        }));
      }
    } catch (err) {
      console.error("Failed to fetch jobs from API:", err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial Load: Fetch auth, saved jobs, applied jobs, health stats, and initial query string
  useEffect(() => {
    async function loadData() {
      // Trigger background sync cycle
      fetch('/api/cron/crawl', { method: 'POST' }).catch(err => console.error("Error starting auto-crawl:", err));

      try {
        const currentUser = await fetchCurrentUser();
        let prof: DbProfile | null = null;
        if (currentUser) {
          setUser(currentUser);
          const saved = await fetchSavedJobs(currentUser._id);
          setSavedJobIds(new Set(saved.map((s: DbSavedJob) => s.jobId?._id).filter(Boolean)));

          const apps = await fetchApplications(currentUser._id);
          setAppliedJobIds(new Set(apps.map((a: DbApplication) => a.jobId?._id).filter(Boolean)));
          
          prof = await fetchProfile(currentUser._id);
          setProfile(prof);
        }

        // Fetch health status
        const healthRes = await fetch('/api/jobs/sources/health');
        const healthData = await healthRes.json();
        if (healthData.success && healthData.data) {
          setHealth(healthData.data);
          
          // Check for outdated sources (status failed OR too long since last sync)
          // careers source crawls real company pages so allow 48h; others allow 24h
          const OUTDATED_THRESHOLD: Record<string, number> = {
            linkedin: 24,
            indeed: 24,
            wellfound: 24,
            internshala: 24,
            careers: 48,
          };
          const outdated: string[] = [];
          Object.entries(healthData.data).forEach(([source, info]: [string, any]) => {
            if (info.status === "failed") {
              outdated.push(source);
            } else if (info.lastSync) {
              const hoursSinceSync = (Date.now() - new Date(info.lastSync).getTime()) / (1000 * 60 * 60);
              const threshold = OUTDATED_THRESHOLD[source] ?? 24;
              if (hoursSinceSync > threshold) {
                outdated.push(source);
              }
            }
          });
          setOutdatedSources(outdated);
        }

        // Parse search params from URL on load (fallback to sessionStorage if URL is empty)
        let searchString = window.location.search;
        if (!searchString) {
          const cachedQuery = sessionStorage.getItem('jobfusion_filter_query');
          if (cachedQuery) {
            searchString = '?' + cachedQuery;
            window.history.replaceState(null, '', searchString);
          }
        }

        const params = new URLSearchParams(searchString);
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

        const hasExplicitFilters = params.get('q') || params.get('location') || params.get('remote') ||
          params.get('source') || params.get('jobType') || params.get('experienceLevel') ||
          params.get('skills') || params.get('salaryMin');

        if (!hasExplicitFilters && prof) {

          // ── inferExpLevel ──────────────────────────────────────────────────
          // Converts a free-text experience string OR a work history array into
          // one of: 'entry' | 'mid' | 'senior' | 'lead' | null
          const inferExpLevel = (expStr?: string | null, expHistory?: any[]): string | null => {
            const yearsToLevel = (y: number): string => {
              if (y <= 2)  return 'entry';
              if (y <= 5)  return 'mid';
              if (y <= 8)  return 'senior';
              return 'lead';
            };

            // 1️⃣  Try the free-text experience field first
            if (expStr && expStr.trim()) {
              const s = expStr.toLowerCase().trim();

              // Direct keyword matches (fast path)
              if (/\b(fresher|0\s*year|no\s*exp|intern)\b/.test(s)) return 'entry';
              if (/\b(junior|jr\.?)\b/.test(s)) return 'entry';
              if (/\b(entry[\s-]?level)\b/.test(s)) return 'entry';
              if (/\b(mid[\s-]?level|intermediate)\b/.test(s)) return 'mid';
              if (/\b(senior|sr\.?)\b/.test(s)) return 'senior';
              if (/\b(lead|principal|staff|architect)\b/.test(s)) return 'lead';
              if (/\b(manager|director|vp|head\s+of)\b/.test(s)) return 'lead';

              // Extract numeric year value — handles:
              //   "6 years", "6+ years", "6-8 years", "1.5 years", "~3 years"
              //   "3 to 5 years", "around 4 years"
              const numMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:to|-|–|and)?\s*(\d+)?\s*(?:\+|plus)?\s*(?:yr|year|yrs|years)/);
              if (numMatch) {
                // Use the lower bound of a range (more conservative)
                const years = parseFloat(numMatch[1]);
                return yearsToLevel(years);
              }

              // Bare number fallback: "6", "2+"
              const bareNum = s.match(/^(\d+(?:\.\d+)?)\s*\+?$/);
              if (bareNum) return yearsToLevel(parseFloat(bareNum[1]));
            }

            // 2️⃣  Fall back to counting work history entries
            if (expHistory && expHistory.length > 0) {
              // Each job entry ≈ ~2 years on average; cap at reasonable max
              const estimatedYears = Math.min(expHistory.length * 2, 15);
              return yearsToLevel(estimatedYears);
            }

            return null; // Can't infer — leave filter unselected
          };

          // ── inferSalaryMin ─────────────────────────────────────────────────
          // Parses expected salary free text → minimum salary in lakhs (integer)
          // Returns 0 if nothing can be parsed → salary filter stays unset
          const inferSalaryMin = (salStr?: string | null): number => {
            if (!salStr || !salStr.trim()) return 0;

            // Strip currency symbols, commas, spaces → work with digits and units only
            const s = salStr.replace(/[₹$€£,\s]/g, '').toLowerCase();

            // Pattern: number (optional decimal) optionally followed by unit
            // Captures the FIRST (minimum) value in a range like "28l–45l" → 28
            const match = s.match(/(\d+(?:\.\d+)?)\s*(?:l(?:pa|akh)?|k|cr)?/);
            if (!match) return 0;

            const raw = parseFloat(match[1]);
            const unit = match[0].replace(/[\d.]/g, '').trim(); // e.g. "l", "lpa", "k", "cr"

            let lakhs: number;
            if (raw > 100000) {
              // Looks like a full rupee amount (e.g. 2800000)
              lakhs = Math.floor(raw / 100000);
            } else if (unit.startsWith('cr')) {
              // Crore → lakhs
              lakhs = Math.floor(raw * 100);
            } else if (unit === 'k') {
              // Thousands (USD context) — convert roughly: ₹1000k ≈ unlikely, skip
              lakhs = 0;
            } else {
              // Already in lakhs (L / LPA / lakh)
              lakhs = Math.floor(raw);
            }

            // Sanity check: ignore implausible values (< 1L or > 500L)
            if (lakhs < 1 || lakhs > 500) return 0;
            return lakhs;
          };

          // ── Apply inferred filters ─────────────────────────────────────────
          const hasSkills = prof.skills && prof.skills.length > 0;
          const inferredExpLevel = inferExpLevel(prof.experience, prof.experiences);
          const inferredSalaryMin = inferSalaryMin(prof.expectedSalary);

          if (hasSkills || inferredExpLevel) {
            const userSkills = hasSkills ? prof.skills.map((s: any) => s.name.toLowerCase()) : [];

            // Update filter UI state
            if (userSkills.length > 0) setSelectedSkills(userSkills);
            if (inferredExpLevel)      setSelectedExpLevels([inferredExpLevel]);
            if (inferredSalaryMin > 0) setSalaryRange(inferredSalaryMin);

            // Build query string for API + URL bar
            const queryParams = new URLSearchParams();
            if (userSkills.length > 0)  queryParams.set('skills', userSkills.join(','));
            if (inferredExpLevel)        queryParams.set('experienceLevel', inferredExpLevel);
            if (inferredSalaryMin > 0)   queryParams.set('salaryMin', String(inferredSalaryMin * 100000));
            queryParams.set('sortBy', 'postedAt');
            queryParams.set('order', 'desc');

            sessionStorage.setItem('jobfusion_filter_query', queryParams.toString());
            window.history.replaceState(null, '', '?' + queryParams.toString());
            await fetchFilteredJobs(queryParams.toString(), true);

          } else {
            // Profile exists but has no usable data — load all jobs with filters unselected
            setSkillWarning(false);
            await fetchFilteredJobs('', true);
          }

        } else if (!hasExplicitFilters && !prof) {
          // No profile at all
          setSkillWarning(false);
          await fetchFilteredJobs('', true);
        } else {
          // Explicit filters present (URL/sessionStorage) — load normally
          await fetchFilteredJobs(searchString ? searchString.replace(/^\?/, '') : '', true);
        }
        initialDataLoaded.current = true;


      } catch (err) {
        console.error("Error loading initial jobs data:", err);
        setLoading(false);
      }
    }
    loadData();
  }, []);



  // 3. Build search params, update browser URL, and trigger fetch
  const handleFilterChange = (page = currentPage) => {
    const params = new URLSearchParams();

    if (queryInput) params.set('q', queryInput);
    if (locationInput) params.set('location', locationInput);
    if (remoteOnly) params.set('remote', 'true');
    if (sortBy) params.set('sortBy', sortBy);
    if (order) params.set('order', order);
    
    if (selectedSources.length > 0) params.set('source', selectedSources.join(','));
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
  }, [queryInput, locationInput]);

  // 5. Trigger filter update immediately when checkbox / dropdown filters change
  useEffect(() => {
    if (!initialDataLoaded.current) return;
    setCurrentPage(1);
    handleFilterChange(1);
  }, [selectedSources, selectedJobTypes, selectedExpLevels, selectedSkills, datePosted, remoteOnly, salaryRange, sortBy, order]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    handleFilterChange(newPage);
  };

  // AI Matching with Skills in Profile
  const handleAISearch = async () => {
    if (!user || !profile) return;
    
    const userSkills = profile.skills?.map(s => s.name.toLowerCase()) || [];
    if (userSkills.length === 0) {
      setSkillWarning(true);
      return;
    }
    
    setSkillWarning(false);
    setOutdatedSources([]); // User triggered a fresh fetch — dismiss stale sync banners
    setMatching(true);
    
    try {
      // Trigger background sync for user's profile skills
      await fetch('/api/cron/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: userSkills })
      });
      
      // Let the crawl start in background
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Select the skills in UI to filter the feed
      setSelectedSkills(userSkills);
      
      setToastMessage(`Fetching and matching live jobs for your ${userSkills.length} skills!`);
      setShowSuccessToast(true);
    } catch (error) {
      console.error("Error AI matching jobs:", error);
      setToastMessage("Failed to initiate live job match. Please try again.");
      setShowSuccessToast(true);
    } finally {
      setMatching(false);
    }
  };

  const toggleSource = (src: string) => {
    setSelectedSources(prev =>
      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
    );
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
    setShowSkillDropdown(false);
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
    
    sessionStorage.removeItem('jobfusion_filter_query');
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

  // Predefined skill search autocomplete results
  const filteredSkillDefinitions = skillSearch
    ? PREDEFINED_SKILLS.filter(def => 
        def.name.toLowerCase().includes(skillSearch.toLowerCase()) || 
        def.aliases.some(a => a.toLowerCase().includes(skillSearch.toLowerCase()))
      ).slice(0, 5)
    : [];

  const getSourceDisplayName = (src: string) => {
    if (src === 'linkedin') return 'LinkedIn';
    if (src === 'indeed') return 'Indeed';
    if (src === 'wellfound') return 'Wellfound';
    if (src === 'internshala') return 'Internshala';
    if (src === 'careers') return 'Company Careers';
    return src;
  };

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

        {/* Outdated Sync Alert Banner */}
        <AnimatePresence>
          {outdatedSources
            .filter(src => !dismissedBanners.includes(src))
            .map(src => {
              const info = health[src] || {};
              const timeStr = info.lastSync 
                ? `${Math.round((Date.now() - new Date(info.lastSync).getTime()) / (1000 * 60 * 60))}h ago`
                : 'unknown';
              return (
                <motion.div
                  key={src}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 flex items-start justify-between gap-3 text-xs shadow-sm"
                >
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold capitalize">{getSourceDisplayName(src)} data sync may be outdated.</span> Last synced: {timeStr}. Details will update automatically.
                    </div>
                  </div>
                  <button 
                    onClick={() => setDismissedBanners(prev => [...prev, src])}
                    className="text-amber-500/60 hover:text-amber-600 dark:hover:text-amber-300 flex-shrink-0 touch-auto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
        </AnimatePresence>

        {/* Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Find Your Next Role</h1>
            <p className="text-muted-foreground text-sm">
              {loading ? 'Searching opportunities...' : `Showing ${totalJobsCount} aggregate opportunities`}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-1.5">
            <Button 
              onClick={handleAISearch}
              disabled={loading || matching || !user}
              className="gradient-brand text-white border-0 rounded-xl h-10 px-5 font-semibold hover:opacity-90 shadow-md glow-sm flex items-center btn-press"
            >
              <Sparkles className={cn("w-4.5 h-4.5 mr-2", matching && "animate-spin")} />
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



        {/* Core Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* 1. Left Filtering Sidebar */}
          <aside className={cn(
            "lg:col-span-1 space-y-6 card-premium p-5",
            filtersCollapsed ? "lg:hidden" : "lg:block",
            mobileFilters ? "fixed inset-0 z-40 bg-background/95 backdrop-blur-md p-6 overflow-y-auto block space-y-6" : "hidden lg:block"
          )}>
            <div className="flex items-center justify-between lg:hidden mb-2">
              <h3 className="font-bold">Filters</h3>
              <Button size="icon" variant="ghost" onClick={() => setMobileFilters(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Source Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Job Portal Source</h4>
              <div className="space-y-2.5">
                {['linkedin', 'indeed', 'wellfound', 'internshala', 'careers'].map(src => {
                  const count = sourceCounts[src] ?? 0;
                  return (
                    <div key={src} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id={`src-${src}`}
                          checked={selectedSources.includes(src)}
                          onCheckedChange={() => toggleSource(src)}
                          className="rounded-lg border-border"
                        />
                        <Label htmlFor={`src-${src}`} className="text-xs font-semibold cursor-pointer capitalize">
                          {getSourceDisplayName(src)}
                        </Label>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold bg-muted px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    </div>
                  );
                })}
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
              <Input
                value={skillSearch}
                onChange={(e) => {
                  setSkillSearch(e.target.value);
                  setShowSkillDropdown(true);
                }}
                onFocus={() => setShowSkillDropdown(true)}
                placeholder="Type skill (e.g. React)..."
                className="rounded-xl bg-muted/40 text-xs border-border/80"
              />
              
              {showSkillDropdown && skillSearch && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 glass rounded-xl border border-border shadow-2xl p-1.5 max-h-48 overflow-y-auto">
                  {filteredSkillDefinitions.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">No matching skills found</p>
                  ) : (
                    filteredSkillDefinitions.map(def => (
                      <button
                        key={def.name}
                        onClick={() => addSkill(def.name)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-accent hover:text-foreground flex justify-between items-center touch-auto"
                      >
                        {def.name}
                        <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                      </button>
                    ))
                  )}
                </div>
              )}
              {showSkillDropdown && skillSearch && (
                <div className="fixed inset-0 z-10" onClick={() => setShowSkillDropdown(false)} />
              )}
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
                Found <strong className="text-foreground text-sm">{totalJobsCount}</strong> aggregate jobs
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

            {/* Main Jobs Listing */}
            <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
              {(loading && !skillWarning) ? (
                <PremiumJobsLoader />
              ) : skillWarning ? (
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
              ) : jobs.length === 0 ? (
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
                jobs.map((job, i) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    index={i}
                    userId={user?._id}
                    initialIsSaved={savedJobIds.has(job._id)}
                    initialIsApplied={appliedJobIds.has(job._id)}
                    onSavedToggle={handleSavedToggle}
                  />
                ))
              )}
            </div>

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
              <div className="flex justify-center gap-3 items-center mb-2">
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, 360, 360]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-white shadow-lg"
                >
                  <Sparkles className="w-7 h-7" />
                </motion.div>
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
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" /> LinkedIn
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" /> Indeed
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" /> Wellfound
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" /> Internshala
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Company Careers
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
              <Sparkles className="w-4.5 h-4.5 animate-bounce" />
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
    </>
  );
}
