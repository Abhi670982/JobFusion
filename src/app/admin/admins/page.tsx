"use client";

import { useState, useEffect } from "react";
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  Trash2,
  Plus,
  Loader2,
  AlertTriangle,
  X,
  Activity,
  CheckCircle,
  Clock,
  Mail,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface AdminItem {
  _id: string;
  fullName: string;
  email: string;
  profileImage: string;
  role: string;
  status: string;
  createdAt: string;
}

interface AdminActivityLog {
  _id: string;
  action: string;
  details: string;
  createdAt: string;
  ipAddress: string;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Invite modal states
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStep, setInviteStep] = useState(1); // 1 = input, 2 = confirming/submitting
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Activity drawer state
  const [selectedAdmin, setSelectedAdmin] = useState<AdminItem | null>(null);
  const [adminActivities, setAdminActivities] = useState<AdminActivityLog[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Action states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/admins?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchAdmins();
    }, 400);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Toast auto-clear
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const loadAdminActivities = async (admin: AdminItem) => {
    setSelectedAdmin(admin);
    setActivitiesLoading(true);
    setAdminActivities([]);
    try {
      // Query Activity model filtered by this admin's email and userId
      const res = await fetch(`/api/admin/activity-logs?q=${encodeURIComponent(admin.email)}`);
      const data = await res.json();
      if (data.success) {
        // filter client-side for strictness if needed, or map direct
        setAdminActivities(data.data.activities);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    setInviteError("");
    setInviteMsg("");
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteMsg(data.message || "User promoted successfully!");
        setInviteStep(2);
        setSuccessToast("New admin successfully added.");
        fetchAdmins();
      } else {
        setInviteError(data.error || "Verification checks failed.");
      }
    } catch (err: any) {
      setInviteError(err.message || "Inviting request failed.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleToggleStatus = async (user: AdminItem) => {
    const targetStatus = user.status === "suspended" ? "active" : "suspended";
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/admins/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setAdmins((prev) =>
          prev.map((a) => (a._id === user._id ? { ...a, status: targetStatus } : a))
        );
        setSuccessToast(`Admin account successfully ${targetStatus === "suspended" ? "suspended" : "activated"}.`);
        if (selectedAdmin?._id === user._id) {
          setSelectedAdmin({ ...selectedAdmin, status: targetStatus });
        }
      } else {
        alert(data.error || "Failed to toggle status.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!confirmDeleteId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/admins/${confirmDeleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAdmins((prev) => prev.filter((a) => a._id !== confirmDeleteId));
        setSuccessToast("Admin demoted to jobseeker successfully.");
        if (selectedAdmin?._id === confirmDeleteId) {
          setSelectedAdmin(null);
        }
        setConfirmDeleteId(null);
      } else {
        alert(data.error || "Failed to remove admin access.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "suspended") {
      return <span className="px-2 py-0.5 rounded text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase">Suspended</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">Active</span>;
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
            Admins & Access Control
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1">Audit platform credentials, invite team members, suspend access, or inspect audit histories.</p>
        </div>
        <button
          onClick={() => {
            setInviteEmail("");
            setInviteStep(1);
            setInviteError("");
            setInviteMsg("");
            setInviteOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/10 transition-all touch-auto"
        >
          <Plus className="w-4 h-4" />
          Invite Admin
        </button>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl shadow-xl"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#18181b]/30 p-4 rounded-2xl border border-[#27272a]/60">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search admins by name or email..."
            className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 overflow-hidden shadow-sm">
        {loading && admins.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs text-[#a1a1aa]">Fetching admin logs...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-[#71717a]">No admin accounts matching query found.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Promoted At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/40 text-xs">
                {admins.map((ad) => (
                  <tr
                    key={ad._id}
                    onClick={() => loadAdminActivities(ad)}
                    className="hover:bg-[#18181b]/40 transition-colors cursor-pointer group"
                  >
                    {/* Admin Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-indigo-500/20 overflow-hidden flex-shrink-0 bg-[#09090b] flex items-center justify-center">
                          {ad.profileImage ? (
                            <img src={ad.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-semibold text-indigo-400">{ad.fullName[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[#e4e4e7] group-hover:text-indigo-400 transition-colors">{ad.fullName}</p>
                          <p className="text-[10px] text-[#71717a] mt-0.5">{ad.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {getStatusBadge(ad.status)}
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-[#71717a] font-medium tabular-nums">
                      {new Date(ad.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(ad)}
                          title={ad.status === "suspended" ? "Activate Access" : "Suspend Access"}
                          className={`p-1.5 rounded-lg border transition-all touch-auto ${
                            ad.status === "suspended"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                          }`}
                        >
                          {ad.status === "suspended" ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(ad._id)}
                          title="Remove Admin Role"
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
      </div>

      {/* Slide Drawer Audit Log Details */}
      <AnimatePresence>
        {selectedAdmin && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAdmin(null)}
              className="fixed inset-0 z-40 bg-black/60"
            />

            {/* Slide menu */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#09090b] border-l border-[#27272a] shadow-2xl flex flex-col h-screen overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]/20">
                <div className="flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-sm font-bold text-[#f4f4f5]">Audit Log Inspector</span>
                </div>
                <button
                  onClick={() => setSelectedAdmin(null)}
                  className="p-1.5 rounded-lg text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#18181b]/50 border border-transparent transition-all touch-auto"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {/* Admin metadata card */}
                <div className="p-4 rounded-xl border border-[#27272a]/80 bg-[#18181b]/10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-indigo-500/20 overflow-hidden flex-shrink-0 bg-[#09090b] flex items-center justify-center">
                    {selectedAdmin.profileImage ? (
                      <img src={selectedAdmin.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-indigo-400">{selectedAdmin.fullName[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#f4f4f5] truncate">{selectedAdmin.fullName}</h4>
                    <p className="text-[10px] text-[#71717a] mt-0.5 truncate">{selectedAdmin.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {getStatusBadge(selectedAdmin.status)}
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold capitalize">
                        Admin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit trail */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Audit Trail Logs</h5>
                  {activitiesLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                      <p className="text-xs text-[#a1a1aa]">Fetching operations trail...</p>
                    </div>
                  ) : adminActivities.length === 0 ? (
                    <p className="text-xs text-[#71717a] italic pl-2">No admin actions recorded for this account.</p>
                  ) : (
                    <div className="space-y-3.5 border-l-2 border-[#27272a]/80 pl-4 ml-2.5">
                      {adminActivities.map((act) => (
                        <div key={act._id} className="relative space-y-1 text-xs">
                          {/* Dot indicator */}
                          <span className="absolute -left-[23px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 border border-[#09090b]" />
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-[#e4e4e7]">{act.action || "Performed action"}</p>
                            <span className="text-[10px] text-[#71717a] font-medium tabular-nums">
                              {new Date(act.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                          <p className="text-[#a1a1aa] leading-relaxed">{act.details}</p>
                          <div className="flex items-center gap-1.5 text-[9px] text-[#71717a] font-medium font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            <span>•</span>
                            <span>IP: {act.ipAddress || "unknown"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Invite Admin Modal Wizard */}
      <AnimatePresence>
        {inviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!inviteLoading) setInviteOpen(false); }}
              className="absolute inset-0 bg-black/60"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl relative z-10 glow-card"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]/40">
                <div className="flex items-center gap-2 text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-bold text-[#f4f4f5]">Invite New Admin</span>
                </div>
                <button
                  onClick={() => setInviteOpen(false)}
                  disabled={inviteLoading}
                  className="p-1 rounded-lg text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#27272a]/40 border border-transparent transition-all touch-auto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleInviteAdmin} className="p-6 space-y-4">
                {inviteStep === 1 ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#e4e4e7] block flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-indigo-400" /> User's Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter JobFusion account email..."
                        className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
                      />
                      <p className="text-[10px] text-[#71717a] leading-normal pt-1">
                        System will verify if the email corresponds to an existing, verified, and active JobFusion user account before granting access.
                      </p>
                    </div>

                    {inviteError && (
                      <div className="flex items-start gap-2 p-3.5 rounded-xl border border-red-500/10 bg-red-500/[0.02] text-xs font-semibold text-red-400 leading-normal">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{inviteError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setInviteOpen(false)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a]/50 transition-all touch-auto"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={inviteLoading || !inviteEmail}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 touch-auto"
                      >
                        {inviteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Promote to Admin
                      </button>
                    </div>
                  </>
                ) : (
                  // Success State
                  <div className="text-center py-4 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-[#f4f4f5]">Promotion Complete!</h4>
                      <p className="text-xs text-[#a1a1aa] leading-relaxed max-w-xs mx-auto">
                        {inviteMsg}
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setInviteOpen(false)}
                        className="px-5 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-[#e4e4e7] text-xs font-bold rounded-xl transition-all touch-auto"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Delete / Demote Dialog */}
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
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#f4f4f5]">Demote Admin Account</h4>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Are you sure you want to remove admin access for this account? Their role will be demoted to a regular jobseeker and their email address will be removed from the allowlist.
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
                  onClick={handleRemoveAdmin}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 touch-auto"
                >
                  {actionLoading ? <Loader2 className="w-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Demote User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
