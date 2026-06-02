'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Bell, Moon, Sun, ChevronDown,
  User, Settings, LogOut, Briefcase, LayoutDashboard,
  Bookmark, FileText, BarChart3, Users, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/jobs', label: 'Find Jobs' },
  { href: '/#features', label: 'Features' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLoggedIn = pathname.startsWith('/dashboard') || pathname.startsWith('/profile') ||
    pathname.startsWith('/jobs') || pathname.startsWith('/resume') ||
    pathname.startsWith('/notifications') || pathname.startsWith('/settings') ||
    pathname.startsWith('/candidates') || pathname.startsWith('/recruiter');

  return (
    <>
      <header className={cn(
        'transition-all duration-300 w-full',
        isLoggedIn
          ? 'sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60 shadow-sm'
          : 'fixed top-0 left-0 right-0 z-50 ' + (scrolled ? 'glass border-b border-border/60 shadow-sm' : 'bg-transparent')
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand + Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 group flex-shrink-0">
              <Image
                src="/logo.png"
                alt="JobFusion Logo"
                width={32}
                height={32}
                className="rounded-xl object-contain group-hover:scale-105 transition-transform"
              />
              <span
                className="font-bold text-lg sm:text-xl tracking-tight"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                <span className="gradient-brand-text">Job</span>
                <span className="text-foreground">Fusion</span>
              </span>
            </Link>

          </div>

          {/* Center Nav — hidden on mobile, show on logged-in pages  */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === link.href
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">
            {/* Theme toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-xl text-muted-foreground hover:text-foreground w-9 h-9"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}

            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="relative rounded-xl text-muted-foreground hover:text-foreground w-9 h-9">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 hover:bg-accent transition-colors cursor-pointer min-h-[40px]">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">RS</AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium">Rahul S.</span>
                      <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5 shadow-xl border-border bg-popover/95 backdrop-blur-md">
                    <div className="flex items-center gap-3 px-3 py-2.5 mb-1 bg-muted/40 rounded-xl">
                      <Avatar className="w-9 h-9 border border-border">
                        <AvatarFallback className="text-xs bg-primary/15 text-primary font-bold">RS</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate leading-tight">Rahul Sharma</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">rahul@example.com</p>
                      </div>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-1.5 text-sm cursor-pointer transition-colors">
                        <Link href="/dashboard" className="flex items-center w-full justify-between">
                          <span className="flex items-center"><LayoutDashboard className="w-4 h-4 mr-2 text-muted-foreground" />Dashboard</span>
                          <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">⌘D</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-1.5 text-sm cursor-pointer transition-colors">
                        <Link href="/profile" className="flex items-center w-full justify-between">
                          <span className="flex items-center"><User className="w-4 h-4 mr-2 text-muted-foreground" />My Profile</span>
                          <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">⌘P</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-1.5 text-sm cursor-pointer transition-colors">
                        <Link href="/jobs" className="flex items-center w-full justify-between">
                          <span className="flex items-center"><Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />Find Jobs</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-1.5 text-sm cursor-pointer transition-colors">
                        <Link href="/jobs/saved" className="flex items-center w-full justify-between">
                          <span className="flex items-center"><Bookmark className="w-4 h-4 mr-2 text-muted-foreground" />Saved Jobs</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-1.5 text-sm cursor-pointer transition-colors">
                        <Link href="/resume" className="flex items-center w-full justify-between">
                          <span className="flex items-center"><FileText className="w-4 h-4 mr-2 text-muted-foreground" />Resume</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-1.5 text-sm cursor-pointer transition-colors">
                        <Link href="/notifications" className="flex items-center w-full justify-between">
                          <span className="flex items-center"><Bell className="w-4 h-4 mr-2 text-muted-foreground" />Notifications</span>
                        </Link>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="my-1 bg-border/40" />
                    <div className="p-1 space-y-0.5">
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-1.5 text-sm cursor-pointer transition-colors">
                        <Link href="/recruiter" className="flex items-center w-full">
                          <BarChart3 className="w-4 h-4 mr-2 text-muted-foreground" />Recruiter Hub
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-1.5 text-sm cursor-pointer transition-colors">
                        <Link href="/candidates" className="flex items-center w-full">
                          <Users className="w-4 h-4 mr-2 text-muted-foreground" />Candidates
                        </Link>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="my-1 bg-border/40" />
                    <div className="p-1 space-y-0.5">
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-1.5 text-sm cursor-pointer transition-colors">
                        <Link href="/settings" className="flex items-center w-full">
                          <Settings className="w-4 h-4 mr-2 text-muted-foreground" />Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl px-3 py-1.5 text-sm text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer transition-colors">
                        <Link href="/auth/signin" className="flex items-center w-full">
                          <LogOut className="w-4 h-4 mr-2" />Sign Out
                        </Link>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="rounded-xl font-medium">Sign In</Button>
                </Link>
                <Link href="/auth/signup" className="hidden sm:block">
                  <Button size="sm" className="rounded-xl gradient-brand text-white border-0 shadow-md hover:opacity-90 font-medium text-xs sm:text-sm px-3 sm:px-4">
                    Get Started
                  </Button>
                </Link>
                {/* Mobile Menu Toggle Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden rounded-xl text-muted-foreground hover:text-foreground w-9 h-9 flex items-center justify-center"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {mobileMenuOpen && !isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-b border-border bg-background/95 backdrop-blur-xl absolute top-16 left-0 right-0 z-40 overflow-hidden shadow-lg"
            >
              <div className="px-4 py-6 space-y-4 flex flex-col">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      pathname === link.href
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="h-px bg-border my-2" />
                <div className="flex flex-col gap-2 px-4">
                  <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl font-medium justify-center h-10">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-xl gradient-brand text-white border-0 font-medium justify-center h-10 shadow-md">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {/* Spacer for fixed header */}
      {!isLoggedIn && <div className="h-16" />}
    </>
  );
}
