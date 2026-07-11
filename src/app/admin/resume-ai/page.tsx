"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Cpu,
} from "lucide-react";

interface ParsingErrorLog {
  _id: string;
  userId: {
    fullName: string;
    email: string;
  } | null;
  status: "success" | "failed";
  step: string;
  errorMsg: string | null;
  fileName: string;
  parsingTimeMs: number;
  timestamp: string;
}

interface SkillItem {
  name: string;
  count: number;
}

interface ResumeStats {
  totalParses: number;
  successCount: number;
  failedCount: number;
  averageTimeMs: number;
  topSkills: SkillItem[];
  failedLogs: ParsingErrorLog[];
}

export default function AdminResumeAI() {
  const [data, setData] = useState<ResumeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/resume-ai");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to load parsing metrics.");
      }
    } catch (err: any) {
      setError(err.message || "Connection timeout with parser statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-[#a1a1aa] font-semibold">Loading resume parsing statistics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/30 p-8 max-w-md mx-auto text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-sm font-bold text-[#f4f4f5]">Monitoring Offline</h3>
        <p className="text-xs text-[#a1a1aa]">{error || "No database metrics returned."}</p>
      </div>
    );
  }

  const successRate = data.totalParses > 0 ? Math.round((data.successCount / data.totalParses) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
            Resume Intelligence & AI Monitor
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1">Audit parser compilation time, failure step logs, and AI success rates.</p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#18181b] border border-[#27272a] hover:bg-[#27272a]/85 transition-all text-[#e4e4e7] disabled:opacity-50 touch-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/40 p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Total Resumes Processed</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-[#f4f4f5] tabular-nums">{data.totalParses}</p>
          <p className="text-[10px] text-[#71717a]">All-time uploads</p>
        </div>

        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/40 p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Parsing Success Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-[#f4f4f5] tabular-nums">{successRate}%</p>
          <p className="text-[10px] text-[#71717a]">{data.successCount} parses completed successfully</p>
        </div>

        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/40 p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Failed Parses</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-[#f4f4f5] tabular-nums">{data.failedCount}</p>
          <p className="text-[10px] text-[#71717a]">Failures recorded in pipeline</p>
        </div>

        <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/40 p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Avg Parsing Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-[#f4f4f5] tabular-nums">
            {(data.averageTimeMs / 1000).toFixed(2)}s
          </p>
          <p className="text-[10px] text-[#71717a]">Cloudinary fetch + AI extraction</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Queue & Skills */}
        <div className="lg:col-span-4 space-y-6">
          {/* Queue visualizer */}
          <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4.5 h-4.5 text-indigo-400" /> Parser Queue
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">Idle</span>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Resume parsing triggers asynchronously on upload.
            </p>
            <div className="pt-2 border-t border-[#27272a]/60 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-[#71717a] font-semibold">
                <span>Active Jobs</span>
                <span className="text-[#e4e4e7] font-bold">0</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#71717a] font-semibold">
                <span>Pending Queue</span>
                <span className="text-[#e4e4e7] font-bold">0</span>
              </div>
            </div>
          </div>

          {/* Top Extracted Skills */}
          <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4.5 h-4.5 text-amber-400" /> Top Extracted Skills
            </h3>
            {data.topSkills.length === 0 ? (
              <p className="text-xs text-[#71717a] text-center py-6">No skills extracted yet.</p>
            ) : (
              <div className="space-y-2.5">
                {data.topSkills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#e4e4e7] bg-[#18181b] border border-[#27272a] px-2 py-0.5 rounded-lg">
                      {skill.name}
                    </span>
                    <span className="text-[#71717a] font-bold tabular-nums">{skill.count} users</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Parsing Errors */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Recent Parsing Errors
          </h3>

          <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4">
            {data.failedLogs.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center justify-center gap-2 text-emerald-400">
                <CheckCircle className="w-8 h-8" />
                <p className="text-xs font-bold">No parsing failures logged — healthy execution!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {data.failedLogs.map((log) => (
                  <div key={log._id} className="p-4 rounded-xl border border-red-500/10 bg-red-500/[0.01] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 text-[9px] font-bold uppercase">
                          {log.step}
                        </span>
                        <p className="font-bold text-[#e4e4e7] truncate max-w-[150px]">
                          {log.userId ? log.userId.fullName : "Deleted User"}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#71717a] font-semibold tabular-nums">
                        {new Date(log.timestamp).toLocaleString("en-IN")}
                      </span>
                    </div>
                    {log.errorMsg && (
                      <p className="text-[11px] text-[#a1a1aa] font-mono bg-[#09090b]/60 border border-[#27272a]/60 p-2.5 rounded-lg break-all leading-normal">
                        {log.errorMsg}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-[9px] text-[#71717a] font-semibold">
                      <span>File: {log.fileName}</span>
                      <span>•</span>
                      <span>Duration: {(log.parsingTimeMs / 1000).toFixed(2)}s</span>
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
