'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp, Briefcase, Bookmark, Eye, MessageSquare,
  Sparkles, ArrowRight, CheckCircle2, XCircle,
  Calendar, Star, ChevronRight, Zap, Code2, Smile
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { calculateCompletion } from '@/lib/profile-completion';
import {
  fetchDashboardData,
  fetchDashboardActivity,
  fetchDashboardNotifications,
  fetchDashboardMatches,
  DbUser,
  DbProfile
} from '@/lib/api-helper';

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
  updated_resume: { icon: Sparkles, color: '#8b5cf6', label: 'Resume Updated' },
  updated_profile: { icon: CheckCircle2, color: '#10b981', label: 'Profile Updated' },
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
  const [stats, setStats] = useState<any>({
    visitedCount: 0,
    skillsCount: 0,
    savedCount: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const dash = await fetchDashboardData();
        if (dash && dash.user) {
          setUser(dash.user);
          if (dash.profile && dash.profile.isOnboarded === false) {
            router.push('/onboarding');
            return;
          }
          setProfile(dash.profile);
          setStats(dash.stats);
          setUnreadCount(dash.unreadNotificationsCount || 0);

          // Load other sub-widgets concurrently
          const [actRes, notifRes, matchRes] = await Promise.all([
            fetchDashboardActivity(),
            fetchDashboardNotifications(),
            fetchDashboardMatches()
          ]);

          if (actRes) {
            setActivities(actRes.recentActivities || []);
            setChartData(actRes.chartData || []);
          }
          if (notifRes) {
            setNotifs(notifRes);
          }
          if (matchRes) {
            setMatchesCount(matchRes.totalMatches || 0);
          }
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

  return (
    <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-[1400px] w-full mx-auto space-y-4 lg:space-y-6">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Welcome back, {loading ? <Skeleton className="w-24 h-6 inline-block animate-pulse" /> : (user?.fullName.split(' ')[0] || 'User')}{" "}
                <Smile className="w-5.5 h-5.5 inline-block text-amber-500 animate-pulse" />
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                You have <strong className="text-foreground">{loading ? '...' : (matchesCount > 0 ? `${matchesCount} new job matches` : 'no job matches yet')}</strong> and <strong className="text-foreground">{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}</strong> today.
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <div className="block">
                  <StatCard icon={Eye} label="Visited Openings" value={stats.visitedCount} color="#6366f1" />
                </div>
                <Link href="/profile" className="block cursor-pointer">
                  <StatCard icon={Code2} label="Skills" value={stats.skillsCount} color="#10b981" />
                </Link>
                <Link href="/jobs/saved" className="block cursor-pointer">
                  <StatCard icon={Bookmark} label="Saved Jobs" value={stats.savedCount} color="#8b5cf6" />
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Activity Chart */}
            <div className="lg:col-span-2 card-premium p-4 lg:p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold">Visited Openings</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Unique job openings visited this week</p>
                </div>
                <Badge variant="secondary" className="rounded-lg text-xs">Last 7 days</Badge>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVisited" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="visited" stroke="#6366f1" fill="url(#colorVisited)" strokeWidth={2} name="Visited Openings" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Resume Intelligence Widget */}
            <div className="card-premium p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Resume Intelligence</h3>
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
                      <p className="text-[11px] text-muted-foreground mt-0.5">Upload your resume to detect your domain, extract skills, and get career role suggestions.</p>
                    </div>
                    <Link href="/resume" className="inline-block">
                      <Button size="sm" className="rounded-xl text-[11px] h-8 gradient-brand border-0 text-white">Upload Resume</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Category */}
                    {profile.resumeCategory && (
                      <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Detected Domain</p>
                        <p className="text-sm font-bold text-primary">{profile.resumeCategory}</p>
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-muted/40 text-center">
                        <div className="text-xl font-extrabold">{profile.skills?.length || 0}</div>
                        <div className="text-muted-foreground">Skills Found</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/40 text-center">
                        <div className="text-xl font-extrabold">
                          {profile.lastAnalyzedAt ? new Date(profile.lastAnalyzedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </div>
                        <div className="text-muted-foreground">Last Analyzed</div>
                      </div>
                    </div>

                    {/* Suggested Roles */}
                    {profile.suggestedRoles && profile.suggestedRoles.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Suggested Roles</p>
                        <div className="flex flex-wrap gap-1">
                          {profile.suggestedRoles.slice(0, 3).map(role => (
                            <Badge key={role} variant="secondary" className="rounded-full text-[10px] px-2 py-0.5">{role}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Uploaded at */}
                    <div className="flex justify-between items-center text-xs text-muted-foreground py-0.5">
                      <span>Uploaded</span>
                      <span className="font-medium text-foreground">
                        {profile.resumeUpdatedAt ? new Date(profile.resumeUpdatedAt).toLocaleDateString('en-IN') : 'N/A'}
                      </span>
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
                ) : activities.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No recent activity found.
                  </div>
                ) : (
                  activities.slice(0, 5).map((act) => {
                    const config = activityConfig[act.type as keyof typeof activityConfig] || { icon: Sparkles, color: '#6366f1', label: 'Activity' };
                    const Icon = config.icon;
                    const titleText = act.jobTitle || act.details || config.label;
                    const subText = act.company || (act.jobTitle ? '' : 'JobFusion');
                    
                    return (
                      <div key={act._id || act.id} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${config.color}15` }}>
                          <Icon className="w-4 h-4" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{titleText}</p>
                          {subText && <p className="text-xs text-muted-foreground">{subText}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {act.type === 'applied' && (
                            <Badge variant="secondary" className="text-[10px] rounded-lg mb-0.5">Applied</Badge>
                          )}
                          {act.type === 'interview' && (
                            <Badge variant="secondary" className="text-[10px] rounded-lg mb-0.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Interview</Badge>
                          )}
                          {act.type === 'offer' && (
                            <Badge variant="secondary" className="text-[10px] rounded-lg mb-0.5 bg-amber-500/10 text-amber-500 border-amber-500/20">Offer</Badge>
                          )}
                          <p className="text-[11px] text-muted-foreground">{formatTime(act.createdAt)}</p>
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
                  {unreadCount > 0 && (
                    <Badge className="h-5 px-1.5 text-[10px] gradient-brand text-white border-0">{unreadCount} new</Badge>
                  )}
                </div>
                <Link href="/notifications" className="text-xs text-primary hover:underline flex items-center gap-1">
                  See all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-2 h-2 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3.5 w-1/3 animate-pulse" />
                        <Skeleton className="h-3 w-2/3 animate-pulse" />
                      </div>
                    </div>
                  ))
                ) : notifs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No new notifications.
                  </div>
                ) : (
                  notifs.slice(0, 5).map((notif) => (
                    <div key={notif._id || notif.id} className={cn('flex items-start gap-3 p-2.5 rounded-xl transition-colors', !notif.read && 'bg-primary/5 border border-primary/10')}>
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', !notif.read ? 'bg-primary' : 'bg-transparent')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{formatTime(notif.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
    </main>
  );

}
