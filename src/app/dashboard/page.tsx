'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp, Briefcase, Bookmark, Eye, MessageSquare,
  Sparkles, ArrowRight, Clock, CheckCircle2, XCircle,
  Calendar, Bell, Star, ChevronRight, Zap, BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { dashboardStats, activities, notifications } from '@/lib/data';
import { cn } from '@/lib/utils';

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
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${color}15` }}>
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

const activityConfig = {
  applied: { icon: Briefcase, color: '#6366f1', label: 'Applied' },
  interview: { icon: Calendar, color: '#10b981', label: 'Interview' },
  saved: { icon: Bookmark, color: '#8b5cf6', label: 'Saved' },
  viewed: { icon: Eye, color: '#94a3b8', label: 'Viewed' },
  offer: { icon: Star, color: '#f59e0b', label: 'Offer' },
  rejected: { icon: XCircle, color: '#ef4444', label: 'Rejected' },
};

export default function DashboardPage() {
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
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Good morning, Rahul! 👋
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                You have <strong className="text-foreground">12 new job matches</strong> and <strong className="text-foreground">3 unread messages</strong> today.
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

          {/* AI Match Score Banner */}
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
                  <span className="text-xl font-extrabold">{dashboardStats.matchScore}</span>
                  <span className="text-[10px] text-white/70">/ 100</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-white/80" />
                    <span className="font-semibold">AI Match Score</span>
                    <Badge className="border-white/30 bg-white/20 text-white text-[10px]">87th percentile</Badge>
                  </div>
                  <p className="text-white/70 text-sm">Complete your profile to boost your match score by 15%</p>
                  <div className="mt-2 w-full max-w-[16rem] bg-white/20 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-white" style={{ width: `${dashboardStats.matchScore}%` }} />
                  </div>
                </div>
              </div>
              <Link href="/profile">
                <Button size="sm" className="bg-white text-primary hover:bg-white/90 rounded-xl font-semibold">
                  Boost Score
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={Briefcase} label="Applications Sent" value={dashboardStats.applied} change="+4 this week" color="#6366f1" />
            <StatCard icon={Calendar} label="Interviews" value={dashboardStats.interviews} change="+2 scheduled" color="#10b981" />
            <StatCard icon={Star} label="Offers Received" value={dashboardStats.offers} color="#f59e0b" />
            <StatCard icon={Bookmark} label="Saved Jobs" value={dashboardStats.savedJobs} color="#8b5cf6" />
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
            </div>

            {/* Match Distribution */}
            <div className="card-premium p-5">
              <h3 className="font-semibold mb-1">Match Distribution</h3>
              <p className="text-xs text-muted-foreground mb-5">Jobs by match score range</p>
              <div className="space-y-4">
                {matchDistData.map((d) => (
                  <div key={d.range}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium">{d.range}</span>
                      <span className="text-muted-foreground">{d.count} jobs</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.count / 80) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total matches</span>
                <span className="font-bold">80 jobs</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Recent Activity */}
            <div className="card-premium p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Activity</h3>
                <Link href="/jobs" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {activities.slice(0, 5).map((act) => {
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
                })}
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
