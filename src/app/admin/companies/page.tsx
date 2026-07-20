"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Building2,
  Globe,
  Loader2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from "lucide-react";

interface CompanyItem {
  _id: string;
  name: string;
  careerUrl: string;
  crawlStatus: "idle" | "crawling" | "failed" | "success";
  lastSync: string | null;
  jobsFound: number;
  lastError: string | null;
  isEnabled: boolean;
}

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [enabledFilter, setEnabledFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/companies?page=${page}&q=${encodeURIComponent(
        search
      )}&isEnabled=${enabledFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCompanies(data.data.companies);
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
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, enabledFilter]);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      fetchCompanies();
    }, 400);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Toggle company enabled/disabled state
  const handleToggleEnable = async (company: CompanyItem) => {
    setActionLoadingId(company._id);
    const targetState = !company.isEnabled;
    try {
      const res = await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company._id, isEnabled: targetState }),
      });
      const data = await res.json();
      if (data.success) {
        setCompanies((prev) =>
          prev.map((c) => (c._id === company._id ? { ...c, isEnabled: targetState } : c))
        );
      } else {
        alert(data.error || "Failed to update company setting.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getCrawlStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">Success</span>;
      case "crawling":
        return <span className="px-2 py-0.5 rounded text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase animate-pulse">Crawling</span>;
      case "failed":
        return <span className="px-2 py-0.5 rounded text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase">Failed</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[8px] bg-[#27272a] text-[#a1a1aa] font-bold uppercase">Idle</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
          Company Careers Crawl Settings
        </h2>
        <p className="text-xs text-[#a1a1aa] mt-1">Configure crawling urls, inspect crawler success history, and enable/disable scrapers.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#18181b]/30 p-4 rounded-2xl border border-[#27272a]/60">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies by name..."
            className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
          />
        </div>

        {/* Enabled status filter */}
        <select
          value={enabledFilter}
          onChange={(e) => { setPage(1); setEnabledFilter(e.target.value); }}
          className="bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-4 py-2.5 rounded-xl outline-none transition-all touch-auto"
        >
          <option value="">All Crawler States</option>
          <option value="true">Active Crawls</option>
          <option value="false">Disabled Crawls</option>
        </select>
      </div>

      {/* Companies table grid */}
      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 overflow-hidden shadow-sm">
        {loading && companies.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs text-[#a1a1aa]">Fetching crawled company profiles...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-[#71717a]">No company profiles found.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Career Page Url</th>
                  <th className="px-6 py-4">Crawl Status</th>
                  <th className="px-6 py-4">Jobs Indexed</th>
                  <th className="px-6 py-4">Last Sync</th>
                  <th className="px-6 py-4 text-right font-bold">Crawl Enable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/40 text-xs">
                {companies.map((company) => (
                  <tr key={company._id} className="hover:bg-[#18181b]/40 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg border border-[#27272a] bg-[#09090b] flex items-center justify-center flex-shrink-0 text-indigo-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-[#e4e4e7]">{company.name}</span>
                      </div>
                    </td>

                    {/* Career Url */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] font-medium">
                        <Globe className="w-3.5 h-3.5 text-[#71717a]" />
                        <span className="truncate max-w-[180px]" title={company.careerUrl}>{company.careerUrl}</span>
                        <a
                          href={company.careerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-[#71717a] hover:text-[#f4f4f5] rounded hover:bg-[#18181b]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* Crawl Status */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {getCrawlStatusBadge(company.crawlStatus)}
                        {company.lastError && (
                          <p className="text-[9px] text-red-400 truncate max-w-[120px] font-mono" title={company.lastError}>
                            {company.lastError}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Jobs Found */}
                    <td className="px-6 py-4 font-bold text-[#e4e4e7] tabular-nums">
                      {company.jobsFound}
                    </td>

                    {/* Last Sync */}
                    <td className="px-6 py-4 text-[#71717a] font-medium tabular-nums">
                      {company.lastSync
                        ? new Date(company.lastSync).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Never"}
                    </td>

                    {/* Crawl Switch */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleEnable(company)}
                        disabled={actionLoadingId === company._id}
                        className="p-1 rounded-xl text-[#71717a] hover:text-[#f4f4f5] transition-all disabled:opacity-50 touch-auto"
                      >
                        {actionLoadingId === company._id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        ) : company.isEnabled ? (
                          <ToggleRight className="w-8 h-8 text-indigo-400" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-[#52525b]" />
                        )}
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
            <span className="text-[10px] text-[#71717a] font-semibold uppercase">Total: {total} companies</span>
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
