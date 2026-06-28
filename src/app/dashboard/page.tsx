'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp, Briefcase, Bookmark, Eye, MessageSquare,
  Sparkles, ArrowRight, CheckCircle2, XCircle,
  Calendar, Star, ChevronRight, Zap, Code2, Smile, Bell
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
  fetchDashboardData, fetchDashboardActivity, fetchDashboardNotifications,
  fetchDashboardMatches, DbUser, DbProfile
} from '@/lib/api-helper';

function StatCard({ icon: Icon, label, value, change, color, href }: {
  icon: React.ElementType; label: string; value: string | number;
  change?: string; color: string; href?: string;
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        'card-premium p-5 group relative overflow-hidden',
        href && 'cursor-pointer card-hover'
      )}
    >
      {/* Subtle bg glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ background: `radial-gradient(ellipse at top left, ${color}08, transparent 70%)` }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
            style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          {change && (
            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              {change}
            </span>
          )}
        </div>
        <div className="text-2xl font-extrabold tabular-nums mb-0.5">{value}</div>
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
      </div>
    </motion.div>
  );
  return href ? <Link href={href} className="block">{content}</Link> : content;
}

function StatCardSkeleton() {
  return (
    <div className="card-premium p-5 h-32 flex flex-col justify-between">
      <div className="flex justify-between">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-14 h-5 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-16 h-7 rounded-lg" />
        <Skeleton className="w-24 h-3.5 rounded" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="w-2/3 h-4 rounded" />
        <Skeleton className="w-1/3 h-3 rounded" />
      </div>
      <Skeleton className="w-16 h-4 rounded" />
    </div>
  );
}

const activityConfig = {
  applied:         { icon: Briefcase,    color: '#6366f1', label: 'Applied' },
  interview:       { icon: Calendar,     color: '#10b981', label: 'Interview' },
  saved:           { icon: Bookmark,     color: '#8b5cf6', label: 'Saved' },
  viewed:          { icon: Eye,          color: '#64748b', label: 'Viewed' },
  offer:           { icon: Star,         color: '#f59e0b', label: 'Offer' },
  rejected:        { icon: XCircle,      color: '#ef4444', label: 'Rejected' },
  updated_resume:  { icon: Sparkles,     color: '#8b5cf6', label: 'Resume Updated' },
  updated_profile: { icon: CheckCircle2, color: '#10b981', label: 'Profile Updated' },
};

function formatTime(dateStr?: string) {
  if (!dateStr) return 'Recently';
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DbUser | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [stats, setStats] = useState<any>({ visitedCount: 0, skillsCount: 0, savedCount: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const dash = await fetchDashboardData();
        if (dash?.user) {
          setUser(dash.user);
          if (dash.profile?.isOnboarded === false) { router.push('/onboarding'); return; }
          setProfile(dash.profile);
          setStats(dash.stats);
          setUnreadCount(dash.unreadNotificationsCount || 0);

          const [actRes, notifRes, matchRes] = await Promise.all([
            fetchDashboardActivity(), fetchDashboardNotifications(), fetchDashboardMatches()
          ]);
          if (actRes) { setActivities(actRes.recentActivities || []); setChartData(actRes.chartData || []); }
          if (notifRes) setNotifs(notifRes);
          if (matchRes) setMatchesCount(matchRes.totalMatches || 0);
        } else {
          router.push('/sign-in');
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const completion = calculateCompletion(profile, user);
  const firstName = user?.fullName.split(' ')[0] || 'User';

  return (
    <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-[1440px] w-full mx-auto space-y-5">

      {/* ── Welcome Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {loading
              ? <><span>Welcome back,</span><Skeleton className="w-24 h-6 inline-block" /></>
              : <><span>Welcome back, {firstName}</span><Smile className="w-5 h-5 text-amber-400" /></>
            }
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? '...' : (
              <>
                <span className="font-semibold text-foreground">{matchesCount > 0 ? `${matchesCount} job matches` : 'No matches yet'}</span>
                {' · '}
                <span className="font-semibold text-foreground">{unreadCount} notification{unreadCount !== 1 ? 's' : ''}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs">
            <Button size="sm" className="rounded-xl gradient-brand text-white border-0 hover:opacity-90 shadow-sm font-medium">
              <Briefcase className="w-3.5 h-3.5 mr-1.5" />
              Browse Jobs
            </Button>
          </Link>
          <Link href="/resume">
            <Button size="sm" variant="outline" className="rounded-xl border-border hover:border-primary/30">
              Manage Resume
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ── Profile Completion Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="relative rounded-2xl overflow-hidden gradient-brand p-5 text-white"
      >
        <div className="absolute right-0 top-0 w-56 h-56 rounded-full opacity-10 blur-2xl" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 blur-2xl" style={{ background: 'white', transform: 'translate(-20%, 20%)' }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Circular progress indicator */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r="27" fill="none" stroke="white" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 27}`}
                  strokeDashoffset={`${2 * Math.PI * 27 * (1 - (loading ? 0 : completion) / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-extrabold leading-none">{loading ? '...' : completion}%</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-white/80" />
                <span className="font-bold text-sm">Profile Completion</span>
                {completion === 100 ? (
                  <Badge className="border-white/30 bg-emerald-500/40 text-white text-[10px] rounded-full px-2">Complete</Badge>
                ) : (
                  <Badge className="border-white/30 bg-white/20 text-white text-[10px] rounded-full px-2">In Progress</Badge>
                )}
              </div>
              <p className="text-white/70 text-xs max-w-sm leading-relaxed">
                {completion === 100
                  ? 'Your profile is complete. You are positioned for top job matches!'
                  : 'Complete your profile to get better AI-matched job recommendations.'}
              </p>
            </div>
          </div>
          <Link href="/resume">
            <Button size="sm" className="bg-white text-primary hover:bg-white/90 rounded-xl font-bold shadow-lg whitespace-nowrap">
              Manage Resume <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ── Empty State ── */}
      {!loading && !profile?.resumeUrl && (!profile?.skills || profile.skills.length === 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-premium p-6 border-dashed border-2 border-primary/25 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Complete your profile for better job recommendations</h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              JobFusion uses AI to match you with opportunities. Upload a resume or add skills to get started.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/resume"><Button size="sm" className="rounded-xl gradient-brand text-white border-0 shadow-sm">Upload Resume</Button></Link>
            <Link href="/resume"><Button size="sm" variant="outline" className="rounded-xl">Add Skills</Button></Link>
          </div>
        </motion.div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={Eye} label="Visited Openings" value={stats.visitedCount} color="#6366f1" />
            <StatCard icon={Code2} label="Skills in Profile" value={stats.skillsCount} color="#10b981" href="/resume" />
            <StatCard icon={Bookmark} label="Saved Jobs" value={stats.savedCount} color="#8b5cf6" href="/jobs/saved" />
          </>
        )}
      </div>

      {/* ── Activity Chart + Resume Intel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 card-premium p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-sm">Job View Activity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Unique openings visited this week</p>
            </div>
            <Badge variant="secondary" className="rounded-lg text-xs">Last 7 days</Badge>
          </div>
          {loading ? (
            <Skeleton className="w-full h-48 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVisited" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.53 0.24 258)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="oklch(0.53 0.24 258)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)' }}
                />
                <Area type="monotone" dataKey="visited" stroke="oklch(0.53 0.24 258)" fill="url(#colorVisited)" strokeWidth={2.5} dot={false} name="Visited" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resume Intel */}
        <div className="card-premium p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Resume Intelligence</h3>
            <Link href="/resume" className="text-xs text-primary hover:underline flex items-center gap-1 touch-auto">
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 flex-1">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : !profile?.resumeUrl ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold mb-0.5">No Resume Uploaded</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px]">Upload to detect your domain, extract skills, and get role suggestions.</p>
              </div>
              <Link href="/resume">
                <Button size="sm" className="rounded-xl gradient-brand border-0 text-white text-xs h-8">Upload Resume</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5 flex-1">
              {profile.resumeCategory && (
                <div className="p-3 rounded-xl bg-primary/6 border border-primary/12">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 font-semibold">Detected Domain</p>
                  <p className="text-sm font-bold text-primary">{profile.resumeCategory}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-muted/50 text-center">
                  <div className="text-xl font-extrabold">{profile.skills?.length || 0}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Skills</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 text-center">
                  <div className="text-sm font-extrabold">
                    {profile.lastAnalyzedAt ? new Date(profile.lastAnalyzedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Analyzed</div>
                </div>
              </div>
              {(profile.suggestedRoles?.length ?? 0) > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suggested Roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.suggestedRoles ?? []).slice(0, 3).map(role => (
                      <Badge key={role} variant="secondary" className="rounded-full text-[10px] px-2 py-0.5">{role}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Activity + Notifications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Recent Activity</h3>
            <Link href="/applications" className="text-xs text-primary hover:underline flex items-center gap-1 touch-auto">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ActivitySkeleton key={i} />)
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                  <Eye className="w-5 h-5" />
                </div>
                <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Start browsing jobs to see activity here.</p>
              </div>
            ) : (
              activities.slice(0, 5).map((act) => {
                const config = activityConfig[act.type as keyof typeof activityConfig] || { icon: Sparkles, color: '#6366f1', label: 'Activity' };
                const Icon = config.icon;
                const titleText = act.jobTitle || act.details || config.label;
                const subText = act.company || '';
                return (
                  <div key={act._id || act.id} className="flex items-center gap-3 group py-0.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 duration-200"
                      style={{ backgroundColor: `${config.color}14` }}>
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{titleText}</p>
                      {subText && <p className="text-xs text-muted-foreground truncate">{subText}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      {act.type === 'applied' && <Badge variant="secondary" className="text-[10px] rounded-full block">Applied</Badge>}
                      {act.type === 'interview' && <Badge className="text-[10px] rounded-full block badge-emerald border">Interview</Badge>}
                      {act.type === 'offer' && <Badge className="text-[10px] rounded-full block badge-amber border">Offer</Badge>}
                      <p className="text-[10px] text-muted-foreground">{formatTime(act.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="h-5 px-1.5 text-[10px] gradient-brand text-white border-0 rounded-full">{unreadCount} new</Badge>
              )}
            </div>
            <Link href="/jobs" className="text-xs text-primary hover:underline flex items-center gap-1 touch-auto">
              Browse Jobs <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                  <Skeleton className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-1/3 rounded" />
                    <Skeleton className="h-3 w-2/3 rounded" />
                  </div>
                </div>
              ))
            ) : notifs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-sm text-muted-foreground">No new notifications.</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">You're all caught up!</p>
              </div>
            ) : (
              notifs.slice(0, 5).map((notif) => (
                <div key={notif._id || notif.id}
                  className={cn('flex items-start gap-3 p-3 rounded-xl transition-all', !notif.read ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted/40')}>
                  <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', !notif.read ? 'bg-primary' : 'bg-border')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{notif.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{formatTime(notif.createdAt)}</p>
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
