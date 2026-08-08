"use client";

import { useState, useEffect } from "react";
import {
  Server,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  Layers,
  FileCheck,
  RotateCcw,
  Zap,
  ShieldCheck,
  Activity
} from "lucide-react";

interface OverviewMetrics {
  totalJobsInDb: number;
  activeJobs: number;
  newJobsToday: number;
  updatedJobsToday: number;
  expiredJobsRemoved: number;
  duplicateJobsToday: number;
  failedJobs: number;
}

interface LastCrawlData {
  startedAt: string;
  finishedAt: string | null;
  durationMs: number;
  status: string;
  jobsFetched: number;
  newJobs: number;
  updatedJobs: number;
  duplicateJobs: number;
  expiredJobs: number;
  failedSources: number;
  successfulSources: number;
  triggeredBy: string;
}

interface SourceBreakdownItem {
  source: string;
  status: string;
  lastCrawlAt: string | null;
  rawJobs: number;
  validJobs: number;
  newJobs: number;
  updatedJobs: number;
  duplicateJobs: number;
  failedJobs: number;
  totalInDb: number;
  provider: string;
}

interface ErrorLogItem {
  id: string;
  source: string;
  timestamp: string;
  errorCategory: string;
  errorMessage: string;
  httpStatus: number;
  retryCount: number;
  usedFallback: boolean;
}

interface RunHistoryItem {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number;
  status: string;
  triggeredBy: string;
  jobsFetched: number;
  newJobs: number;
  updatedJobs: number;
  duplicateJobs: number;
  expiredJobs: number;
}

