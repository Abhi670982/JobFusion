"use client";

import { useState, useEffect } from "react";
import {
  Search,
  User,
  Loader2,
} from "lucide-react";

interface ActivityLogItem {
  _id: string;
  userId: {
    fullName: string;
    email: string;
    profileImage: string;
  } | null;
  type: string;
  jobTitle?: string;
  company?: string;
  details?: string;
  createdAt: string;
}

export default function AdminActivityLogs() {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/activity-logs?page=${page}&limit=15&q=${encodeURIComponent(
        search
      )}&type=${typeFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setActivities(data.data.activities);
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
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter]);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      fetchActivities();
    }, 400);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const getActivityTypeStyles = (type: string) => {
    switch (type) {
      case "admin_action":
        return { label: "admin action", color: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" };
      case "failed_login":
        return { label: "failed login", color: "bg-red-500/10 text-red-400 border border-red-500/20" };
      case "system_event":
        return { label: "system event", color: "bg-teal-500/10 text-teal-400 border border-teal-500/20" };
      case "applied":
        return { label: "applied job", color: "bg-pink-500/10 text-pink-400 border border-pink-500/20" };
      case "saved":
        return { label: "saved job", color: "bg-rose-500/10 text-rose-400 border border-rose-500/20" };
      case "updated_resume":
        return { label: "resume upload", color: "bg-purple-500/10 text-purple-400 border border-purple-500/20" };
      case "registered":
        return { label: "registered", color: "bg-blue-500/10 text-blue-400 border border-blue-500/20" };
      default:
        return { label: type.replace("_", " "), color: "bg-[#27272a] text-[#a1a1aa]" };
    }
  };

  const formatActivityMessage = (act: ActivityLogItem) => {
    if (act.type === "applied") {
      return `Applied to '${act.jobTitle || "Job"}' position at '${act.company || "Company"}'`;
    }
    if (act.type === "saved") {
      return `Saved '${act.jobTitle || "Job"}' vacancy at '${act.company || "Company"}'`;
    }
    if (act.type === "updated_resume") {
      return act.details || "Uploaded and parsed resume";
    }
    return act.details || act.type.replace("_", " ");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
          Audit Trail & Activity Logs
        </h2>
        <p className="text-xs text-[#a1a1aa] mt-1">Track comprehensive user events, login records, and administrative updates.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#18181b]/30 p-4 rounded-2xl border border-[#27272a]/60">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities by detail or user name..."
            className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
          />
        </div>

        {/* Log Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }}
          className="bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-4 py-2.5 rounded-xl outline-none transition-all touch-auto"
        >
          <option value="">All Event Logs</option>
          <option value="admin_action">Admin Actions</option>
          <option value="registered">New Signups</option>
          <option value="updated_resume">Resume Uploads</option>
          <option value="applied">Job Applications</option>
          <option value="saved">Saved Jobs</option>
          <option value="failed_login">Failed Logins</option>
          <option value="system_event">System Events</option>
        </select>
      </div>

      {/* Logs Display */}
      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 overflow-hidden shadow-sm">
        {loading && activities.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs text-[#a1a1aa]">Fetching operations log history...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-[#71717a]">No activity logs found.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                  <th className="px-6 py-4">User / Actor</th>
                  <th className="px-6 py-4">Event Type</th>
                  <th className="px-6 py-4">Activity Message</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/40 text-xs">
                {activities.map((act) => {
                  const typeStyles = getActivityTypeStyles(act.type);
                  return (
                    <tr key={act._id} className="hover:bg-[#18181b]/40 transition-colors">
                      {/* Actor */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7.5 h-7.5 rounded-full border border-[#27272a]/60 bg-[#09090b] overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {act.userId?.profileImage ? (
                              <img src={act.userId.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-[#71717a]" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#e4e4e7]">{act.userId ? act.userId.fullName : "System"}</p>
                            <p className="text-[9px] text-[#71717a]">{act.userId ? act.userId.email : "automation"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${typeStyles.color}`}>
                          {typeStyles.label}
                        </span>
                      </td>

                      {/* Message */}
                      <td className="px-6 py-4 text-[#a1a1aa] leading-normal font-medium max-w-sm truncate" title={formatActivityMessage(act)}>
                        {formatActivityMessage(act)}
                      </td>

                      {/* Time */}
                      <td className="px-6 py-4 text-right text-[#71717a] font-medium tabular-nums text-[11px] space-y-0.5">
                        <p>{new Date(act.createdAt).toLocaleDateString("en-IN")}</p>
                        <p className="text-[9px] text-[#52525b] font-semibold">
                          {new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {pages > 1 && (
          <div className="px-6 py-4 border-t border-[#27272a]/60 bg-[#18181b]/10 flex items-center justify-between">
            <span className="text-[10px] text-[#71717a] font-semibold uppercase">Total: {total} log entries</span>
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
    </div>
  );
}
