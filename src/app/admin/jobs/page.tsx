"use client";

import { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Loader2,
  Building,
  Globe,
  MapPin,
  ExternalLink,
  Plus,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface JobItem {
  _id: string;
  title: string;
  company: string;
  source: string;
  location: string;
  locationType: string;
  postedAtDate: string;
  expiresAt?: string;
  applicants: number;
  isActive: boolean;
  applyUrl: string;
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Sync state
  const [syncSource, setSyncSource] = useState("careers");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMsg, setSyncMsg] = useState("");

  // Delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/jobs?page=${page}&q=${encodeURIComponent(
        search
      )}&source=${sourceFilter}&status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data.jobs);
        setTotal(data.data.total);
        setPages(data.data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sourceFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      fetchJobs();
    }, 400);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Trigger scraper sync
  const handleScraperSync = async () => {
    setSyncStatus("syncing");
    setSyncMsg("");
    try {
      const res = await fetch("/api/jobs/fetch-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: syncSource }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus("success");
        setSyncMsg(`Sync complete: ${data.jobsFetchedCount} jobs scraped.`);
        fetchJobs(); // reload jobs table
      } else {
        setSyncStatus("error");
        setSyncMsg(data.error || "Scraping operation failed.");
      }
    } catch (err: any) {
      setSyncStatus("error");
      setSyncMsg(err.message || "Connection timeout with sync pipeline.");
    }

    setTimeout(() => {
      setSyncStatus("idle");
      setSyncMsg("");
    }, 5000);
  };

  // Delete invalid job posting
  const handleDeleteJob = async () => {
    if (!confirmDeleteId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${confirmDeleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) => prev.filter((j) => j._id !== confirmDeleteId));
        setConfirmDeleteId(null);
      } else {
        alert(data.error || "Failed to remove job posting.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
            Job Postings Management
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1">Review active unified vacancies, run scraper pipelines, or clean listings.</p>
        </div>
        <button
          onClick={() => window.location.href = "/admin/jobs/add"}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/10 transition-all touch-auto"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </button>
      </div>

      {/* Sync Control & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#18181b]/30 p-5 rounded-2xl border border-[#27272a]/60">
        {/* Scraper Sync section */}
        <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#27272a]/60 pb-5 lg:pb-0 lg:pr-6 space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#e4e4e7] uppercase tracking-wider">Manual Sync Trigger</h4>
            <p className="text-[10px] text-[#71717a]">Trigger crawls on specific pipelines instantly.</p>
          </div>
          <div className="flex gap-2">
            <select
              value={syncSource}
              onChange={(e) => setSyncSource(e.target.value)}
              className="bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3 py-2 rounded-xl outline-none transition-all flex-1 touch-auto"
            >
              <option value="careers">Company Careers</option>
              <option value="wellfound">Wellfound</option>
              <option value="aggregator">Aggregator</option>
            </select>
            <button
              onClick={handleScraperSync}
              disabled={syncStatus === "syncing"}
              className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 touch-auto"
            >
              {syncStatus === "syncing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Sync
            </button>
          </div>
          {syncMsg && (
            <p className={`text-[10px] font-semibold ${
              syncStatus === "success" ? "text-emerald-500" : syncStatus === "error" ? "text-red-500" : "text-indigo-400"
            }`}>
              {syncMsg}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="lg:col-span-7 flex flex-wrap items-center gap-4 lg:pl-2">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs by title or company..."
              className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
            />
          </div>

          {/* Source filter */}
          <select
            value={sourceFilter}
            onChange={(e) => { setPage(1); setSourceFilter(e.target.value); }}
            className="bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-4 py-2.5 rounded-xl outline-none transition-all touch-auto"
          >
            <option value="">All Sources</option>
            <option value="careers">Careers</option>
            <option value="wellfound">Wellfound</option>
            <option value="foundit">Foundit</option>
            <option value="aggregator">Aggregator</option>
          </select>

          {/* Expiration status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
            className="bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-4 py-2.5 rounded-xl outline-none transition-all touch-auto"
          >
            <option value="">All Vacancies</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>
      </div>

      {/* Jobs table grid */}
      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 overflow-hidden shadow-sm">
        {loading && jobs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs text-[#a1a1aa]">Fetching vacancy listings...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-[#71717a]">No jobs in database matching current configurations.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                  <th className="px-6 py-4">Title & Company</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Saves & Applies</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/40 text-xs">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-[#18181b]/40 transition-colors">
                    {/* Title */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#e4e4e7]">{job.title}</p>
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-[#71717a] hover:text-[#f4f4f5] transition-colors rounded hover:bg-[#18181b]"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#71717a] font-medium">
                          <Building className="w-3.5 h-3.5 text-[#52525b]" />
                          <span>{job.company}</span>
                        </div>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-[11px] text-[#a1a1aa] font-medium capitalize">
                        <Globe className="w-3.5 h-3.5 text-[#71717a]" />
                        {job.source === "careers" ? "careers website" : job.source}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-[#71717a]">
                        <p className="flex items-center gap-1 text-[11px] font-semibold text-[#a1a1aa]">
                          <MapPin className="w-3.5 h-3.5 text-[#71717a]" />
                          {job.location || "Remote"}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider pl-4.5 font-bold text-[#52525b]">{job.locationType}</p>
                      </div>
                    </td>

                    {/* Applicants and saves */}
                    <td className="px-6 py-4">
                      <div className="text-[11px] space-y-1 text-[#a1a1aa] font-semibold">
                        <p>Applies: <span className="text-[#f4f4f5] tabular-nums">{job.applicants || 0}</span></p>
                        <p className="text-[10px] text-[#71717a]">Expires: <span className="tabular-nums">{job.expiresAt ? new Date(job.expiresAt).toLocaleDateString("en-IN") : "Never"}</span></p>
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="px-6 py-4 text-[#71717a] font-medium space-y-1 tabular-nums text-[10px]">
                      <p>Posted: {new Date(job.postedAtDate).toLocaleDateString("en-IN")}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        job.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {job.isActive ? "Active" : "Expired"}
                      </span>
                    </td>

                    {/* Deletion action */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setConfirmDeleteId(job._id)}
                        title="Delete Vacancy"
                        className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-all touch-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {pages > 1 && (
          <div className="px-6 py-4 border-t border-[#27272a]/60 bg-[#18181b]/10 flex items-center justify-between">
            <span className="text-[10px] text-[#71717a] font-semibold uppercase">Total: {total} vacancies</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl border border-[#27272a] bg-[#18181b]/40 text-xs font-semibold hover:bg-[#27272a]/50 text-[#e4e4e7] disabled:opacity-40 touch-auto"
              >
                Previous
              </button>
              <span className="text-xs text-[#a1a1aa] font-semibold px-2 tabular-nums">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 rounded-xl border border-[#27272a] bg-[#18181b]/40 text-xs font-semibold hover:bg-[#27272a]/50 text-[#e4e4e7] disabled:opacity-40 touch-auto"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation delete dialog */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-black/60"
            />

            {/* Modal box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl relative z-10 p-6 space-y-4 glow-card"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#f4f4f5]">Delete Job Listing</h4>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Are you sure you want to permanently delete this job listing? This action is immediate and cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a]/50 transition-all touch-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteJob}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 touch-auto"
                >
                  {actionLoading ? <Loader2 className="w-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
