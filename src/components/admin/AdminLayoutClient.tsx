"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  FileText,
  BarChart3,
  AlertTriangle,
  Activity,
  Settings as SettingsIcon,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  Calendar,
  Check,
  Loader2,
  Shield,
  Mail,
  CreditCard,
} from "lucide-react";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  adminUser: {
    fullName: string;
    email: string;
    profileImage: string;
  };
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
}

interface SearchResult {
  users: Array<{ id: string; name: string; email: string }>;
  jobs: Array<{ id: string; title: string; company: string }>;
  reports: Array<{ id: string; title: string; type: string }>;
  companies: Array<{ id: string; name: string; careerUrl: string }>;
}

export default function AdminLayoutClient({ children, adminUser }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const notificationRef = useRef<HTMLDivElement>(null);

  // Sidebar links
  const links = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Admins", href: "/admin/admins", icon: Shield },
    { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
    { name: "Companies", href: "/admin/companies", icon: Building2 },
    { name: "Resume & AI", href: "/admin/resume-ai", icon: FileText },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Billing", href: "/admin/billing", icon: CreditCard },
    { name: "Reports", href: "/admin/reports", icon: AlertTriangle },
    { name: "Activity Logs", href: "/admin/activity-logs", icon: Activity },
    { name: "Contact Messages", href: "/admin/contact-messages", icon: Mail },
    { name: "Settings", href: "/admin/settings", icon: SettingsIcon },
  ];

  // Breadcrumbs
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg) => {
      const formatted = seg
        .replace("-", " ")
        .replace("ai", "AI")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return formatted;
    });
  };

  const breadcrumbs = getBreadcrumbs();

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (err) {
      console.error("Failed to load admin notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch(`/api/admin/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Search trigger
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(null);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/global-search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleResultClick = (route: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(route);
  };

  return (
    <div className="dark bg-[#09090b] text-[#f4f4f5] h-screen overflow-hidden flex flex-col lg:flex-row antialiased w-full font-sans">
      {/* Sidebar Mobile Toggle Header */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-[#09090b]/80 backdrop-blur-md border-b border-[#27272a] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">JobFusion Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors rounded-lg bg-[#18181b]/50 border border-[#27272a] touch-auto"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {(sidebarOpen || !sidebarOpen) && (
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#09090b] border-r border-[#27272a] flex flex-col h-screen overflow-hidden transform lg:translate-x-0 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Logo */}
            <div className="px-6 py-6 border-b border-[#27272a]/60 hidden lg:flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/10">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight">JobFusion</h1>
                <p className="text-[9px] text-[#a1a1aa] font-semibold uppercase tracking-wider">Operations Dashboard</p>
              </div>
            </div>

            {/* Links */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin">
              {links.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/admin/dashboard");
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                      active
                        ? "bg-[#18181b] border border-[#27272a] text-[#ffffff] shadow-inner"
                        : "text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#18181b]/40 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${active ? "text-indigo-400" : "text-[#71717a]"}`} />
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Profile Menu Bottom */}
            <div className="p-4 border-t border-[#27272a]/60 bg-[#09090b]/50">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181b]/30 border border-[#27272a]/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-indigo-950 border border-indigo-500/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {adminUser.profileImage ? (
                      <img src={adminUser.profileImage} alt={adminUser.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-indigo-400">{adminUser.fullName[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#f4f4f5] truncate max-w-[120px]">{adminUser.fullName}</p>
                    <p className="text-[9px] text-[#71717a] font-semibold uppercase tracking-wider">Admin</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-[#71717a] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all touch-auto"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-[#27272a] bg-[#09090b]/75 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          {/* Left: Breadcrumbs & Date */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#71717a] font-medium">
              <span className="hover:text-[#a1a1aa] transition-colors">Admin</span>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb}>
                  <ChevronRight className="w-3.5 h-3.5 text-[#3f3f46]" />
                  <span className={idx === breadcrumbs.length - 1 ? "text-indigo-400 font-semibold" : ""}>{crumb}</span>
                </React.Fragment>
              ))}
            </div>
            <div className="h-4 w-[1px] bg-[#27272a] hidden sm:block" />
            <div className="flex items-center gap-1 text-[11px] text-[#a1a1aa] font-medium tabular-nums">
              <Calendar className="w-3.5 h-3.5 text-[#71717a]" />
              <span>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Right: Search, Notifications */}
          <div className="flex items-center gap-2">
            {/* Search Box Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#18181b]/50 border border-[#27272a] text-[#71717a] hover:text-[#a1a1aa] hover:border-[#3f3f46] transition-all text-xs w-44 md:w-56 text-left touch-auto"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="flex-1">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#27272a] text-[9px] font-mono text-[#a1a1aa]">⌘K</kbd>
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#18181b]/60 border border-[#27272a]/50 rounded-xl transition-all relative touch-auto"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse-ring" />
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl bg-[#09090b] border border-[#27272a] shadow-xl overflow-hidden z-50 glow-card"
                  >
                    <div className="px-4 py-3 border-b border-[#27272a]/80 flex items-center justify-between bg-[#18181b]/20">
                      <span className="text-xs font-bold text-[#f4f4f5]">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-[#27272a]/40 scrollbar-thin">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-[#71717a] p-6 text-center">No notifications yet.</p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`p-3.5 transition-colors ${
                              notif.isRead ? "hover:bg-[#18181b]/20" : "bg-indigo-500/[0.02] hover:bg-indigo-500/[0.04]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={`text-xs ${notif.isRead ? "text-[#a1a1aa]" : "text-[#f4f4f5] font-bold"}`}>
                                  {notif.title}
                                </p>
                                <p className="text-[10px] text-[#71717a] mt-0.5 leading-relaxed">{notif.message}</p>
                                <span className="text-[8px] text-[#3f3f46] mt-1 block">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {!notif.isRead && (
                                <button
                                  onClick={() => markAsRead(notif._id)}
                                  className="p-1 rounded bg-indigo-500/10 text-indigo-400 hover:bg-[#18181b] transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Global Search Modal */}
        <AnimatePresence>
          {searchOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 sm:px-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchOpen(false)}
                className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-lg bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl z-10 glow-card"
              >
                <div className="p-4 border-b border-[#27272a]/60 flex items-center gap-3">
                  <Search className="w-4 h-4 text-[#71717a]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users, jobs, reports, companies..."
                    className="flex-1 bg-transparent text-sm text-[#f4f4f5] border-none outline-none placeholder-[#71717a] w-full"
                    autoFocus
                  />
                  {searchLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="p-1 text-[#71717a] hover:text-[#f4f4f5] rounded bg-[#27272a]/50 border border-[#27272a]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto p-2 space-y-4 scrollbar-thin">
                  {!searchQuery && (
                    <p className="text-xs text-[#71717a] py-8 text-center">Type search queries to start searching...</p>
                  )}
                  {searchQuery && !searchLoading && !searchResults && (
                    <p className="text-xs text-[#71717a] py-8 text-center">No results found.</p>
                  )}
                  {searchResults && (
                    <>
                      {/* Users Section */}
                      {searchResults.users?.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider px-3 mb-1">Users</p>
                          <div className="space-y-0.5">
                            {searchResults.users.map((user) => (
                              <button
                                key={user.id}
                                onClick={() => handleResultClick("/admin/users")}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#27272a]/40 transition-colors flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-[#e4e4e7]">{user.name}</span>
                                <span className="text-[#71717a]">{user.email}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Jobs Section */}
                      {searchResults.jobs?.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider px-3 mb-1">Jobs</p>
                          <div className="space-y-0.5">
                            {searchResults.jobs.map((job) => (
                              <button
                                key={job.id}
                                onClick={() => handleResultClick("/admin/jobs")}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#27272a]/40 transition-colors flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-[#e4e4e7]">{job.title}</span>
                                <span className="text-[#71717a]">{job.company}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Companies Section */}
                      {searchResults.companies?.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider px-3 mb-1">Companies</p>
                          <div className="space-y-0.5">
                            {searchResults.companies.map((company) => (
                              <button
                                key={company.id}
                                onClick={() => handleResultClick("/admin/companies")}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#27272a]/40 transition-colors flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-[#e4e4e7]">{company.name}</span>
                                <span className="text-[#71717a] truncate max-w-[150px]">{company.careerUrl}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reports Section */}
                      {searchResults.reports?.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider px-3 mb-1">Reports</p>
                          <div className="space-y-0.5">
                            {searchResults.reports.map((report) => (
                              <button
                                key={report.id}
                                onClick={() => handleResultClick("/admin/reports")}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#27272a]/40 transition-colors flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-[#e4e4e7]">{report.title}</span>
                                <span className="text-indigo-400 capitalize bg-indigo-500/10 px-2 py-0.5 rounded-full text-[9px]">
                                  {report.type.replace("_", " ")}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Scrollable Sub-Page Render Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
