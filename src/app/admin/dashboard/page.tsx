'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Eye, TrendingUp, AlertTriangle, CheckCircle2,
  Database, Activity, Clock, RefreshCw, ArrowUpRight,
  XCircle, BarChart3, Globe, Zap, Shield, LogOut
} from 'lucide-react';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyView { date: string; visits: number; uniqueUsers: number; }
interface TopPage { path: string; count: number; }
interface ErrorEntry { source: string; status: string; errorMsg: string; timestamp: string; }
interface SourceHealth { lastSync: string | null; status: string; errorMsg: string | null; jobsCount: number; }

interface AdminStats {
  pageViews: {
    total: number; today: number; thisWeek: number; thisMonth: number;
    uniqueLoggedIn: number; dailyChart: DailyView[]; topPages: TopPage[];
  };
  users: { total: number; newThisWeek: number; newThisMonth: number; };
  jobs: { total: number; sourceHealth: Record<string, SourceHealth>; };
  errors: { recent: ErrorEntry[]; summary: any[]; };
  recentSuccesses: any[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function fmtRelative(iso: string | null) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color, delay = 0
}: {
  icon: any; label: string; value: string | number; sub?: string;
  color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
    >
      <div className={`absolute inset-0 opacity-5 ${color}`} style={{ background: 'currentColor' }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

function MiniChart({ data, max }: { data: DailyView[]; max: number }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">No data yet</div>
  );
  const peak = Math.max(...data.map(d => d.visits), 1);
  return (
    <div className="flex items-end gap-1 h-20 mt-2">
      {data.map((d, i) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group">
          <div className="relative w-full">
            <div
              className="w-full rounded-t bg-primary/30 group-hover:bg-primary/60 transition-colors"
              style={{ height: `${Math.max(4, (d.visits / peak) * 64)}px` }}
              title={`${d.date}: ${d.visits} visits`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceStatusBadge({ status }: { status: string }) {
  if (status === 'success') return (
    <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
      <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
    </span>
  );
  if (status === 'failed') return (
    <span className="flex items-center gap-1 text-red-500 text-xs font-bold">
      <XCircle className="w-3.5 h-3.5" /> Failed
    </span>
  );
  if (status === 'captcha') return (
    <span className="flex items-center gap-1 text-amber-500 text-xs font-bold">
      <AlertTriangle className="w-3.5 h-3.5" /> CAPTCHA
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-muted-foreground text-xs font-bold">
      <Clock className="w-3.5 h-3.5" /> {status}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'errors' | 'sources'>('overview');
  const { signOut } = useClerk();
  const router = useRouter();

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load stats');
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground font-semibold">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center space-y-3">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold">Access Error</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const s = stats!;
  const chartMax = s.pageViews.dailyChart.reduce((m, d) => Math.max(m, d.visits), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-md">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                JobFusion Admin
              </h1>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Internal Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border hover:bg-accent transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 border border-red-500/20 hover:bg-red-500/5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-2xl w-fit border border-border/50">
          {(['overview', 'errors', 'sources'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-card text-foreground shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'errors' && '🔴 Error Logs'}
              {tab === 'sources' && '⚙️ Job Sources'}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">

            {/* KPI Cards Row 1: Traffic */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Website Traffic
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard icon={Eye} label="Total Visits" value={s.pageViews.total} color="text-blue-500 bg-blue-500" delay={0} />
                <StatCard icon={TrendingUp} label="Today" value={s.pageViews.today} color="text-emerald-500 bg-emerald-500" delay={0.05} />
                <StatCard icon={BarChart3} label="This Week" value={s.pageViews.thisWeek} color="text-violet-500 bg-violet-500" delay={0.1} />
                <StatCard icon={Activity} label="This Month" value={s.pageViews.thisMonth} color="text-orange-500 bg-orange-500" delay={0.15} />
                <StatCard icon={Users} label="Logged-in Visitors" value={s.pageViews.uniqueLoggedIn} sub="unique accounts" color="text-pink-500 bg-pink-500" delay={0.2} />
              </div>
            </div>

            {/* KPI Cards Row 2: Users & Jobs */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Platform Users
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={s.users.total} color="text-blue-500 bg-blue-500" delay={0} />
                <StatCard icon={TrendingUp} label="New This Week" value={s.users.newThisWeek} color="text-emerald-500 bg-emerald-500" delay={0.05} />
                <StatCard icon={ArrowUpRight} label="New This Month" value={s.users.newThisMonth} color="text-violet-500 bg-violet-500" delay={0.1} />
                <StatCard icon={Database} label="Total Jobs" value={s.jobs.total} color="text-amber-500 bg-amber-500" delay={0.15} />
              </div>
            </div>

            {/* Daily Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold">Daily Visits — Last 14 Days</h3>
                <span className="text-xs text-muted-foreground font-semibold">
                  Peak: {chartMax.toLocaleString()} visits
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Each bar = 1 day of page views</p>
              <MiniChart data={s.pageViews.dailyChart} max={chartMax} />
              {/* Date labels */}
              <div className="flex gap-1 mt-2">
                {s.pageViews.dailyChart.map((d, i) => (
                  <div key={d.date} className="flex-1 text-center">
                    {(i === 0 || i === s.pageViews.dailyChart.length - 1) && (
                      <span className="text-[8px] text-muted-foreground font-bold">
                        {d.date.slice(5)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Daily table */}
              {s.pageViews.dailyChart.length > 0 && (
                <div className="mt-6 border-t border-border/50 pt-4">
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase text-muted-foreground mb-2 px-2">
                    <span>Date</span><span className="text-right">Visits</span><span className="text-right">Unique Users</span>
                  </div>
                  <div className="space-y-1 max-h-52 overflow-y-auto">
                    {[...s.pageViews.dailyChart].reverse().map(d => (
                      <div key={d.date} className="grid grid-cols-3 gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/40 text-xs">
                        <span className="font-semibold">{d.date}</span>
                        <span className="text-right text-primary font-bold">{d.visits}</span>
                        <span className="text-right text-muted-foreground">{d.uniqueUsers}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Top Pages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" /> Top Pages
              </h3>
              <div className="space-y-2">
                {s.pageViews.topPages.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No page view data yet. Visits will appear here automatically.</p>
                ) : s.pageViews.topPages.map((p, i) => (
                  <div key={p.path} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-muted/40">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold text-muted-foreground w-5">{i + 1}</span>
                      <code className="text-xs font-mono text-foreground">{p.path}</code>
                    </div>
                    <span className="text-xs font-bold text-primary">{p.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        )}

        {/* ── ERRORS TAB ───────────────────────────────────────────────────── */}
        {activeTab === 'errors' && (
          <div className="space-y-6">
            {/* Error Summary */}
            {s.errors.summary.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Error Summary by Source
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {s.errors.summary.map((e: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                      <div>
                        <p className="text-xs font-bold capitalize">{e._id.source}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{e._id.status}</p>
                      </div>
                      <span className="text-lg font-bold text-red-500">{e.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Log */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" /> Recent Errors
                <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold ml-1">
                  {s.errors.recent.length} records
                </span>
              </h3>

              {s.errors.recent.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-500 p-4">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-sm font-semibold">No errors recorded — all systems healthy!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {s.errors.recent.map((err: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="p-4 rounded-xl border border-red-500/15 bg-red-500/5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold capitalize px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                            {err.source}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            err.status === 'captcha'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {err.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {fmtDate(err.timestamp)}
                        </span>
                      </div>
                      {err.errorMsg && (
                        <p className="text-xs text-muted-foreground font-mono bg-background/60 rounded-lg p-2 break-all">
                          {err.errorMsg}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Successes */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Recent Successful Syncs
              </h3>
              {s.recentSuccesses.length === 0 ? (
                <p className="text-xs text-muted-foreground">No successful syncs yet.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {s.recentSuccesses.map((log: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold capitalize">{log.source}</span>
                        <span className="text-xs text-muted-foreground">{log.jobsFetched} jobs fetched</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{fmtDate(log.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SOURCES TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Active Job Sources
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(s.jobs.sourceHealth).map(([src, info]: [string, any], i) => (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.07 }}
                    className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold capitalize">{src === 'careers' ? 'Company Careers' : src}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Last synced: {fmtRelative(info.lastSync)}</p>
                      </div>
                      <SourceStatusBadge status={info.status} />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground font-semibold">
                        <Database className="w-3 h-3 inline mr-1" />
                        {info.jobsCount.toLocaleString()} jobs stored
                      </span>
                    </div>

                    {info.errorMsg && (
                      <div className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/10">
                        <p className="text-[10px] text-red-400 font-mono break-all">{info.errorMsg}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Inline cron trigger */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" /> Manual Sync Trigger
              </h3>
              <p className="text-xs text-muted-foreground">Force an immediate sync for any source without waiting for the scheduled cron.</p>
              <div className="flex flex-wrap gap-2">
                {(['wellfound', 'careers', 'aggregator'] as const).map(src => (
                  <ManualSyncButton key={src} source={src} />
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Manual Sync Button ───────────────────────────────────────────────────────

function ManualSyncButton({ source }: { source: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const trigger = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/jobs/fetch-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMsg(`${data.jobsFetchedCount} jobs fetched`);
      } else {
        setStatus('error');
        setMsg(data.error || 'Failed');
      }
    } catch (e: any) {
      setStatus('error');
      setMsg(e.message);
    }
    setTimeout(() => { setStatus('idle'); setMsg(''); }, 4000);
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={trigger}
        disabled={status === 'loading'}
        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all capitalize ${
          status === 'idle'
            ? 'border-border hover:bg-accent text-foreground'
            : status === 'loading'
            ? 'border-primary/30 bg-primary/10 text-primary'
            : status === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
            : 'border-red-500/30 bg-red-500/10 text-red-500'
        }`}
      >
        {status === 'loading' ? (
          <span className="flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin" /> Syncing {source}...
          </span>
        ) : (
          `Sync ${source === 'careers' ? 'Company Careers' : source}`
        )}
      </button>
      {msg && (
        <p className={`text-[10px] font-semibold ${status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
          {msg}
        </p>
      )}
    </div>
  );
}
