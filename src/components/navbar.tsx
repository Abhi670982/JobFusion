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
  Bookmark, FileText, BarChart3, Users
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
  { href: '/candidates', label: 'For Recruiters' },
  { href: '/#features', label: 'Features' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
                        <AvatarFallback className="text-xs gradient-brand text-white">RS</AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium">Rahul S.</span>
                      <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-border/60">
                    <div className="px-3 py-2 mb-1">
                      <p className="text-sm font-semibold">Rahul Sharma</p>
                      <p className="text-xs text-muted-foreground">rahul@example.com</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href="/profile"><User className="w-4 h-4 mr-2" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href="/jobs"><Briefcase className="w-4 h-4 mr-2" />Find Jobs</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href="/jobs/saved"><Bookmark className="w-4 h-4 mr-2" />Saved Jobs</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href="/resume"><FileText className="w-4 h-4 mr-2" />Resume</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href="/notifications"><Bell className="w-4 h-4 mr-2" />Notifications</Link>
                    </DropdownMenuItem>

                    {/* Recruiter Options */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href="/recruiter"><BarChart3 className="w-4 h-4 mr-2" />Recruiter Hub</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href="/candidates"><Users className="w-4 h-4 mr-2" />Candidates</Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link href="/settings"><Settings className="w-4 h-4 mr-2" />Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl text-destructive focus:text-destructive">
                      <Link href="/auth/signin" className="flex items-center w-full">
                        <LogOut className="w-4 h-4 mr-2" />Sign Out
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="rounded-xl font-medium">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="rounded-xl gradient-brand text-white border-0 shadow-md hover:opacity-90 font-medium text-xs sm:text-sm px-3 sm:px-4">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Spacer for fixed header */}
      {!isLoggedIn && <div className="h-16" />}
    </>
  );
}
