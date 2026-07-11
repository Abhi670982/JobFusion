"use client";

import { useState, useEffect } from "react";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Loader2,
  X,
  FileText,
  User,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface ReportItem {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  type: "bug" | "feature_request" | "incorrect_job" | "resume_parsing";
  title: string;
  description: string;
  jobId?: {
    _id: string;
    title: string;
    company: string;
  };
  status: "pending" | "resolved";
  createdAt: string;
}

export default function AdminReports() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Selected report modal details
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // Delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/reports?page=${page}&q=${encodeURIComponent(
        search
      )}&type=${typeFilter}&status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReports(data.data.reports);
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
    fetchReports();
  }, [page, typeFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      fetchReports();
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  // Toggle report status to resolved
  const handleResolveReport = async (report: ReportItem) => {
    const targetStatus = report.status === "resolved" ? "pending" : "resolved";
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${report._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) =>
          prev.map((r) => (r._id === report._id ? { ...r, status: targetStatus } : r))
        );
        if (selectedReport?._id === report._id) {
          setSelectedReport({ ...selectedReport, status: targetStatus });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete report ticket
  const handleDeleteReport = async () => {
    if (!confirmDeleteId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${confirmDeleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) => prev.filter((r) => r._id !== confirmDeleteId));
        if (selectedReport?._id === confirmDeleteId) {
          setSelectedReport(null);
        }
        setConfirmDeleteId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case "bug":
        return <span className="px-2 py-0.5 rounded text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase">Bug</span>;
      case "feature_request":
        return <span className="px-2 py-0.5 rounded text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase">Feature</span>;
      case "incorrect_job":
        return <span className="px-2 py-0.5 rounded text-[8px] bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase">Incorrect Job</span>;
      case "resume_parsing":
        return <span className="px-2 py-0.5 rounded text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase">Parsing</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[8px] bg-[#27272a] text-[#a1a1aa] font-bold uppercase">Report</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
          Platform Reports & Support Tickets
        </h2>
        <p className="text-xs text-[#a1a1aa] mt-1">Audit bug reports, feature requests, resume compilation errors, or incorrect job flags.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#18181b]/30 p-4 rounded-2xl border border-[#27272a]/60">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports by title..."
            className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }}
          className="bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-4 py-2.5 rounded-xl outline-none transition-all touch-auto"
        >
          <option value="">All Categories</option>
          <option value="bug">Bug Reports</option>
          <option value="feature_request">Feature Requests</option>
          <option value="incorrect_job">Incorrect Jobs</option>
          <option value="resume_parsing">Parsing Issues</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-4 py-2.5 rounded-xl outline-none transition-all touch-auto"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Reports Table grid */}
      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 overflow-hidden shadow-sm">
        {loading && reports.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs text-[#a1a1aa]">Fetching support tickets...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-[#71717a]">No reports recorded yet.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                  <th className="px-6 py-4">Title & User</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Reported Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/40 text-xs">
                {reports.map((rep) => (
                  <tr
                    key={rep._id}
                    onClick={() => setSelectedReport(rep)}
                    className="hover:bg-[#18181b]/40 transition-colors cursor-pointer group"
                  >
                    {/* Title */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="font-bold text-[#e4e4e7] group-hover:text-indigo-400 transition-colors">{rep.title}</p>
                        <p className="text-[10px] text-[#71717a]">{rep.userId ? rep.userId.fullName : "Guest User"}</p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      {getReportTypeBadge(rep.type)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                        rep.status === "resolved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {rep.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-[#71717a] font-medium tabular-nums">
                      {new Date(rep.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleResolveReport(rep)}
                          title={rep.status === "resolved" ? "Mark Pending" : "Mark Resolved"}
                          className={`p-1.5 rounded-lg border transition-all touch-auto ${
                            rep.status === "resolved"
                              ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          }`}
                        >
                          {rep.status === "resolved" ? <HelpCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(rep._id)}
                          title="Delete Ticket"
                          className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-all touch-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
            <span className="text-[10px] text-[#71717a] font-semibold uppercase">Total: {total} tickets</span>
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

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="absolute inset-0 bg-black/60"
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl relative z-10 glow-card"
            >
              <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]/40">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#f4f4f5]">Report Inspector</span>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 rounded-lg text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#27272a]/40 border border-transparent transition-all touch-auto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Title */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getReportTypeBadge(selectedReport.type)}
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                      selectedReport.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {selectedReport.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#e4e4e7] pt-1">{selectedReport.title}</h4>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">Description</p>
                  <p className="p-3 bg-[#09090b]/60 border border-[#27272a]/60 rounded-xl text-[#a1a1aa] leading-relaxed break-words whitespace-pre-line">
                    {selectedReport.description}
                  </p>
                </div>

                {/* Associated details */}
                <div className="space-y-2.5 pt-2 border-t border-[#27272a]/60">
                  <div className="flex items-center gap-2 text-[#71717a]">
                    <User className="w-3.5 h-3.5" />
                    <span className="font-semibold">Reporter:</span>
                    <span className="text-[#a1a1aa]">{selectedReport.userId ? `${selectedReport.userId.fullName} (${selectedReport.userId.email})` : "Guest User"}</span>
                  </div>

                  {selectedReport.jobId && (
                    <div className="flex items-center gap-2 text-[#71717a]">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span className="font-semibold">Linked Job:</span>
                      <span className="text-[#a1a1aa] font-bold">{selectedReport.jobId.title} ({selectedReport.jobId.company})</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[#71717a]">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="font-semibold">Report Date:</span>
                    <span className="text-[#a1a1aa] tabular-nums">{new Date(selectedReport.createdAt).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Footer controls */}
              <div className="px-6 py-4 border-t border-[#27272a] bg-[#18181b]/30 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a]/50 transition-all touch-auto"
                >
                  Close
                </button>
                <button
                  onClick={() => { handleResolveReport(selectedReport); }}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all border flex items-center gap-1.5 touch-auto ${
                    selectedReport.status === "resolved"
                      ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {selectedReport.status === "resolved" ? "Mark Unresolved" : "Resolve"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation delete modal */}
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

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl relative z-10 p-6 space-y-4 glow-card"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#f4f4f5]">Delete Ticket</h4>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Are you sure you want to permanently delete this report ticket? This cannot be undone.
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
                  onClick={handleDeleteReport}
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
