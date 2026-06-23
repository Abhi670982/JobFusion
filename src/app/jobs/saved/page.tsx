'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Search, ArrowLeft, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import JobCard from '@/components/job-card';
import Link from 'next/link';
import {
  fetchCurrentUser,
  fetchSavedJobs,
  fetchApplications,
  DbUser,
  DbSavedJob,
  DbApplication
} from '@/lib/api-helper';

function JobCardSkeleton() {
  return (
    <div className="card-premium p-5 flex flex-col justify-between h-56 skeleton-shimmer">
      <div className="flex gap-3">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="w-2/3 h-5" />
          <Skeleton className="w-1/3 h-4" />
        </div>
      </div>
      <div className="flex gap-2 my-3">
        <Skeleton className="w-16 h-5 rounded-lg" />
        <Skeleton className="w-16 h-5 rounded-lg" />
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-16 h-7 rounded-lg" />
      </div>
    </div>
  );
}

export default function SavedJobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DbUser | null>(null);
  const [savedJobs, setSavedJobs] = useState<DbSavedJob[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const saved = await fetchSavedJobs(currentUser._id);
          setSavedJobs(saved);
          
          const apps = await fetchApplications(currentUser._id);
          setAppliedJobIds(new Set(apps.map((a: DbApplication) => a.jobId?._id).filter(Boolean)));
        }
      } catch (err) {
        console.error("Error loading saved jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSavedToggle = (jobId: string, nowSaved: boolean) => {
    // If a job is unsaved, filter it out from the saved list dynamically
    if (!nowSaved) {
      setSavedJobs(prev => prev.filter(s => s.jobId?._id !== jobId));
    }
  };

  return (
    <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-[1400px] w-full mx-auto space-y-5">
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

      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Saved Jobs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading ? 'Retrieving bookmarks...' : `You have ${savedJobs.length} bookmarked opportunities`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <JobCardSkeleton key={i} />)
        ) : savedJobs.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-card/10 border border-dashed border-border/80 rounded-3xl p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-2">
              <Bookmark className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base">No saved jobs yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">Explore our job listings and save jobs you are interested in.</p>
            </div>
            <Link href="/jobs">
              <Button className="rounded-xl gradient-brand text-white border-0 shadow-md glow-sm btn-press">
                Find Jobs
              </Button>
            </Link>
          </div>
        ) : (
          savedJobs.map((savedJob, i) => {
            const job = savedJob.jobId;
            if (!job) return null;
            return (
              <JobCard
                key={savedJob._id}
                job={job}
                index={i}
                userId={user?._id}
                initialIsSaved={true}
                initialIsApplied={appliedJobIds.has(job._id)}
                onSavedToggle={handleSavedToggle}
              />
            );
          })
        )}
      </div>
    </main>
  );
}