export default function AdminCrawlerMonitoringPage() {
  const [crawlerStatus, setCrawlerStatus] = useState<string>("IDLE");
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [lastCrawl, setLastCrawl] = useState<LastCrawlData | null>(null);
  const [sources, setSources] = useState<SourceBreakdownItem[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLogItem[]>([]);
  const [recentRuns, setRecentRuns] = useState<RunHistoryItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [manualMessage, setManualMessage] = useState<string | null>(null);

  const safeParseJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("[Admin Crawler] Received non-JSON response:", text.slice(0, 200));
      return { success: false, error: "Crawler request failed. The server returned an unexpected response." };
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/crawler-stats");
      const json = await safeParseJson(res);

      if (json.success && json.data) {
        setCrawlerStatus(json.data.crawlerStatus || "IDLE");
        setOverview(json.data.overview || null);
        setLastCrawl(json.data.lastCrawl || null);
        setSources(json.data.sourceBreakdown || []);
        setErrorLogs(json.data.errorLogs || []);
        setRecentRuns(json.data.recentRuns || []);
      }
    } catch (err) {
      console.error("Failed to fetch crawler stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Auto-poll every 4 seconds if crawler is running
  useEffect(() => {
    if (crawlerStatus === "RUNNING") {
      const timer = setInterval(() => {
        fetchStats();
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [crawlerStatus]);

  const handleRunCrawlNow = async () => {
    setTriggering(true);
    setManualMessage("Initiating background job aggregation pass across all portals...");
    try {
      const res = await fetch("/api/admin/crawler-stats", { method: "POST" });
      const json = await safeParseJson(res);

      if (json.success) {
        setManualMessage(json.message || "Background crawler started successfully.");
        setCrawlerStatus("RUNNING");
        await fetchStats();
      } else {
        if (res.status === 409 || json.status === "ALREADY_RUNNING") {
          setManualMessage(json.message || "A crawler run is already in progress.");
          setCrawlerStatus("RUNNING");
        } else {
          setManualMessage(json.error || "Crawler request failed. Please check server logs.");
        }
      }
    } catch (err: any) {
      setManualMessage(err.message || "Execution error: Failed to trigger crawl.");
    } finally {
      setTriggering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RUNNING":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            RUNNING
          </span>
        );
      case "SUCCESS":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            SUCCESS
          </span>
        );
      case "PARTIAL_SUCCESS":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            PARTIAL SUCCESS
          </span>
        );
      case "FAILED":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <XCircle className="w-3.5 h-3.5" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#27272a] border border-[#3f3f46] text-[#a1a1aa]">
            <Clock className="w-3.5 h-3.5" />
            IDLE
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-xs text-[#a1a1aa] font-semibold animate-pulse">Loading Crawler Monitoring Diagnostics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
              Crawler Monitoring
            </h2>
            {getStatusBadge(crawlerStatus)}
          </div>
          <p className="text-xs text-[#a1a1aa] mt-1">Real-time job aggregation health, run history, deduplication, and source errors.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#18181b] border border-[#27272a] hover:bg-[#27272a]/80 transition-all text-[#e4e4e7]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>

          <button
            onClick={handleRunCrawlNow}
            disabled={triggering || crawlerStatus === "RUNNING"}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-white shadow-md transition-all disabled:opacity-50 touch-auto"
          >
            <Play className={`w-3.5 h-3.5 ${triggering ? "animate-spin" : ""}`} />
            {triggering ? "Crawling Portals..." : "Run Crawl Now"}
          </button>
        </div>
      </div>

      {manualMessage && (
        <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-300 font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>{manualMessage}</span>
        </div>
      )}

      {/* Overview KPI Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KPIBox title="Total Jobs in DB" value={overview.totalJobsInDb} icon={Database} color="text-indigo-400" />
          <KPIBox title="Active Jobs" value={overview.activeJobs} icon={ShieldCheck} color="text-emerald-400" />
          <KPIBox title="New Today" value={overview.newJobsToday} icon={Zap} color="text-blue-400" />
          <KPIBox title="Updated Today" value={overview.updatedJobsToday} icon={RotateCcw} color="text-purple-400" />
          <KPIBox title="Expired Removed" value={overview.expiredJobsRemoved} icon={Layers} color="text-amber-400" />
          <KPIBox title="Duplicates Today" value={overview.duplicateJobsToday} icon={FileCheck} color="text-slate-400" />
          <KPIBox title="Failed Jobs" value={overview.failedJobs} icon={AlertTriangle} color="text-rose-400" />
        </div>
      )}

      {/* Last Crawl Diagnostics */}
      {lastCrawl && (
        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/40 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272a]/60 pb-3">
            <h3 className="text-xs font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" /> Last Crawl Summary
            </h3>
            <span className="text-xs text-[#a1a1aa] font-medium">
              Started: {new Date(lastCrawl.startedAt).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Duration</p>
              <p className="text-lg font-bold text-[#f4f4f5] tabular-nums mt-0.5">{(lastCrawl.durationMs / 1000).toFixed(1)}s</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Jobs Fetched</p>
              <p className="text-lg font-bold text-[#f4f4f5] tabular-nums mt-0.5">{lastCrawl.jobsFetched}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">New Jobs</p>
              <p className="text-lg font-bold text-emerald-400 tabular-nums mt-0.5">+{lastCrawl.newJobs}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Updated Jobs</p>
              <p className="text-lg font-bold text-purple-400 tabular-nums mt-0.5">{lastCrawl.updatedJobs}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Duplicates Skipped</p>
              <p className="text-lg font-bold text-[#a1a1aa] tabular-nums mt-0.5">{lastCrawl.duplicateJobs}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Sources Passed</p>
              <p className="text-lg font-bold text-emerald-400 tabular-nums mt-0.5">{lastCrawl.successfulSources} / {lastCrawl.successfulSources + lastCrawl.failedSources}</p>
            </div>
          </div>
        </div>
      )}

      {/* Source Breakdown Table */}
      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/30 overflow-hidden space-y-3 p-5">
        <h3 className="text-xs font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" /> Source Health & Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#27272a] text-[#71717a] text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Portal Source</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Last Crawled</th>
                <th className="py-2.5 px-3 text-right">Raw Jobs</th>
                <th className="py-2.5 px-3 text-right">New</th>
                <th className="py-2.5 px-3 text-right">Updated</th>
                <th className="py-2.5 px-3 text-right">Duplicates</th>
                <th className="py-2.5 px-3 text-right">Total DB Jobs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]/50 text-[#e4e4e7]">
              {sources.map((s) => (
                <tr key={s.source} className="hover:bg-[#18181b]/60 transition-colors">
                  <td className="py-3 px-3 font-bold capitalize flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    {s.source}
                  </td>
                  <td className="py-3 px-3 text-[#a1a1aa] font-medium">{s.provider}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                      s.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      s.status === "FAILED" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                      "bg-[#27272a] text-[#a1a1aa]"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#a1a1aa]">
                    {s.lastCrawlAt ? new Date(s.lastCrawlAt).toLocaleTimeString() : "Never"}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">{s.rawJobs}</td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-bold tabular-nums">+{s.newJobs}</td>
                  <td className="py-3 px-3 text-right text-purple-400 tabular-nums">{s.updatedJobs}</td>
                  <td className="py-3 px-3 text-right text-[#71717a] tabular-nums">{s.duplicateJobs}</td>
                  <td className="py-3 px-3 text-right font-bold text-indigo-300 tabular-nums">{s.totalInDb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Log & Recent Runs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Error Logs Table */}
        <div className="lg:col-span-6 rounded-2xl border border-[#27272a] bg-[#18181b]/30 p-5 space-y-3">
          <h3 className="text-xs font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> Recent Crawler Error Logs
          </h3>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
            {errorLogs.length === 0 ? (
              <p className="text-xs text-[#71717a] py-8 text-center">No crawler errors recorded.</p>
            ) : (
              errorLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl border border-rose-500/10 bg-rose-500/5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#f4f4f5]">
                    <span className="capitalize text-rose-400">{log.source}</span>
                    <span className="text-[10px] text-[#71717a] font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-[#e4e4e7] leading-relaxed">{log.errorMessage}</p>
                  <div className="flex items-center gap-3 text-[9px] text-[#71717a] font-semibold pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 uppercase">{log.errorCategory}</span>
                    <span>Retries: {log.retryCount}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Crawler Runs History */}
        <div className="lg:col-span-6 rounded-2xl border border-[#27272a] bg-[#18181b]/30 p-5 space-y-3">
          <h3 className="text-xs font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Recent Crawler Runs
          </h3>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
            {recentRuns.map((run) => (
              <div key={run.id} className="p-3 rounded-xl border border-[#27272a] bg-[#18181b]/50 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#f4f4f5]">{new Date(run.startedAt).toLocaleTimeString()}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                      run.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400" :
                      run.status === "PARTIAL_SUCCESS" ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {run.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#71717a] mt-0.5">Trigger: {run.triggeredBy} • Duration: {(run.durationMs / 1000).toFixed(1)}s</p>
                </div>
                <div className="text-right text-[11px] tabular-nums space-x-2">
                  <span className="text-emerald-400 font-bold">+{run.newJobs} new</span>
                  <span className="text-[#a1a1aa]">{run.jobsFetched} fetched</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPIBox({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-[#27272a] bg-[#18181b]/40 p-3.5 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider">{title}</p>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <p className="text-xl font-bold text-[#f4f4f5] tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}
