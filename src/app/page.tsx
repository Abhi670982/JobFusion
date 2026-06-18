'use client';

import { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, Briefcase, ArrowRight, CheckCircle2,
  Sparkles, ChevronDown, TrendingUp, Zap,
  BarChart3, FileText, Brain, Target, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { features } from '@/lib/data';

const iconMap: Record<string, React.ComponentType<any>> = {
  brain: Brain,
  zap: Zap,
  target: Target,
  'bar-chart': BarChart3,
  'file-text': FileText,
  search: Search,
  history: History,
};

function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const step = (end / duration) * 16;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-16">
      <Badge className="mb-4 rounded-full px-4 py-1.5 border border-primary/20 bg-primary/10 text-primary font-medium text-xs">
        {eyebrow}
      </Badge>
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        {title}
      </h2>
      <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
    </div>
  );
}

const howItWorks = [
  { step: '01', title: 'Create Your Profile', description: 'Upload your resume or build your profile. Our AI extracts your skills and experience automatically.', icon: FileText },
  { step: '02', title: 'AI Finds Your Matches', description: 'Our engine scans integrated portals and matches jobs to your unique profile with compatibility scoring.', icon: Brain },
  { step: '03', title: 'Apply Smarter', description: 'Apply to jobs directly, save roles for later, and track your pipeline in one unified dashboard.', icon: Zap },
];

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [stats, setStats] = useState<{
    totalJobs: number;
    activeSources: number;
    addedLast24h: number;
    isLoaded: boolean;
  }>({
    totalJobs: 0,
    activeSources: 4,
    addedLast24h: 0,
    isLoaded: false
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/jobs/stats');
        const json = await res.json();
        if (json.success && json.data) {
          const bySource = json.data.bySource || {};
          const activeSourceCount = Object.values(bySource).filter(count => (count as number) > 0).length || 4;
          setStats({
            totalJobs: json.data.total || 0,
            activeSources: activeSourceCount,
            addedLast24h: json.data.addedInLast24h || 0,
            isLoaded: true
          });
        }
      } catch (err) {
        console.error("Error loading landing page stats:", err);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-background mesh-bg">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden gradient-hero">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl -z-10 animate-float" />
        <div className="absolute top-40 right-1/4 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl -z-10" style={{ animationDelay: '2s' }} />

        <div className="max-w-5xl mx-auto text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>AI-Powered Job Discovery</span>
              <Badge className="ml-1 text-[10px] h-4 px-1.5 gradient-brand text-white border-0">New</Badge>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            One Search.
            <br />
            <span className="gradient-brand-text">Every Opportunity.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            The most intelligent job platform. AI matches you with your perfect role by parsing your resume and searching unified job openings.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="glass rounded-2xl p-2 max-w-3xl mx-auto shadow-xl border border-white/20 dark:border-white/10 mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input
                  placeholder="Job title, company, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm h-9 px-0"
                />
              </div>
              <div className="w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2 flex-1 px-3">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input
                  placeholder="Location or Remote..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm h-9 px-0"
                />
              </div>
              <Link href="/jobs">
                <Button className="gradient-brand text-white border-0 rounded-xl h-10 px-6 font-semibold hover:opacity-90 shadow-lg glow-sm whitespace-nowrap">
                  <Search className="w-4 h-4 mr-2" />
                  Find Jobs
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Popular searches */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            <span className="text-xs text-muted-foreground">Popular:</span>
            {['Remote Engineer', 'Product Designer', 'Data Scientist', 'Full Stack', 'AI/ML Engineer'].map((term) => (
              <Link key={term} href="/jobs">
                <button className="text-xs px-3 py-1 rounded-full border border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all">
                  {term}
                </button>
              </Link>
            ))}
          </motion.div>

          {/* Stats */}
          {stats.isLoaded && stats.totalJobs > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-8"
            >
              {[
                { label: 'Jobs Indexed', value: stats.totalJobs, suffix: '' },
                { label: 'Active Channels', value: stats.activeSources, suffix: '' },
                { label: 'Recent Openings (24h)', value: stats.addedLast24h, suffix: '' },
              ].map(({ label, value, suffix }) => (
                <div key={label} className="text-center">
                  <div className="text-3xl font-bold gradient-brand-text tabular-nums">
                    <AnimatedCounter end={value} suffix={suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </motion.div>
          ) : (
            <div className="h-12" />
          )}
        </div>
      </section>



      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="✦ Platform Features"
            title="Everything you need to land your dream job"
            description="Powerful tools and AI-driven insights to supercharge your job search and get hired faster."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-premium p-6 group cursor-default"
              >
                <div className="w-12 h-12 rounded-2xl gradient-subtle flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  {(() => {
                    const IconComponent = iconMap[feature.icon] || Brain;
                    return <IconComponent className="w-5 h-5" />;
                  })()}
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{feature.description}</p>
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {feature.highlight}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            eyebrow="✦ How It Works"
            title="From signup to hired in 3 simple steps"
            description="JobFusion's AI does the heavy lifting so you can focus on what matters — interviewing and getting offers."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[calc(33%-40px)] right-[calc(33%-40px)] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center"
                >
                  <div className="relative inline-flex mb-6">
                    <div className="w-24 h-24 rounded-3xl gradient-brand flex items-center justify-center shadow-xl glow-sm">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-background border-2 border-primary text-[11px] font-bold text-primary flex items-center justify-center">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden gradient-brand p-12 text-center text-white"
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_left,white,transparent_70%)]" />
            <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-4xl font-extrabold mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Ready to find your dream job?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Join professionals using JobFusion to discover matches in real-time. Free forever for job seekers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-xl font-semibold px-8 shadow-xl">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/jobs">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl font-semibold px-8">
                  Browse Jobs
                </Button>
              </Link>
            </div>
            <p className="text-white/60 text-xs mt-4">No credit card required • 2 min setup • Cancel anytime</p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
