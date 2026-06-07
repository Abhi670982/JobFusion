'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Briefcase, Calendar, ChevronRight, Clock, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import {
  fetchCurrentUser,
  fetchApplications,
  DbUser,
  DbApplication
} from '@/lib/api-helper';
import { cn } from '@/lib/utils';

const STATUS_TABS = ['All', 'Applied', 'Under Review', 'Interview', 'Offer', 'Rejected'];

const statusConfig = {
  'Applied': { label: 'Applied', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  'Under Review': { label: 'Under Review', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  'Interview': { label: 'Interviewing', color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
  'Offer': { label: 'Offer Received', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  'Rejected': { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' }
};

function ApplicationSkeleton() {
  return (
    <div className="card-premium p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-20 h-3" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="w-16 h-5 rounded-lg" />
        <Skeleton className="w-24 h-4" />
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DbUser | null>(null);
  const [applications, setApplications] = useState<DbApplication[]>([]);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const apps = await fetchApplications(currentUser._id);
          setApplications(apps);
        }
      } catch (err) {
        console.error("Error loading applications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredApps = applications.filter(app => {
    if (activeTab === 'All') return true;
    return app.status === activeTab;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 mobile-header-offset page-content">
        <Navbar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-[1400px] w-full mx-auto space-y-4 lg:space-y-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>My Applications</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {loading ? 'Retrieving applications...' : `Track your active applications across ${applications.length} positions`}
            </p>
          </div>

          {/* Status Tabs */}
          <div className="flex border-b border-border overflow-x-auto gap-2 pb-px scrollbar-none">
            {STATUS_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'text-sm px-4 py-2 border-b-2 font-medium whitespace-nowrap transition-all',
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <ApplicationSkeleton key={i} />)
            ) : filteredApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center card-premium p-6">
                <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
                  <Briefcase className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No applications found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeTab === 'All' ? 'You haven\'t applied to any jobs yet.' : `No applications found with status "${activeTab}".`}
                </p>
                <Link href="/jobs">
                  <Button className="rounded-xl gradient-brand text-white border-0">Browse Jobs</Button>
                </Link>
              </div>
            ) : (
              filteredApps.map((app, i) => {
                const job = app.jobId;
                if (!job) return null;
                const statusInfo = statusConfig[app.status] || { label: app.status, color: 'text-muted-foreground', bg: 'bg-muted' };

                return (
                  <motion.div
                    key={app._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card-premium p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: job.companyColor || '#6366f1' }}
                      >
                        {job.companyLogo || job.company.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{job.title}</h4>
                        <p className="text-xs text-muted-foreground">{job.company} · {job.location}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 justify-between sm:justify-end">
                      <Badge className={cn('rounded-full text-xs px-2.5 border', statusInfo.bg, statusInfo.color)}>
                        {statusInfo.label}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Applied on {formatDate(app.appliedAt)}</span>
                      </div>
                      <Link href={`/jobs/${job._id}`}>
                        <Button size="sm" variant="ghost" className="rounded-lg h-8 text-xs gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          View Job
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
