'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, MapPin,
  Briefcase, LayoutGrid, List, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import JobCard from '@/components/job-card';
import { cn } from '@/lib/utils';
import {
  fetchCurrentUser,
  fetchJobs,
  fetchSavedJobs,
  DbUser,
  DbJob,
  DbSavedJob
} from '@/lib/api-helper';

const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior', 'Lead / Principal', 'Executive'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const LOCATION_TYPES = ['Remote', 'Hybrid', 'On-site'];
const SALARY_RANGES = ['Under ₹10L', '₹10L – ₹20L', '₹20L – ₹35L', '₹35L – ₹50L', '₹50L+'];

// Map labels to MongoDB enum values
const EXP_LEVEL_MAP: Record<string, string> = {
  'Entry Level': 'entry',
  'Mid Level': 'mid',
  'Senior': 'senior',
  'Lead / Principal': 'lead',
  'Executive': 'executive'
};

const JOB_TYPE_MAP: Record<string, string> = {
  'Full-time': 'full-time',
  'Part-time': 'part-time',
  'Contract': 'contract',
  'Internship': 'internship'
};

const LOC_TYPE_MAP: Record<string, string> = {
  'Remote': 'remote',
  'Hybrid': 'hybrid',
  'On-site': 'onsite'
};

function FilterSection({ title, items, checked, onChange }: {
  title: string; items: string[]; checked: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2.5">
            <Checkbox
              id={item}
              checked={checked.includes(item)}
              onCheckedChange={() => onChange(item)}
              className="rounded"
            />
            <Label htmlFor={item} className="text-sm font-normal cursor-pointer">{item}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}

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

export default function JobsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DbUser | null>(null);
  const [allJobs, setAllJobs] = useState<DbJob[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [mobileFilters, setMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({ experience: [] as string[], type: [] as string[], location: [] as string[], salary: [] as string[] });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await fetchCurrentUser();
        const jobs = await fetchJobs();
        setAllJobs(jobs);

        if (currentUser) {
          setUser(currentUser);
          const saved = await fetchSavedJobs(currentUser._id);
          setSavedJobIds(new Set(saved.map((s: DbSavedJob) => s.jobId?._id).filter(Boolean)));
        }
      } catch (err) {
        console.error("Error loading jobs data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const arr = prev[category];
      const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
      return { ...prev, [category]: next };
    });
    setActiveFilters(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const clearAll = () => {
    setFilters({ experience: [], type: [], location: [], salary: [] });
    setActiveFilters([]);
    setQuery('');
    setLocation('');
  };

  const handleSavedToggle = (jobId: string, nowSaved: boolean) => {
    setSavedJobIds(prev => {
      const next = new Set(prev);
      if (nowSaved) {
        next.add(jobId);
      } else {
        next.delete(jobId);
      }
      return next;
    });
  };

  // Perform filtering client-side
  const filteredJobs = allJobs.filter(job => {
    // Search query matches title or company or skills
    if (query) {
      const q = query.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchCompany = job.company.toLowerCase().includes(q);
      const matchSkills = job.skills.some(s => s.toLowerCase().includes(q));
      if (!matchTitle && !matchCompany && !matchSkills) return false;
    }

    // Location matches location text
    if (location) {
      const loc = location.toLowerCase();
      if (!job.location.toLowerCase().includes(loc)) return false;
    }

    // Filter by Experience Level
    if (filters.experience.length > 0) {
      const mapped = filters.experience.map(f => EXP_LEVEL_MAP[f]);
      if (!mapped.includes(job.experienceLevel)) return false;
    }

    // Filter by Job Type
    if (filters.type.length > 0) {
      const mapped = filters.type.map(f => JOB_TYPE_MAP[f]);
      if (!mapped.includes(job.type)) return false;
    }

    // Filter by Work Type (Location Type)
    if (filters.location.length > 0) {
      const mapped = filters.location.map(f => LOC_TYPE_MAP[f]);
      if (!mapped.includes(job.locationType)) return false;
    }

    // Filter by Salary Range
    if (filters.salary.length > 0) {
      const matchedSalary = filters.salary.some(f => {
        const min = job.salaryMin || 0;
        if (f === 'Under ₹10L') return min < 1000000;
        if (f === '₹10L – ₹20L') return min >= 1000000 && min < 2000000;
        if (f === '₹20L – ₹35L') return min >= 2000000 && min < 3500000;
        if (f === '₹35L – ₹50L') return min >= 3500000 && min < 5000000;
        if (f === '₹50L+') return min >= 5000000;
        return false;
      });
      if (!matchedSalary) return false;
    }

    return true;
  });

  const FilterPanel = () => (
    <div className="space-y-6">
      <FilterSection title="Experience Level" items={EXPERIENCE_LEVELS} checked={filters.experience} onChange={(v) => toggleFilter('experience', v)} />
      <Separator />
      <FilterSection title="Job Type" items={JOB_TYPES} checked={filters.type} onChange={(v) => toggleFilter('type', v)} />
      <Separator />
      <FilterSection title="Work Type" items={LOCATION_TYPES} checked={filters.location} onChange={(v) => toggleFilter('location', v)} />
      <Separator />
      <FilterSection title="Salary Range" items={SALARY_RANGES} checked={filters.salary} onChange={(v) => toggleFilter('salary', v)} />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 mobile-header-offset page-content">
        <Navbar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          {/* Search Header */}
          <div className="mb-4 lg:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Find Your Next Role</h1>
            <p className="text-muted-foreground text-sm">
              {loading ? 'Searching opportunities...' : `Showing ${filteredJobs.length} AI-matched opportunities`}
            </p>
          </div>

          {/* Search Bar */}
          <div className="glass rounded-2xl p-2 mb-4 border border-border/60 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title, company, or keyword..." className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 px-0 text-sm" />
              </div>
              <div className="hidden sm:block w-px bg-border" />
              <div className="flex items-center gap-2 flex-1 px-3">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location or Remote..." className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 px-0 text-sm" />
              </div>
              <Button className="gradient-brand text-white border-0 rounded-xl h-10 px-5 font-medium hover:opacity-90">
                <Sparkles className="w-4 h-4 mr-1.5" />
                AI Search
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.map(f => (
                <Badge key={f} variant="secondary" className="rounded-full px-3 py-1 gap-1.5">
                  {f}
                  <button onClick={() => {
                    setActiveFilters(prev => prev.filter(v => v !== f));
                    Object.keys(filters).forEach(cat => {
                      setFilters(prev => ({ ...prev, [cat]: (prev[cat as keyof typeof filters] as string[]).filter((v: string) => v !== f) }));
                    });
                  }}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
            </div>
          )}

          <div className="flex gap-6">
            {/* Desktop Sidebar Filter */}
            <div className="hidden lg:block w-60 flex-shrink-0">
              <div className="card-premium p-5 sticky top-24">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                  </h3>
                  {activeFilters.length > 0 && (
                    <button onClick={clearAll} className="text-xs text-primary">Clear all</button>
                  )}
                </div>
                <FilterPanel />
              </div>
            </div>

            {/* Job Results */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{loading ? 0 : filteredJobs.length}</strong> jobs found
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className={cn('rounded-xl', viewMode === 'grid' && 'bg-accent')} onClick={() => setViewMode('grid')}>
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className={cn('rounded-xl', viewMode === 'list' && 'bg-accent')} onClick={() => setViewMode('list')}>
                    <List className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl lg:hidden" onClick={() => setMobileFilters(true)}>
                    <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                    Filters
                    {activeFilters.length > 0 && <Badge className="ml-1.5 h-4 px-1 text-[10px] gradient-brand text-white border-0">{activeFilters.length}</Badge>}
                  </Button>
                </div>
              </div>

              <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)
                ) : filteredJobs.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">No jobs found</h3>
                    <p className="text-muted-foreground text-sm mb-4">Try adjusting your search or clearing filters</p>
                    <Button onClick={clearAll} variant="outline" className="rounded-xl">Clear Filters</Button>
                  </div>
                ) : (
                  filteredJobs.map((job, i) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      index={i}
                      userId={user?._id}
                      initialIsSaved={savedJobIds.has(job._id)}
                      onSavedToggle={handleSavedToggle}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
