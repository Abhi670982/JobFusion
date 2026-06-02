'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Link2, Code2, Play } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Find Jobs', href: '/jobs' },
    { label: 'Job Alerts', href: '/notifications' },
    { label: 'Salary Insights', href: '/' },
    { label: 'Resume Tools', href: '/resume' },
    { label: 'AI Matching', href: '/' },
  ],
  Recruiters: [
    { label: 'Post a Job', href: '/recruiter' },
    { label: 'Find Candidates', href: '/candidates' },
    { label: 'Recruiter Dashboard', href: '/recruiter' },
    { label: 'Pricing', href: '/' },
    { label: 'ATS Integration', href: '/' },
  ],
  Company: [
    { label: 'About Us', href: '/' },
    { label: 'Blog', href: '/' },
    { label: 'Careers', href: '/' },
    { label: 'Press', href: '/' },
    { label: 'Partners', href: '/' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/' },
    { label: 'Terms of Service', href: '/' },
    { label: 'Cookie Policy', href: '/' },
    { label: 'GDPR', href: '/' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/30 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo.png"
                alt="JobFusion Logo"
                width={32}
                height={32}
                className="rounded-xl object-contain"
              />
              <span className="font-bold text-xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                <span className="gradient-brand-text">Job</span>
                <span>Fusion</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">
              The AI-powered job platform that aggregates 2.4M+ opportunities and matches you with your perfect role.
            </p>
            <div className="flex gap-3">
              {[MessageCircle, Link2, Code2, Play].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
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

        <div className="border-t border-border/60 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 JobFusion, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>🌍 English (US)</span>
            <span>•</span>
            <span>Built with ❤️ for job seekers everywhere</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
