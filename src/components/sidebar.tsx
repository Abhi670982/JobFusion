'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, User, FileText, Settings,
  ChevronLeft, ChevronRight, Bookmark
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Find Jobs', icon: Briefcase },
  { href: '/jobs/saved', label: 'Saved Jobs', icon: Bookmark },
  { href: '/resume', label: 'Resume', icon: FileText },
];

const bottomItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {}

function NavLink({ item, collapsed, pathname, onClick }: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
  onClick?: () => void;
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
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm whitespace-nowrap flex-1 overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {item.badge !== undefined && item.badge > 0 && !collapsed && (
        <Badge className="ml-auto h-5 px-1.5 text-[10px] gradient-brand text-white border-0">
          {item.badge}
        </Badge>
      )}
      {item.badge !== undefined && item.badge > 0 && collapsed && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="rounded-lg">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return link;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    }
    return false;
  });
  const [user, setUser] = useState<DbUser | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('jobfusion_user');
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });
  const [savedCount, setSavedCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('jobfusion_saved_count');
      return cached ? parseInt(cached, 10) : 0;
    }
    return 0;
  });

  // Fetch user details once on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          sessionStorage.setItem('jobfusion_user', JSON.stringify(currentUser));
        }
      } catch (err) {
        console.error("Error fetching sidebar user:", err);
      }
    }
    loadUser();
  }, []);

  // Fetch saved jobs count on mount and route changes
  useEffect(() => {
    if (!user) return;
    const userId = user._id;
    async function loadSavedCount() {
      try {
        const saved = await fetchSavedJobs(userId);
        setSavedCount(saved.length);
        sessionStorage.setItem('jobfusion_saved_count', String(saved.length));
      } catch (err) {
        console.error("Error fetching saved count:", err);
      }
    }
    loadSavedCount();
  }, [pathname, user?._id]);

  const allItems = navItems;

  const getInitials = () => {
    if (!user) return 'U';
    const names = user.fullName.split(' ');
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`;
    return names[0].slice(0, 2).toUpperCase();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0',
        collapsed && 'justify-center px-3'
      )}>
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Image
            src="/logo-circle.png"
            alt="JobFusion Logo"
            width={36}
            height={36}
            className="rounded-full flex-shrink-0 object-cover border border-sidebar-border"
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-bold text-lg whitespace-nowrap overflow-hidden inline-flex items-center gap-0.5"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                <span className="gradient-brand-text">Job</span>
                <span>Fusion</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {allItems.map((item) => {
          // Inject dynamic saved count badge
          const displayItem = item.href === '/jobs/saved'
            ? { ...item, badge: savedCount }
            : item;
          return (
            <NavLink
              key={displayItem.href}
              item={displayItem}
              collapsed={collapsed}
              pathname={pathname}
            />
          );
        })}

        <div className="my-3 border-t border-sidebar-border" />

        {bottomItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
          />
        ))}
      </div>

      {/* User Profile */}
      <div className={cn(
        'flex items-center gap-3 p-4 border-t border-sidebar-border transition-all flex-shrink-0 bg-sidebar sticky bottom-0 z-10',
        collapsed && 'justify-center'
      )}>
        {user ? (
          <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-primary/20">
            <AvatarFallback className="text-xs gradient-brand text-white">{getInitials()}</AvatarFallback>
          </Avatar>
        ) : (
          <Skeleton className="w-8 h-8 rounded-full bg-sidebar-accent/50 animate-pulse flex-shrink-0" />
        )}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-w-0"
            >
              {user ? (
                <p className="text-sm font-medium truncate">{user.fullName}</p>
              ) : (
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24 bg-sidebar-accent/50 animate-pulse" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative hidden lg:flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border overflow-hidden flex-shrink-0"
      >
        <SidebarContent />
        <button
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            localStorage.setItem('sidebar_collapsed', String(next));
          }}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-accent transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/90 backdrop-blur-md border-t border-border/80 flex items-center justify-around px-2 py-2 shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/jobs' && pathname.startsWith(item.href + '/'));

          const mobileLabelMap: Record<string, string> = {
            'Dashboard': 'Home',
            'Find Jobs': 'Jobs',
            'Saved Jobs': 'Saved',
            'My Profile': 'Profile',
            'Resume': 'Resume',
          };
          const label = mobileLabelMap[item.label] || item.label;

          const displayItem = item.href === '/jobs/saved'
            ? { ...item, badge: savedCount }
            : item;

          return (
            <Link
              key={displayItem.href}
              href={displayItem.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl min-w-[56px] relative transition-all duration-200',
                isActive
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] font-medium leading-none mt-1">
                {label}
              </span>
              {displayItem.badge !== undefined && displayItem.badge > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
