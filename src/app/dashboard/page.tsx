'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp, Briefcase, Bookmark, Eye, MessageSquare,
  Sparkles, ArrowRight, CheckCircle2, XCircle,
  Calendar, Star, ChevronRight, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { notifications } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { calculateCompletion } from '@/lib/profile-completion';
import {
  fetchCurrentUser,
  fetchProfile,
  fetchApplications,
  fetchSavedJobs,
  DbUser,
  DbProfile,
  DbApplication,
  DbSavedJob
} from '@/lib/api-helper';

const activityChartData = [
  { day: 'Mon', applications: 3, views: 12 },
  { day: 'Tue', applications: 5, views: 18 },
  { day: 'Wed', applications: 2, views: 8 },
  { day: 'Thu', applications: 7, views: 25 },
  { day: 'Fri', applications: 4, views: 15 },
  { day: 'Sat', applications: 1, views: 5 },
  { day: 'Sun', applications: 2, views: 10 },
];

const matchDistData = [
  { range: '90-100%', count: 8, color: '#10b981' },
  { range: '75-90%', count: 22, color: '#6366f1' },
  { range: '60-75%', count: 35, color: '#8b5cf6' },
  { range: '<60%', count: 15, color: '#94a3b8' },
];

function StatCard({ icon: Icon, label, value, change, color }: {
  icon: React.ElementType; label: string; value: string | number; change?: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-5 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {change && (
          <span className="text-xs text-emerald-500 font-medium flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tabular-nums mb-1">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="card-premium p-5 flex flex-col justify-between h-32">
      <div className="flex justify-between items-center">
        <Skeleton className="w-10 h-10 rounded-xl animate-pulse" />
        <Skeleton className="w-12 h-4 animate-pulse" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-16 h-8 animate-pulse" />
        <Skeleton className="w-24 h-4 animate-pulse" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0 animate-pulse" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-2/3 h-4 animate-pulse" />
        <Skeleton className="w-1/3 h-3 animate-pulse" />
      </div>
      <Skeleton className="w-16 h-4 animate-pulse" />
    </div>
  );
}

const activityConfig = {
  applied: { icon: Briefcase, color: '#6366f1', label: 'Applied' },
  interview: { icon: Calendar, color: '#10b981', label: 'Interview' },
  saved: { icon: Bookmark, color: '#8b5cf6', label: 'Saved' },
  viewed: { icon: Eye, color: '#94a3b8', label: 'Viewed' },
  offer: { icon: Star, color: '#f59e0b', label: 'Offer' },
  rejected: { icon: XCircle, color: '#ef4444', label: 'Rejected' },
};

function formatTime(dateStr?: string) {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DbUser | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [applications, setApplications] = useState<DbApplication[]>([]);
  const [savedJobs, setSavedJobs] = useState<DbSavedJob[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const [prof, apps, saved] = await Promise.all([
            fetchProfile(currentUser._id),
            fetchApplications(currentUser._id),
            fetchSavedJobs(currentUser._id)
          ]);
          
          if (prof && prof.isOnboarded === false) {
            router.push('/onboarding');
            return;
          }

          setProfile(prof);
          setApplications(apps);
          setSavedJobs(saved);
        } else {
          router.push('/sign-in');
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  // Compute stats
  const appliedCount = applications.length;
  const interviewCount = applications.filter(a => a.status === 'Interview').length;
  const offerCount = applications.filter(a => a.status === 'Offer').length;
  const savedCount = savedJobs.length;

  const matchScore = profile?.skills && profile.skills.length > 0 ? 94 : 80;

  // Build merged activity list
  const mergedActivities = [
    ...applications.map(app => ({
      id: app._id,
      type: app.status === 'Interview' ? 'interview' as const : app.status === 'Offer' ? 'offer' as const : app.status === 'Rejected' ? 'rejected' as const : 'applied' as const,
      jobTitle: app.jobId?.title || 'Unknown Position',
      company: app.jobId?.company || 'Unknown Company',
      time: formatTime(app.appliedAt),
      timeMs: new Date(app.appliedAt).getTime(),
      status: app.status
    })),
    ...savedJobs.map(saved => ({
      id: saved._id,
      type: 'saved' as const,
      jobTitle: saved.jobId?.title || 'Unknown Position',
      company: saved.jobId?.company || 'Unknown Company',
      time: formatTime(saved.savedAt),
      timeMs: new Date(saved.savedAt).getTime(),
      status: 'Saved'
    }))
  ].sort((a, b) => b.timeMs - a.timeMs);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 mobile-header-offset page-content">
        <Navbar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-[1400px] w-full mx-auto space-y-4 lg:space-y-6">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Welcome back, {loading ? <Skeleton className="w-24 h-6 inline-block animate-pulse" /> : (user?.fullName.split(' ')[0] || 'User')} 👋
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                You have <strong className="text-foreground">{loading ? '...' : (profile?.skills?.length ? '12 new job matches' : 'no job matches yet')}</strong> and <strong className="text-foreground">3 unread messages</strong> today.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/jobs">
                <Button size="sm" className="rounded-xl gradient-brand text-white border-0 hover:opacity-90">
                  <Briefcase className="w-4 h-4 mr-1.5" />
                  Browse Jobs
                </Button>
              </Link>
              <Link href="/profile">
                <Button size="sm" variant="outline" className="rounded-xl">
                  Complete Profile
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Profile Completion & Match Score Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl gradient-brand p-5 text-white relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold">{loading ? '...' : calculateCompletion(profile, user)}</span>
                  <span className="text-[10px] text-white/70">% Done</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-white/80" />
                    <span className="font-semibold">Profile Completion Status</span>
                    {calculateCompletion(profile, user) === 100 ? (
                      <Badge className="border-white/30 bg-emerald-500/30 text-white text-[10px]">Complete</Badge>
                    ) : (
                      <Badge className="border-white/30 bg-white/20 text-white text-[10px]">In Progress</Badge>
                    )}
                  </div>
                  <p className="text-white/70 text-sm">
                    {calculateCompletion(profile, user) === 100 
                      ? 'Congratulations! Your profile is 100% complete. You are ready for top matches!' 
                      : 'Complete your profile details to stand out to recruiters and get matched with relevant jobs.'}
                  </p>
                  <div className="mt-2 w-full max-w-[16rem] bg-white/20 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-white transition-all duration-500" style={{ width: `${loading ? 0 : calculateCompletion(profile, user)}%` }} />
                  </div>
                </div>
              </div>
              <Link href="/profile">
                <Button size="sm" className="bg-white text-primary hover:bg-white/90 rounded-xl font-semibold">
                  Complete Profile
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Empty State Banner for New/Incomplete Profiles */}
          {!loading && !profile?.resumeUrl && (!profile?.skills || profile.skills.length === 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-premium p-6 border-dashed border-2 border-primary/30 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  <h3 className="font-bold text-lg">Complete your profile to get better job recommendations</h3>
                </div>
                <p className="text-sm text-muted-foreground max-w-xl">
                  JobFusion uses AI to match you with opportunities. Without a resume or skills, we cannot match you with your ideal roles.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 justify-center">
                <Link href="/resume">
                  <Button size="sm" className="rounded-xl gradient-brand text-white border-0 shadow-md">
                    Upload Resume
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button size="sm" variant="secondary" className="rounded-xl">
                    Add Skills
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button size="sm" variant="outline" className="rounded-xl">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <Link href="/applications" className="block cursor-pointer">
                  <StatCard icon={Briefcase} label="Applications Sent" value={appliedCount} change="+2 this week" color="#6366f1" />
                </Link>
                <Link href="/applications" className="block cursor-pointer">
                  <StatCard icon={Calendar} label="Interviews" value={interviewCount} change="scheduled" color="#10b981" />
                </Link>
                <Link href="/applications" className="block cursor-pointer">
                  <StatCard icon={Star} label="Offers Received" value={offerCount} color="#f59e0b" />
                </Link>
                <Link href="/jobs/saved" className="block cursor-pointer">
                  <StatCard icon={Bookmark} label="Saved Jobs" value={savedCount} color="#8b5cf6" />
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Activity Chart */}
            <div className="lg:col-span-2 card-premium p-4 lg:p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold">Activity Overview</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Applications & profile views this week</p>
                </div>
                <Badge variant="secondary" className="rounded-lg text-xs">Last 7 days</Badge>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={activityChartData}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="views" stroke="#8b5cf6" fill="url(#colorViews)" strokeWidth={2} name="Views" />
                  <Area type="monotone" dataKey="applications" stroke="#6366f1" fill="url(#colorApps)" strokeWidth={2} name="Applications" />
                </AreaChart>
              </ResponsiveContainer>
            </div>            {/* Resume Analytics Insight */}
            <div className="card-premium p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Resume Analytics</h3>
                  <Link href="/resume" className="text-xs text-primary hover:underline flex items-center gap-1">
                    Manage <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : !profile?.resumeUrl ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-500">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">No Resume Uploaded</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Upload a resume to automatically extract skills and analyze your ATS performance.</p>
                    </div>
                    <Link href="/resume" className="inline-block">
                      <Button size="sm" className="rounded-xl text-[11px] h-8 gradient-brand border-0 text-white">Upload Resume</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Dynamic ATS Score & Strength Row */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                      <div className="text-left">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">ATS Score</span>
                        <div className="text-xl font-extrabold text-foreground">{profile.atsScore || 0}/100</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Strength</span>
                        <div>
                          <Badge className={cn(
                            "text-[10px] border-0 rounded-full font-bold",
                            (profile.atsScore || 0) >= 80 
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
                              : (profile.atsScore || 0) >= 60 
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" 
                                : "bg-red-500/15 text-red-600 dark:text-red-400"
                          )}>
                            {(profile.atsScore || 0) >= 80 ? "Excellent" : (profile.atsScore || 0) >= 60 ? "Good" : "Needs Work"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-muted/40">
                        <div className="text-muted-foreground">Uploaded Date</div>
                        <div className="font-semibold mt-0.5 text-foreground truncate">
                          {profile.resumeUpdatedAt ? new Date(profile.resumeUpdatedAt).toLocaleDateString('en-IN') : 'N/A'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/40">
                        <div className="text-muted-foreground">Last Analyzed</div>
                        <div className="font-semibold mt-0.5 text-foreground truncate">
                          {profile.lastAnalyzedAt ? new Date(profile.lastAnalyzedAt).toLocaleDateString('en-IN') : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Skill Count */}
                    <div className="flex justify-between items-center text-xs py-0.5">
                      <span className="text-muted-foreground">Skills Extracted</span>
                      <Badge variant="secondary" className="rounded-lg font-semibold">{profile.skills?.length || 0} Skills</Badge>
                    </div>

                    {/* Mini ATS History Chart */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">ATS Score History</p>
                      <div className="h-16 w-full bg-muted/20 border border-border/50 rounded-xl overflow-hidden pt-2 px-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart 
                            data={
                              profile.atsHistory && profile.atsHistory.length > 0
                                ? profile.atsHistory.map((h, i) => ({ name: `Run ${i+1}`, score: h.score }))
                                : [{ name: 'Current', score: profile.atsScore || 0 }]
                            }
                          >
                            <defs>
                              <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: 10, padding: '4px 8px' }} />
                            <Area type="monotone" dataKey="score" stroke="#6366f1" fill="url(#colorHistory)" strokeWidth={2} name="Score" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Recent Activity */}
            <div className="card-premium p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Activity</h3>
                <Link href="/applications" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <ActivitySkeleton key={i} />)
                ) : mergedActivities.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No recent activity found.
                  </div>
                ) : (
                  mergedActivities.slice(0, 5).map((act) => {
                    const config = activityConfig[act.type];
                    const Icon = config.icon;
                    return (
                      <div key={act.id} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${config.color}15` }}>
                          <Icon className="w-4 h-4" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{act.jobTitle}</p>
                          <p className="text-xs text-muted-foreground">{act.company}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {act.status && (
                            <Badge variant="secondary" className="text-[10px] rounded-lg mb-0.5">{act.status}</Badge>
                          )}
                          <p className="text-[11px] text-muted-foreground">{act.time}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Notifications Panel */}
            <div className="card-premium p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Notifications</h3>
                  <Badge className="h-5 px-1.5 text-[10px] gradient-brand text-white border-0">3 new</Badge>
                </div>
                <Link href="/notifications" className="text-xs text-primary hover:underline flex items-center gap-1">
                  See all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notif) => (
                  <div key={notif.id} className={cn('flex items-start gap-3 p-2.5 rounded-xl transition-colors', !notif.read && 'bg-primary/5 border border-primary/10')}>
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', !notif.read ? 'bg-primary' : 'bg-transparent')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
