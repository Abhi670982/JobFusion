'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, SlidersHorizontal, X, MapPin,
  Briefcase, LayoutGrid, List, Sparkles,
  Building2, Clock, AlertTriangle, Check,
  Activity, ArrowRight, ArrowLeft
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

function JobCardSkeleton() {
  return (
    <div className="card-premium p-5 flex flex-col justify-between h-56">
      <div className="flex gap-3">
        <Skeleton className="w-11 h-11 rounded-xl animate-pulse" />
        <div className="space-y-2 flex-1">
          <Skeleton className="w-2/3 h-5 animate-pulse" />
          <Skeleton className="w-1/3 h-4 animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2 my-3">
        <Skeleton className="w-16 h-5 rounded-lg animate-pulse" />
        <Skeleton className="w-16 h-5 rounded-lg animate-pulse" />
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
        <Skeleton className="w-24 h-4 animate-pulse" />
        <Skeleton className="w-16 h-7 rounded-lg animate-pulse" />
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DbUser | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [totalJobsCount, setTotalJobsCount] = useState(0);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

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
    internshala: 0
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDataLoaded = useRef(false);

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
          
          // Check for outdated sources (>6 hours since last sync or status failed)
          const outdated: string[] = [];
          Object.entries(healthData.data).forEach(([source, info]: [string, any]) => {
            if (info.status === "failed") {
              outdated.push(source);
            } else if (info.lastSync) {
              const hoursSinceSync = (Date.now() - new Date(info.lastSync).getTime()) / (1000 * 60 * 60);
              if (hoursSinceSync > 6) {
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
        
        if (params.get('source')) setSelectedSources(params.get('source')!.split(','));
        if (params.get('jobType')) setSelectedJobTypes(params.get('jobType')!.split(','));
        if (params.get('experienceLevel')) setSelectedExpLevels(params.get('experienceLevel')!.split(','));
        
        let loadedSkills: string[] = [];
        if (params.get('skills')) {
          loadedSkills = params.get('skills')!.split(',');
          setSelectedSkills(loadedSkills);
        }

        const hasExplicitFilters = params.get('q') || params.get('location') || params.get('remote') || params.get('source') || params.get('jobType') || params.get('experienceLevel') || params.get('skills');

        if (!hasExplicitFilters && prof && prof.skills && prof.skills.length > 0) {
          const userSkills = prof.skills.map((s: any) => s.name.toLowerCase());
          setSelectedSkills(userSkills);
          
          const queryParams = new URLSearchParams();
          queryParams.set('skills', userSkills.join(','));
          queryParams.set('sortBy', 'postedAt');
          queryParams.set('order', 'desc');
          
          // Cache in sessionStorage and update URL
          sessionStorage.setItem('jobfusion_filter_query', queryParams.toString());
          window.history.replaceState(null, '', '?' + queryParams.toString());
          await fetchFilteredJobs(queryParams.toString());
        } else if (!hasExplicitFilters && (!prof || !prof.skills || prof.skills.length === 0)) {
          // No skills found! Show empty state prompting to add skills
          setSkillWarning(true);
          setJobs([]);
          setTotalJobsCount(0);
          setLoading(false);
        } else {
          // Normal load from search params
          await fetchFilteredJobs(searchString ? searchString.replace(/^\?/, '') : '');
        }
        initialDataLoaded.current = true;
      } catch (err) {
        console.error("Error loading initial jobs data:", err);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Fetch jobs from the backend API
  const fetchFilteredJobs = async (searchParamsString: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs?${searchParamsString}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data || []);
        setTotalJobsCount(data.total || 0);
        if (data.sourceCounts) {
          setSourceCounts(data.sourceCounts);
        }
      }
    } catch (err) {
      console.error("Failed to fetch jobs from API:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Build search params, update browser URL, and trigger fetch
  const handleFilterChange = () => {
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
      handleFilterChange();
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [queryInput, locationInput]);

  // 5. Trigger filter update immediately when checkbox / dropdown filters change
  useEffect(() => {
    if (!initialDataLoaded.current) return;
    handleFilterChange();
  }, [selectedSources, selectedJobTypes, selectedExpLevels, selectedSkills, datePosted, remoteOnly, salaryRange, sortBy, order]);

  // AI Matching with Skills in Profile
  const handleAISearch = async () => {
    if (!user || !profile) return;
    
    const userSkills = profile.skills?.map(s => s.name.toLowerCase()) || [];
    if (userSkills.length === 0) {
      setSkillWarning(true);
      return;
    }
    
    setSkillWarning(false);
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
      
      setToastMessage(`AI is fetching and matching live jobs for your ${userSkills.length} skills!`);
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
    setSelectedSkills([]);
    setDatePosted('');
    setRemoteOnly(false);
    setSalaryRange(0);
    setQueryInput('');
    setLocationInput('');
    setSortBy('postedAt');
    setOrder('desc');
    
    sessionStorage.removeItem('jobfusion_filter_query');
    window.history.pushState(null, '', window.location.pathname);
    fetchFilteredJobs('');
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
    return src;
  };

  return (
    <>
      <main className="flex-1 p-3 sm:p-4 lg:p-6">
          {/* Back Button */}
          <div className="mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-2 transition-all touch-auto"
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
                    className="mb-4 p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold capitalize">{getSourceDisplayName(src)} data sync may be outdated.</span> Last synced: {timeStr}. Details will update automatically.
                      </div>
                    </div>
                    <button 
                      onClick={() => setDismissedBanners(prev => [...prev, src])}
                      className="text-amber-500/60 hover:text-amber-600 dark:hover:text-amber-300 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {/* Search Header */}
          <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                className="gradient-brand text-white border-0 rounded-xl h-10 px-5 font-semibold hover:opacity-90 shadow-md flex items-center"
              >
                <Sparkles className={cn("w-4.5 h-4.5 mr-2", matching && "animate-spin")} />
                {matching ? 'Matching skills...' : 'Find jobs matched to my skill'}
              </Button>
              {skillWarning && (
                <p className="text-red-500 text-xs font-semibold mt-1">
                  Please <Link href="/profile" className="underline font-bold hover:text-red-600 transition-colors">enter your skills</Link> in your profile first!
                </p>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="glass rounded-2xl p-2 mb-6 border border-border/60 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input 
                  value={queryInput} 
                  onChange={(e) => setQueryInput(e.target.value)} 
                  placeholder="Role, title, or company..." 
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 px-0 text-sm" 
                />
              </div>
              <div className="hidden sm:block w-px bg-border" />
              <div className="flex items-center gap-2 flex-1 px-3">
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* 1. Left Filtering Sidebar */}
            <aside className={cn(
              "lg:col-span-1 space-y-6",
              filtersCollapsed ? "lg:hidden" : "lg:block",
              mobileFilters ? "fixed inset-0 z-40 bg-background/95 backdrop-blur-md p-6 overflow-y-auto block" : "hidden"
            )}>
              <div className="flex items-center justify-between lg:hidden mb-4">
                <h3 className="font-bold">Filters</h3>
                <Button size="icon" variant="ghost" onClick={() => setMobileFilters(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Source Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Job Portal Source</h4>
                <div className="space-y-2.5">
                  {['linkedin', 'indeed', 'wellfound', 'internshala'].map(src => {
                    const count = sourceCounts[src] ?? 0;
                    return (
                      <div key={src} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            id={`src-${src}`}
                            checked={selectedSources.includes(src)}
                            onCheckedChange={() => toggleSource(src)}
                            className="rounded"
                          />
                          <Label htmlFor={`src-${src}`} className="text-sm font-medium cursor-pointer capitalize">
                            {getSourceDisplayName(src)}
                          </Label>
                        </div>
                        <span className="text-xs text-muted-foreground font-semibold bg-accent px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Job Type Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Job Type</h4>
                <div className="space-y-2.5">
                  {JOB_TYPES.map(type => (
                    <div key={type.value} className="flex items-center gap-2.5">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={selectedJobTypes.includes(type.value)}
                        onCheckedChange={() => toggleJobType(type.value)}
                        className="rounded"
                      />
                      <Label htmlFor={`type-${type.value}`} className="text-sm font-medium cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Experience Level Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Experience Level</h4>
                <div className="space-y-2.5">
                  {EXPERIENCE_LEVELS.map(lvl => (
                    <div key={lvl.value} className="flex items-center gap-2.5">
                      <Checkbox
                        id={`lvl-${lvl.value}`}
                        checked={selectedExpLevels.includes(lvl.value)}
                        onCheckedChange={() => toggleExpLevel(lvl.value)}
                        className="rounded"
                      />
                      <Label htmlFor={`lvl-${lvl.value}`} className="text-sm font-medium cursor-pointer">
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
                  <Label htmlFor="remote-toggle" className="text-sm font-bold cursor-pointer">Remote Only</Label>
                  <p className="text-[11px] text-muted-foreground">Show only work-from-home roles</p>
                </div>
                <Checkbox
                  id="remote-toggle"
                  checked={remoteOnly}
                  onCheckedChange={() => setRemoteOnly(prev => !prev)}
                  className="rounded"
                />
              </div>

              <Separator />

              {/* Salary Slider (0-50L) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Min Salary (INR)</h4>
                  <span className="text-xs font-bold text-primary">{salaryRange > 0 ? `₹${salaryRange}L+` : 'Any'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-semibold">
                  <span>₹0L</span>
                  <span>₹25L</span>
                  <span>₹50L</span>
                </div>
              </div>

              <Separator />

              {/* Date Posted */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Date Posted</h4>
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
                      <Label htmlFor={`date-${item.value}`} className="text-sm font-medium cursor-pointer">
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
                    <Label htmlFor="date-all" className="text-sm font-medium cursor-pointer">
                      Any Time
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Skills Search */}
              <div className="relative">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Filter by Skills</h4>
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {selectedSkills.map(skill => (
                    <Badge key={skill} variant="secondary" className="rounded-full pl-2 pr-1 py-0.5 gap-1 capitalize text-xs">
                      {skill}
                      <button onClick={() => removeSkill(skill)}>
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
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-accent hover:text-foreground flex justify-between items-center"
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
              <div className="flex items-center justify-between bg-card/40 backdrop-blur-md p-3 rounded-2xl border border-border/80 shadow-sm">
                
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
                      <Button variant="outline" size="sm" className="rounded-xl border-border h-9 font-medium gap-1 text-xs select-none hover:bg-accent">
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
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)
                ) : (skillWarning && jobs.length === 0) ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-card/10 border border-dashed border-red-500/30 rounded-3xl p-8 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/5 border border-red-500/15 flex items-center justify-center text-red-500 mb-2">
                      <AlertTriangle className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Please Enter Your Skills</h3>
                      <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                        To find relevant jobs matching your profile, please enter your skills or upload a resume.
                      </p>
                    </div>
                    <Link href="/profile">
                      <Button className="rounded-xl gradient-brand text-white border-0 shadow-md">
                        Go to Profile to Add Skills
                      </Button>
                    </Link>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-card/10 border border-dashed border-border/80 rounded-3xl p-8">
                    <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
                      <Activity className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2 text-base">No jobs found</h3>
                    <p className="text-muted-foreground text-xs mb-4">No aggregate jobs match your criteria. Try adjusting filters or clearing them.</p>
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

              <div className="flex justify-center gap-6 pt-2">
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
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">AI Skill Match Complete</h4>
              <p className="text-sm font-semibold text-foreground mt-0.5">{toastMessage}</p>
            </div>
            <button onClick={() => setShowSuccessToast(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
