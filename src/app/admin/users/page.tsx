"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Trash2,
  Lock,
  Unlock,
  Eye,
  X,
  FileText,
  Briefcase,
  BookOpen,
  Calendar,
  AlertTriangle,
  Loader2,
  UserCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface UserItem {
  _id: string;
  fullName: string;
  email: string;
  profileImage: string;
  role: string;
  status: string;
  createdAt: string;
}

interface UserProfileDetails {
  user: UserItem;
  profile?: {
    headline?: string;
    bio?: string;
    skills?: Array<{ name: string; level: number }>;
    location?: string;
    experience?: string;
    resumeUrl?: string;
    resumeName?: string;
    experiences?: Array<{
      _id: string;
      company: string;
      role: string;
      period: string;
      description: string;
    }>;
    education?: Array<{
      _id: string;
      school: string;
      degree: string;
      period: string;
    }>;
  };
  applications: Array<{
    _id: string;
    jobId?: {
      title: string;
      company: string;
    };
    status: string;
    appliedAt: string;
  }>;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Selected User details
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<UserProfileDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Modal / Confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/users?page=${page}&q=${encodeURIComponent(
        search
      )}&status=${statusFilter}&role=${roleFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
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
    fetchUsers();
  }, [page, statusFilter, roleFilter]);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  const loadUserDetails = async (user: UserItem) => {
    setSelectedUser(user);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedDetails(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    const targetStatus = user.status === "suspended" ? "active" : "suspended";
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, status: targetStatus } : u))
        );
        if (selectedUser?._id === user._id) {
          loadUserDetails(user);
        }
      } else {
        alert(data.error || "Failed to update account status.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${confirmDeleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== confirmDeleteId));
        if (selectedUser?._id === confirmDeleteId) {
          setSelectedUser(null);
          setSelectedDetails(null);
        }
        setConfirmDeleteId(null);
      } else {
        alert(data.error || "Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
          User Management
        </h2>
        <p className="text-xs text-[#a1a1aa] mt-1">Suspend, activate, delete accounts, or view credentials.</p>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#18181b]/30 p-4 rounded-2xl border border-[#27272a]/60">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-4 py-2.5 rounded-xl outline-none transition-all touch-auto"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }}
          className="bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-4 py-2.5 rounded-xl outline-none transition-all touch-auto"
        >
          <option value="">All Roles</option>
          <option value="jobseeker">Jobseeker</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table grid */}
      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 overflow-hidden shadow-sm">
        {loading && users.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs text-[#a1a1aa]">Fetching users list...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-[#71717a]">No users found matching filters.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registered At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/40 text-xs">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => loadUserDetails(user)}
                    className="hover:bg-[#18181b]/40 transition-colors cursor-pointer group"
                  >
                    {/* User profile info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-[#27272a] overflow-hidden flex-shrink-0 bg-[#09090b] flex items-center justify-center">
                          {user.profileImage ? (
                            <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-semibold text-indigo-400">{user.fullName[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[#e4e4e7] group-hover:text-indigo-400 transition-colors">{user.fullName}</p>
                          <p className="text-[10px] text-[#71717a] mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        user.role === "admin" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-[#27272a] text-[#a1a1aa]"
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        user.status === "suspended" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {user.status}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td className="px-6 py-4 text-[#71717a] font-medium tabular-nums">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          title={user.status === "suspended" ? "Activate Account" : "Suspend Account"}
                          className={`p-1.5 rounded-lg border transition-all touch-auto ${
                            user.status === "suspended"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                          }`}
                        >
                          {user.status === "suspended" ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(user._id)}
                          title="Delete Account"
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
            <span className="text-[10px] text-[#71717a] font-semibold uppercase">Total: {total} accounts</span>
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

      {/* Slide Drawer Profile Details */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 z-40 bg-black/60"
            />

            {/* Slide menu */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#09090b] border-l border-[#27272a] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]/20">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-sm font-bold text-[#f4f4f5]">Profile Inspector</span>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 rounded-lg text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#18181b]/50 border border-transparent transition-all touch-auto"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {detailsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    <p className="text-xs text-[#a1a1aa]">Fetching profile details...</p>
                  </div>
                ) : !selectedDetails ? (
                  <p className="text-xs text-red-400">Failed to load detailed profile specs.</p>
                ) : (
                  <>
                    {/* User header card */}
                    <div className="p-4 rounded-xl border border-[#27272a]/80 bg-[#18181b]/10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border border-indigo-500/20 overflow-hidden flex-shrink-0 bg-[#09090b] flex items-center justify-center">
                        {selectedUser.profileImage ? (
                          <img src={selectedUser.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-indigo-400">{selectedUser.fullName[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#f4f4f5] truncate">{selectedUser.fullName}</h4>
                        <p className="text-[10px] text-[#71717a] mt-0.5 truncate">{selectedUser.email}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold capitalize ${
                            selectedUser.status === "suspended" ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
                          }`}>
                            {selectedUser.status}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-[#18181b] border border-[#27272a] text-[#a1a1aa] font-bold capitalize">
                            {selectedUser.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Headline and Bio */}
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Bio Details</h5>
                      <div className="p-4 rounded-xl border border-[#27272a]/50 bg-[#18181b]/5 space-y-2 text-xs">
                        <p className="font-bold text-[#e4e4e7]">{selectedDetails.profile?.headline || "No headline configured"}</p>
                        <p className="text-[#a1a1aa] leading-relaxed">{selectedDetails.profile?.bio || "No summary provided in profile."}</p>
                      </div>
                    </div>

                    {/* Resume Upload info */}
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Uploaded Resume</h5>
                      {selectedDetails.profile?.resumeUrl ? (
                        <a
                          href={selectedDetails.profile.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3.5 rounded-xl border border-indigo-500/10 hover:border-indigo-500/30 bg-indigo-500/[0.02] text-xs font-semibold text-indigo-400 group transition-all"
                        >
                          <FileText className="w-5 h-5 text-indigo-400 group-hover:scale-105 transition-transform" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[#e4e4e7]">{selectedDetails.profile.resumeName || "resume.pdf"}</p>
                            <p className="text-[9px] text-[#71717a] mt-0.5 font-normal">Click to view/download file</p>
                          </div>
                        </a>
                      ) : (
                        <div className="p-4 border border-dashed border-[#27272a] rounded-xl text-center text-xs text-[#71717a]">
                          No resume uploaded yet.
                        </div>
                      )}
                    </div>

                    {/* Work Experiences */}
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Work Experience</h5>
                      {selectedDetails.profile?.experiences && selectedDetails.profile.experiences.length > 0 ? (
                        <div className="space-y-2">
                          {selectedDetails.profile.experiences.map((exp) => (
                            <div key={exp._id} className="p-3.5 border border-[#27272a]/50 rounded-xl bg-[#18181b]/5 space-y-1">
                              <div className="flex items-start justify-between text-xs">
                                <p className="font-bold text-[#e4e4e7]">{exp.role}</p>
                                <span className="text-[10px] text-[#71717a] font-medium tabular-nums">{exp.period}</span>
                              </div>
                              <p className="text-[10px] text-indigo-400 font-semibold">{exp.company}</p>
                              <p className="text-[10px] text-[#a1a1aa] leading-relaxed pt-1">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#71717a] italic pl-2">No work experiences declared.</p>
                      )}
                    </div>

                    {/* Extracted Skills */}
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Extracted Skills</h5>
                      {selectedDetails.profile?.skills && selectedDetails.profile.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDetails.profile.skills.map((skill) => (
                            <span
                              key={skill.name}
                              className="px-2 py-1 rounded-lg bg-[#18181b] border border-[#27272a] text-[10px] font-semibold text-[#e4e4e7]"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#71717a] italic pl-2">No profile skills cataloged.</p>
                      )}
                    </div>

                    {/* Education */}
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Education</h5>
                      {selectedDetails.profile?.education && selectedDetails.profile.education.length > 0 ? (
                        <div className="space-y-2">
                          {selectedDetails.profile.education.map((edu) => (
                            <div key={edu._id} className="p-3 border border-[#27272a]/50 rounded-xl bg-[#18181b]/5 flex items-start justify-between text-xs">
                              <div>
                                <p className="font-bold text-[#e4e4e7]">{edu.degree}</p>
                                <p className="text-[10px] text-[#71717a] mt-0.5">{edu.school}</p>
                              </div>
                              <span className="text-[9px] text-[#71717a] font-medium tabular-nums">{edu.period}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#71717a] italic pl-2">No education history recorded.</p>
                      )}
                    </div>

                    {/* Applications */}
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Application History</h5>
                      {selectedDetails.applications && selectedDetails.applications.length > 0 ? (
                        <div className="space-y-2">
                          {selectedDetails.applications.map((app) => (
                            <div key={app._id} className="p-3 border border-[#27272a]/50 rounded-xl bg-[#18181b]/5 flex items-center justify-between text-xs">
                              <div className="min-w-0">
                                <p className="font-bold text-[#e4e4e7] truncate">{app.jobId?.title || "Job Posting Unavailable"}</p>
                                <p className="text-[10px] text-[#71717a] truncate mt-0.5">{app.jobId?.company || "Unknown Recruiter"}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  app.status === "Rejected" ? "bg-red-500/10 text-red-400" : app.status === "Offer" ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"
                                }`}>
                                  {app.status}
                                </span>
                                <span className="text-[8px] text-[#71717a] font-medium tabular-nums">
                                  {new Date(app.appliedAt).toLocaleDateString("en-IN")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#71717a] italic pl-2">No job applications submitted.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Delete Dialog */}
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

            {/* Modal Box */}
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
                <h4 className="text-sm font-bold text-[#f4f4f5]">Delete Account</h4>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Are you sure you want to permanently delete this user? This action will cascade delete all profile details, experience entries, and applications history. This cannot be undone.
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
                  onClick={handleDeleteUser}
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
