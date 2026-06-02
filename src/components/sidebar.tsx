'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, User, FileText, Bell, Settings,
  Users, BarChart3, ChevronLeft, ChevronRight,
  Bookmark, X, Menu
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  recruiterOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Find Jobs', icon: Briefcase },
  { href: '/jobs/saved', label: 'Saved Jobs', icon: Bookmark, badge: 47 },
  { href: '/profile', label: 'My Profile', icon: User },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/notifications', label: 'Notifications', icon: Bell, badge: 3 },
];

const recruiterItems: NavItem[] = [
  { href: '/recruiter', label: 'Recruiter Hub', icon: BarChart3, recruiterOnly: true },
  { href: '/candidates', label: 'Candidates', icon: Users, recruiterOnly: true },
];

const bottomItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isRecruiter?: boolean;
}

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm whitespace-nowrap flex-1 overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {item.badge && !collapsed && (
        <Badge className="ml-auto h-5 px-1.5 text-[10px] gradient-brand text-white border-0">
          {item.badge}
        </Badge>
      )}
      {item.badge && collapsed && (
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

export default function Sidebar({ isRecruiter = false }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const allItems = [...navItems, ...(isRecruiter ? recruiterItems : [])];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0',
        collapsed && 'justify-center px-3'
      )}>
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Image
            src="/logo.png"
            alt="JobFusion Logo"
            width={36}
            height={36}
            className="rounded-xl flex-shrink-0 object-contain"
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-bold text-lg whitespace-nowrap overflow-hidden"
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
        {allItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
          />
        ))}

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
        'flex items-center gap-3 p-4 border-t border-sidebar-border transition-all',
        collapsed && 'justify-center'
      )}>
        <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-primary/20">
          <AvatarFallback className="text-xs gradient-brand text-white">RS</AvatarFallback>
        </Avatar>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-medium truncate">Rahul Sharma</p>
              <p className="text-xs text-muted-foreground truncate">Senior Engineer</p>
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
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-accent transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-1 py-1">
        {[
          ...navItems.slice(0, 4),
          ...(isRecruiter ? recruiterItems.slice(0, 1) : [navItems[4]])
        ].slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/jobs' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[48px] relative transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-none mt-0.5">
                {item.label.split(' ')[0]}
              </span>
              {item.badge && (
                <span className="absolute top-0.5 right-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
