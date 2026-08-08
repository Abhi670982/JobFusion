'use client';

import Link from 'next/link';
import { Globe, Heart } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

import { GohyredLogo } from '@/components/ui/gohyred-logo';

const footerLinks = {
  Product: [
    { label: 'Find Jobs', href: '/jobs' },
    { label: 'Salary Insights', href: '/' },
    { label: 'Resume Tools', href: '/resume' },
    { label: 'AI Matching', href: '/' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'How it Works', href: '/#how-it-works' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
  ],
};

export default function Footer() {
  const { isSignedIn } = useAuth();
  return (
    <footer className="relative z-10 bg-card/30 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <GohyredLogo href="/" size="md" className="mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">
              Search once. Discover opportunities everywhere.<br />
              Find thousands of jobs from leading platforms—all in one place.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p className="text-sm font-semibold mb-4 text-foreground">{category}</p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href === '/jobs' ? (isSignedIn ? '/jobs' : '/sign-in') : link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 flex flex-col-reverse md:flex-row items-center justify-between gap-6 border-t border-border/10">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © 2026 Gohyred, All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-muted-foreground" />
              English (US)
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              Built with
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
              for job seekers everywhere
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
