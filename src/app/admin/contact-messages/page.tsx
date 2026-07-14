'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  Eye,
  Trash2,
  X,
  Calendar,
  AlertTriangle,
  Loader2,
  Mail,
  Check,
  Reply,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ContactMessageItem {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
}

export default function AdminContactMessages() {
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // desc or asc
  const [loading, setLoading] = useState(true);

  // Selected message details for Inspector Drawer
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null);

  // Delete confirmation modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showSuccessToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/contact-messages?page=${page}&q=${encodeURIComponent(
        search
      )}&status=${statusFilter}&sort=${sortOrder}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages);
        setTotal(data.data.total);
        setPages(data.data.pages);
      }
    } catch (err) {
      console.error('Failed to load contact messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, statusFilter, sortOrder]);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      fetchMessages();
    }, 450);
    return () => clearTimeout(delay);
  }, [search]);

  // Mark message status
  const handleUpdateStatus = async (msg: ContactMessageItem, targetStatus: 'read' | 'replied') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: msg._id, status: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...m, status: targetStatus } : m))
        );
        if (selectedMessage?._id === msg._id) {
          setSelectedMessage({ ...selectedMessage, status: targetStatus });
        }
        showSuccessToast(`Message status updated to '${targetStatus}'`);
      } else {
        alert(data.error || 'Failed to update message status.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async () => {
    if (!confirmDeleteId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/contact-messages?id=${confirmDeleteId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m._id !== confirmDeleteId));
        if (selectedMessage?._id === confirmDeleteId) {
          setSelectedMessage(null);
        }
        setConfirmDeleteId(null);
        showSuccessToast('Contact message deleted successfully.');
      } else {
        alert(data.error || 'Failed to delete message.');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Contact Messages
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1">Review user support inquiries, mark statuses, or remove messages.</p>
        </div>
      </div>

      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2 p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] text-xs font-semibold text-emerald-400"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{toastMessage}</span>
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
            placeholder="Search inquiries by name, email, subject, keyword..."
            className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-4 py-2.5 rounded-xl outline-none transition-all touch-auto"
        >
          <option value="">All Statuses</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>

        {/* Date Sort Order */}
        <select
          value={sortOrder}
          onChange={(e) => {
            setPage(1);
            setSortOrder(e.target.value);
          }}
          className="bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-4 py-2.5 rounded-xl outline-none transition-all touch-auto"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {/* Table grid */}
      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 overflow-hidden shadow-sm">
        {loading && messages.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs text-[#a1a1aa]">Fetching inquiries list...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-[#71717a]">No contact inquiries found matching filters.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                  <th className="px-6 py-4">Sender</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/40 text-xs">
                {messages.map((msg) => (
                  <tr
                    key={msg._id}
                    onClick={() => setSelectedMessage(msg)}
                    className="hover:bg-[#18181b]/40 transition-colors cursor-pointer group"
                  >
                    {/* Sender */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-[#e4e4e7] group-hover:text-indigo-400 transition-colors">
                          {msg.name}
                        </p>
                        <p className="text-[10px] text-[#71717a] mt-0.5">{msg.email}</p>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="px-6 py-4 max-w-[240px] truncate text-[#e4e4e7] font-semibold">
                      {msg.subject}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          msg.status === 'unread'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : msg.status === 'read'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {msg.status}
                      </span>
                    </td>

                    {/* Submitted Date */}
                    <td className="px-6 py-4 text-[#71717a] font-medium tabular-nums">
                      {new Date(msg.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedMessage(msg)}
                          title="View Details"
                          className="p-1.5 bg-[#18181b]/60 hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#f4f4f5] border border-[#27272a]/60 rounded-lg transition-all touch-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {msg.status !== 'read' && msg.status !== 'replied' && (
                          <button
                            onClick={() => handleUpdateStatus(msg, 'read')}
                            title="Mark Read"
                            className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg transition-all touch-auto"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {msg.status !== 'replied' && (
                          <button
                            onClick={() => handleUpdateStatus(msg, 'replied')}
                            title="Mark Replied"
                            className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg transition-all touch-auto"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDeleteId(msg._id)}
                          title="Delete Message"
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

        {/* Pagination Footer */}
        {pages > 1 && (
          <div className="px-6 py-4 border-t border-[#27272a]/60 bg-[#18181b]/10 flex items-center justify-between">
            <span className="text-[10px] text-[#71717a] font-semibold uppercase">Total: {total} messages</span>
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

      {/* Slide Drawer Message Details Inspector */}
      <AnimatePresence>
        {selectedMessage && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMessage(null)}
              className="fixed inset-0 z-40 bg-black/60"
            />

            {/* Slide Menu Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#09090b] border-l border-[#27272a] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]/20">
                <div className="flex items-center gap-2">
                  <Mail className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-sm font-bold text-[#f4f4f5]">Inquiry details</span>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1.5 rounded-lg text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#18181b]/50 border border-transparent transition-all touch-auto"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {/* Sender card */}
                <div className="p-4 rounded-xl border border-[#27272a]/80 bg-[#18181b]/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#f4f4f5]">{selectedMessage.name}</h4>
                    <p className="text-[10px] text-[#71717a] mt-0.5">{selectedMessage.email}</p>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold capitalize ${
                      selectedMessage.status === 'unread'
                        ? 'bg-rose-500/15 text-rose-400'
                        : selectedMessage.status === 'read'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-emerald-500/15 text-emerald-400'
                    }`}
                  >
                    {selectedMessage.status}
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-4">
                  {/* Subject */}
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Subject</h5>
                    <p className="text-xs text-[#e4e4e7] font-semibold bg-[#18181b]/10 p-3 rounded-xl border border-[#27272a]/40">
                      {selectedMessage.subject}
                    </p>
                  </div>

                  {/* Submission date */}
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Submitted At</h5>
                    <p className="text-xs text-[#e4e4e7] bg-[#18181b]/10 p-3 rounded-xl border border-[#27272a]/40 font-medium">
                      {new Date(selectedMessage.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'full',
                        timeStyle: 'medium',
                      })}
                    </p>
                  </div>

                  {/* Message body */}
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Message</h5>
                    <div className="p-4 rounded-xl border border-[#27272a]/50 bg-[#18181b]/5 text-xs text-[#a1a1aa] leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedMessage.message}
                    </div>
                  </div>
                </div>

                {/* Actions inside drawer */}
                <div className="pt-6 border-t border-[#27272a]/60 space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Manage Status</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedMessage.status !== 'read' && selectedMessage.status !== 'replied' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedMessage, 'read')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-40 touch-auto"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Read
                      </button>
                    )}
                    {selectedMessage.status !== 'replied' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedMessage, 'replied')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-40 touch-auto"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        Mark Replied
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDeleteId(selectedMessage._id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-40 touch-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Message
                    </button>
                  </div>
                </div>
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
                <h4 className="text-sm font-bold text-[#f4f4f5]">Delete Inquiry</h4>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Are you sure you want to permanently delete this contact message? This action cannot be undone.
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
                  onClick={handleDeleteMessage}
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
