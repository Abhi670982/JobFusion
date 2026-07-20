"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Eye,
  Calendar,
  Briefcase,
  FileText,
  Zap,
  Send,
  Star,
  AlertTriangle,
  Heart,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Server,
  ArrowRight,
  Database,
  Image as ImageIcon,
  Clock,
} from "lucide-react";

interface KPI {
  value: number;
  trend: "up" | "down" | "flat";
  percentage: number;
  label: string;
}

interface DashboardStats {
  totalUsers: KPI;
  activeUsers: KPI;
  newUsersToday: KPI;
  totalJobs: KPI;
  resumeUploads: KPI;
  aiAnalyses: KPI;
  totalApplications: KPI;
  savedJobs: KPI;
  pendingReports: KPI;
  systemHealth: KPI;
}

interface ServiceHealth {
  status: "healthy" | "warning" | "offline";
  message: string;
}

interface SystemHealth {
  postgres: ServiceHealth;
  clerk: ServiceHealth;
  gemini: ServiceHealth;
  cloudinary: ServiceHealth;
  jobSync: ServiceHealth;
  apiLatency: ServiceHealth;
}

interface ActivityItem {
  _id: string;
  user: { fullName: string; profileImage: string } | null;
  time: string;
  date: string;
  message: string;
  type: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [statsRes, healthRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/system-health"),
        fetch("/api/admin/analytics"),
      ]);

      const statsData = await statsRes.json();
      const healthData = await healthRes.json();
      const analyticsData = await analyticsRes.json();

      if (statsData.success && healthData.success && analyticsData.success) {
        setStats(statsData.data);
        setHealth(healthData.data);
        setActivities(analyticsData.data.activityFeed || []);
        setError(null);
      } else {
        setError("Failed to load dashboard statistics.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected connection error occurred.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LoaderSpinner />
        <p className="text-xs text-[#a1a1aa] font-semibold animate-pulse">Retrieving live database metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6 max-w-md mx-auto text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-sm font-bold text-[#f4f4f5]">Database Synchronization Error</h3>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">{error}</p>
        <button
          onClick={() => { setLoading(true); loadData(); }}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const kpis = [
    { title: "Total Users", icon: Users, data: stats?.totalUsers, href: "/admin/users", color: "text-blue-400" },
    { title: "Active Users", icon: Eye, data: stats?.activeUsers, href: "/admin/users", color: "text-emerald-400" },
    { title: "New Users Today", icon: Calendar, data: stats?.newUsersToday, href: "/admin/users", color: "text-indigo-400" },
    { title: "Total Jobs", icon: Briefcase, data: stats?.totalJobs, href: "/admin/jobs", color: "text-violet-400" },
    { title: "Resume Uploads", icon: FileText, data: stats?.resumeUploads, href: "/admin/resume-ai", color: "text-purple-400" },
    { title: "AI Analyses", icon: Zap, data: stats?.aiAnalyses, href: "/admin/resume-ai", color: "text-amber-400" },
    { title: "Applications", icon: Send, data: stats?.totalApplications, href: "/admin/analytics", color: "text-pink-400" },
    { title: "Saved Jobs", icon: Star, data: stats?.savedJobs, href: "/admin/analytics", color: "text-rose-400" },
    { title: "Pending Reports", icon: AlertTriangle, data: stats?.pendingReports, href: "/admin/reports", color: "text-orange-400" },
    { title: "System Health", icon: Heart, data: stats?.systemHealth, href: "/admin/dashboard", color: "text-teal-400" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
            Overview Dashboard
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1">Real-time statistics fetched from database.</p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#18181b] border border-[#27272a] hover:bg-[#27272a]/80 transition-all text-[#e4e4e7] disabled:opacity-50 touch-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          const kpiData = kpi.data;
          if (!kpiData) return null;

          return (
            <Link key={kpi.title} href={kpi.href}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className="group relative overflow-hidden rounded-2xl border border-[#27272a] bg-[#18181b]/40 hover:bg-[#18181b]/80 p-5 shadow-sm transition-all hover:border-[#3f3f46]"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">{kpi.title}</p>
                    <p className="text-2xl font-bold text-[#f4f4f5] tabular-nums tracking-tight">
                      {kpiData.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl bg-[#18181b] border border-[#27272a]/80 ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Trend Info */}
                <div className="flex items-center gap-1 mt-4 text-[10px] text-[#71717a] font-medium">
                  {kpiData.percentage > 0 && (
                    <span className={`flex items-center gap-0.5 font-semibold ${kpiData.trend === "up" ? "text-emerald-400" : "text-rose-400"}`}>
                      {kpiData.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {kpiData.percentage}%
                    </span>
                  )}
                  <span className="truncate">{kpiData.label}</span>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Grid: Health & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* System Health Status Center */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-indigo-400" /> System Health status
          </h3>

          <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4">
            {health && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <HealthBadgeItem label="PostgreSQL DB" icon={Database} health={health.postgres} />
                <HealthBadgeItem label="Clerk Identity" icon={Users} health={health.clerk} />
                <HealthBadgeItem label="Gemini AI API" icon={Zap} health={health.gemini} />
                <HealthBadgeItem label="Cloudinary CDN" icon={ImageIcon} health={health.cloudinary} />
                <HealthBadgeItem label="Crawler Sync" icon={RefreshCw} health={health.jobSync} />
                <HealthBadgeItem label="API Speed" icon={Clock} health={health.apiLatency} />
              </div>
            )}
            <div className="border-t border-[#27272a]/60 pt-4 flex items-center justify-between text-[10px] text-[#71717a] font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>All Core Services Online</span>
              </div>
              <span className="tabular-nums">Checked: just now</span>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Recent Activity Feed
            </h3>
            <Link href="/admin/activity-logs" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all logs <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6">
            {activities.length === 0 ? (
              <p className="text-xs text-[#71717a] py-8 text-center">No activity recorded yet.</p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {activities.map((act) => (
                  <div key={act._id} className="flex items-start gap-3.5 text-xs text-[#a1a1aa] py-1">
                    <div className="w-8 h-8 rounded-full bg-[#18181b] border border-[#27272a] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {act.user?.profileImage ? (
                        <img src={act.user.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-3.5 h-3.5 text-[#71717a]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="leading-relaxed">
                        <span className="font-bold text-[#e4e4e7]">
                          {act.user ? act.user.fullName : "System"}
                        </span>{" "}
                        {act.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-[#52525b] font-semibold">
                        <span>{act.date}</span>
                        <span>•</span>
                        <span>{act.time}</span>
                        <span>•</span>
                        <span className="uppercase text-indigo-400/90">{act.type.replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
  );
}

function HealthBadgeItem({ label, icon: Icon, health }: { label: string; icon: any; health: ServiceHealth }) {
  const getStatusColors = (status: "healthy" | "warning" | "offline") => {
    switch (status) {
      case "healthy":
        return { dot: "bg-emerald-500 shadow-emerald-500/20", border: "border-emerald-500/10", bg: "bg-emerald-500/[0.02]" };
      case "warning":
        return { dot: "bg-amber-500 shadow-amber-500/20", border: "border-amber-500/10", bg: "bg-amber-500/[0.02]" };
      case "offline":
        return { dot: "bg-red-500 shadow-red-500/20", border: "border-red-500/10", bg: "bg-red-500/[0.02]" };
    }
  };

  const colors = getStatusColors(health.status);

  return (
    <div className={`p-3 rounded-xl border ${colors.border} ${colors.bg} flex items-start gap-2.5 min-h-[70px]`}>
      <div className="p-1.5 rounded-lg bg-[#09090b] border border-[#27272a] text-[#71717a] flex-shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#e4e4e7] truncate">{label}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} flex-shrink-0 shadow-sm`} />
        </div>
        <p className="text-[9px] text-[#71717a] mt-0.5 leading-snug truncate" title={health.message}>
          {health.message}
        </p>
      </div>
    </div>
  );
}
