'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, FileText, Settings,
  ChevronLeft, ChevronRight, Bookmark, HelpCircle, Sparkles
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { fetchCurrentUser, fetchSavedJobs, DbUser } from '@/lib/api-helper';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/dashboard',         label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/jobs',              label: 'Find Jobs',         icon: Briefcase },
  { href: '/jobs/saved',        label: 'Saved Jobs',        icon: Bookmark },
  { href: '/resume',            label: 'Resume',            icon: FileText },
  { href: '/resume/analyzer',   label: 'Resume Analyzer',   icon: Sparkles },
];

const bottomItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/contact', label: 'Help & Support', icon: HelpCircle },
];

function NavLink({ item, collapsed, pathname, onClick }: {
  item: NavItem; collapsed: boolean; pathname: string; onClick?: () => void;
}) {
  const isActive = pathname === item.href || (item.href !== '/jobs' && pathname.startsWith(item.href + '/'));
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative min-h-[44px]',
        isActive
          ? 'bg-primary/10 dark:bg-primary/15 text-primary font-semibold shadow-sm border border-primary/15 dark:border-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/60 dark:hover:bg-white/5'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <Icon className={cn('w-4.5 h-4.5 flex-shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="text-sm whitespace-nowrap flex-1 overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {item.badge !== undefined && item.badge > 0 && !collapsed && (
        <Badge className="ml-auto h-4.5 px-1.5 text-[10px] gradient-brand text-white border-0 min-w-[18px] flex items-center justify-center">
          {item.badge}
        </Badge>
      )}
      {item.badge !== undefined && item.badge > 0 && collapsed && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="rounded-lg text-xs font-medium">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return link;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<DbUser | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [isPro, setIsPro] = useState<boolean>(false);

  useEffect(() => {
    // Safely read client-only storage after mount to avoid hydration mismatch
    setCollapsed(localStorage.getItem('sidebar_collapsed') === 'true');
    const cachedUser = sessionStorage.getItem('jobfusion_user');
    if (cachedUser) setUser(JSON.parse(cachedUser));
    const cachedCount = sessionStorage.getItem('jobfusion_saved_count');
    if (cachedCount) setSavedCount(parseInt(cachedCount, 10));

    fetchCurrentUser().then(u => {
      if (u) { setUser(u); sessionStorage.setItem('jobfusion_user', JSON.stringify(u)); }
    }).catch(() => { });

    fetch('/api/user-plan/status')
      .then(res => res.json())
      .then(data => {
        if (data && data.status) {
          setIsPro(data.status.isPro);
        }
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    fetchSavedJobs(user._id).then(saved => {
      setSavedCount(saved.length);
      sessionStorage.setItem('jobfusion_saved_count', String(saved.length));
    }).catch(() => { });
  }, [pathname, user]);

  const getInitials = () => {
    if (!user) return 'U';
    const names = user.fullName.split(' ');
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`;
    return names[0].slice(0, 2).toUpperCase();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0',
        collapsed && 'justify-center px-3'
      )}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <Image
              src="/logo-circle.png"
              alt="JobFusion"
              width={34}
              height={34}
              className="rounded-full object-cover border-[3px] border-border/70 shadow-sm"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sidebar" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="font-bold text-base whitespace-nowrap overflow-hidden"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                <span className="gradient-brand-text">Job</span>
                <span>Fusion</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-0.5 scrollbar-thin">
        {navItems.map((item) => {
          const displayItem = item.href === '/jobs/saved' ? { ...item, badge: savedCount } : item;
          return <NavLink key={displayItem.href} item={displayItem} collapsed={collapsed} pathname={pathname} />;
        })}

        <div className="my-3 mx-1 border-t border-sidebar-border" />

        {bottomItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
        ))}
      </div>

      {/* Upgrade Pro Card */}
      <div className="px-2.5 py-2 flex-shrink-0">
        {!collapsed ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/15 via-purple-500/10 to-indigo-500/15 border border-primary/20 shadow-sm relative overflow-hidden group">
            <div className="flex items-start gap-2.5 relative z-10">
              <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold font-sans tracking-tight text-foreground flex items-center gap-1">
                  Upgrade to Pro
                </h4>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  Unlock all job portals & AI features
                </p>
              </div>
            </div>
            <Link href="/pricing" className="block mt-3 relative z-10">
              <Button
                size="sm"
                className="w-full h-8 rounded-xl gradient-brand text-white border-0 font-semibold text-xs hover:opacity-90 shadow-sm transition-all"
              >
                Upgrade
                <Sparkles className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href="/pricing"
                className="w-10 h-10 mx-auto rounded-xl gradient-brand flex items-center justify-center text-white shadow-sm hover:opacity-90 transition-all block"
              >
                <Sparkles className="w-4 h-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="rounded-lg text-xs font-medium">
              Upgrade to Pro
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* User Profile */}
      <div className={cn(
        'flex items-center gap-3 p-3 border-t border-sidebar-border flex-shrink-0 bg-sidebar',
        collapsed && 'justify-center'
      )}>
        {user ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0 rounded-xl p-1.5 hover:bg-accent/50 transition-colors touch-auto">
                <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-primary/20">
                  <AvatarFallback className="text-xs gradient-brand text-white font-semibold">{getInitials()}</AvatarFallback>
                </Avatar>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex-1 min-w-0"
                    >
                      <p className="text-xs font-bold truncate leading-tight flex items-center gap-1">
                        {user.fullName}
                        {isPro && <span className="text-[10px] text-amber-500 font-extrabold" title="Pro Member">★</span>}
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate flex items-center gap-1.5">
                        {isPro ? <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1 rounded">PRO</span> : null}
                        {user.email}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right" className="rounded-lg text-xs">{user.fullName}</TooltipContent>}
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2.5 w-28" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 68 : 236 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative hidden lg:flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border overflow-hidden flex-shrink-0"
      >
        {sidebarContent}
        <button
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            localStorage.setItem('sidebar_collapsed', String(next));
          }}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-accent hover:border-primary/30 transition-all z-20 touch-auto"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/90 backdrop-blur-xl border-t border-border/70 flex items-center justify-around px-1 py-1.5 shadow-2xl">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/jobs' && pathname.startsWith(item.href + '/'));
          const labels: Record<string, string> = { 'Dashboard': 'Home', 'Find Jobs': 'Jobs', 'Saved Jobs': 'Saved', 'Resume': 'Resume' };
          const displayItem = item.href === '/jobs/saved' ? { ...item, badge: savedCount } : item;

          return (
            <Link
              key={displayItem.href}
              href={displayItem.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl min-w-[52px] relative transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 flex-shrink-0 relative z-10" />
              <span className="text-[9px] font-semibold leading-none mt-0.5 relative z-10">
                {labels[item.label] || item.label}
              </span>
              {displayItem.badge !== undefined && displayItem.badge > 0 && (
                <span className="absolute top-0.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
