'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import {
  Search, MapPin, ArrowRight, CheckCircle2,
  Sparkles, Zap, BarChart3, FileText, Brain, Target, History, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { features } from '@/lib/data';

const iconMap: Record<string, React.ComponentType<any>> = {
  brain: Brain, zap: Zap, target: Target,
  'bar-chart': BarChart3, 'file-text': FileText,
  search: Search, history: History,
};

function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = (end / 1200) * 16;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const howItWorks = [
  { step: '01', title: 'Build Your Profile', description: 'Upload your resume — our AI extracts skills, detects your domain, and builds your career DNA automatically.', icon: FileText, color: 'from-blue-500 to-indigo-600' },
  { step: '02', title: 'AI Finds Matches', description: 'Our engine scans LinkedIn, Indeed, Wellfound, Internshala and company career pages, scoring each role against your profile.', icon: Brain, color: 'from-purple-500 to-violet-600' },
  { step: '03', title: 'Apply Smarter', description: 'One-click apply, save roles for later, track your pipeline, and get real-time insights — all in a unified command center.', icon: Zap, color: 'from-emerald-500 to-teal-600' },
];

const trustedBy = ['LinkedIn', 'Indeed', 'Wellfound', 'Internshala', 'Company Careers'];

const testimonials = [
  { quote: "JobFusion found me a senior role in 2 weeks. The AI matching is insane.", author: "Priya S.", role: "Senior Engineer", rating: 5 },
  { quote: "This is what job searching should feel like. Clean, fast, intelligent.", author: "Arjun M.", role: "Product Designer", rating: 5 },
  { quote: "Finally a platform that understands my resume without me explaining it.", author: "Sneha K.", role: "Data Scientist", rating: 5 },
];

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [stats, setStats] = useState({ totalJobs: 0, activeSources: 4, addedLast24h: 0, isLoaded: false });
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.6], [0, 80]);

  useEffect(() => {
    fetch('/api/jobs/stats').then(r => r.json()).then(j => {
      if (j.success && j.data) {
        const active = Object.values(j.data.bySource || {}).filter((c) => (c as number) > 0).length || 4;
        setStats({ totalJobs: j.data.total || 0, activeSources: active, addedLast24h: j.data.addedInLast24h || 0, isLoaded: true });
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background mesh-bg overflow-x-hidden">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-24 pb-36 px-4 overflow-hidden">

        {/* Ambient glow blobs */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-30 dark:opacity-20"
            style={{ background: 'radial-gradient(ellipse at center, oklch(0.53 0.24 258 / 0.15) 0%, transparent 70%)' }} />
          <div className="absolute top-32 left-1/4 w-80 h-80 rounded-full blur-3xl animate-float"
            style={{ background: 'oklch(0.53 0.24 258 / 0.08)' }} />
          <div className="absolute top-48 right-1/4 w-64 h-64 rounded-full blur-3xl animate-float-delayed"
            style={{ background: 'oklch(0.5 0.25 272 / 0.07)' }} />
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="max-w-5xl mx-auto text-center">

          {/* Eyebrow pill */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass border border-primary/20 text-sm font-medium shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground/80">AI-Powered Career Intelligence</span>
              <Badge className="text-[10px] h-4 px-1.5 gradient-brand text-white border-0 rounded-full">New</Badge>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hero-title text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            One Search.{' '}
            <span className="relative">
              <span className="gradient-brand-text">Every Opportunity.</span>
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
                className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(90deg, oklch(0.53 0.24 258), oklch(0.5 0.25 272))' }}
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            The most intelligent career platform. AI parses your resume, matches your skills across 5 live job portals, and surfaces the roles you were meant to apply for.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative max-w-2xl mx-auto mb-5"
          >
            <div className="glass rounded-2xl p-1.5 shadow-xl border border-white/30 dark:border-white/10 relative z-30">
              <div className="flex flex-col sm:flex-row gap-1.5">
                <div className="flex items-center gap-2 flex-1 px-3 py-1">
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Role, company, or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm h-9 px-0"
                  />
                </div>
                <div className="hidden sm:block w-px bg-border/60 my-2" />
                <div className="flex items-center gap-2 flex-1 px-3 py-1">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Location or Remote..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm h-9 px-0"
                  />
                </div>
                <Link href={`/jobs${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}>
                  <Button className="gradient-brand text-white border-0 rounded-xl h-10 px-6 font-semibold hover:opacity-90 shadow-md glow-sm whitespace-nowrap w-full sm:w-auto">
                    <Search className="w-4 h-4 mr-1.5" />
                    Find Jobs
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Popular searches */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mb-14"
          >
            <span className="text-xs text-muted-foreground self-center">Popular:</span>
            {['Remote Engineer', 'Product Designer', 'Data Scientist', 'Full Stack Dev', 'AI/ML Engineer'].map((term) => (
              <Link key={term} href="/jobs">
                <button className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200 touch-auto font-medium">
                  {term}
                </button>
              </Link>
            ))}
          </motion.div>

          {/* Live Stats */}
          {stats.isLoaded && stats.totalJobs > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-10"
            >
              {[
                { label: 'Jobs Indexed', value: stats.totalJobs },
                { label: 'Live Sources', value: stats.activeSources },
                { label: 'Added (24h)', value: stats.addedLast24h },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-3xl font-extrabold gradient-brand-text tabular-nums mb-0.5">
                    <AnimatedCounter end={value} />
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">{label}</div>
                </div>
              ))}
            </motion.div>
          ) : <div className="h-12" />}
        </motion.div>

        {/* Trusted by */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="max-w-3xl mx-auto mt-16 text-center"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-5">Aggregating live jobs from</p>
          <div className="flex flex-wrap justify-center gap-3">
            {trustedBy.map((source) => (
              <div key={source} className="px-4 py-2 rounded-full glass border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                {source}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-4 relative">
        <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.53 0.24 258 / 0.04), transparent 70%)' }} />
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-4 rounded-full px-4 py-1.5 border border-primary/20 bg-primary/8 text-primary font-semibold text-xs">
              ✦ Platform Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Everything you need to land your dream job
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">Powerful AI tools and real-time intelligence to supercharge your job search.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const IconComponent = iconMap[feature.icon] || Brain;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="card-premium card-hover p-6 group"
                >
                  <div className="w-11 h-11 rounded-xl gradient-subtle flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{feature.description}</p>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {feature.highlight}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-4 rounded-full px-4 py-1.5 border border-primary/20 bg-primary/8 text-primary font-semibold text-xs">
              ✦ How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              From signup to hired in 3 steps
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">JobFusion's AI does the heavy lifting so you can focus on what matters — interviews.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-14 left-[34%] right-[34%] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, oklch(0.53 0.24 258 / 0.4), transparent)' }} />

            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center group"
                >
                  <div className="relative inline-flex mb-6">
                    <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300`}>
                      <Icon className="w-11 h-11 text-white" />
                    </div>
                    <span className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-background border-2 border-primary text-[11px] font-extrabold text-primary flex items-center justify-center shadow-sm">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="mb-4 rounded-full px-4 py-1.5 border border-primary/20 bg-primary/8 text-primary font-semibold text-xs">
              ✦ Loved by Job Seekers
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Real results, real people
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-premium p-6 flex flex-col gap-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/80 flex-1">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden text-center text-white p-14 gradient-cta"
          >
            {/* Decorative elements */}
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(ellipse at top left, white, transparent 60%)' }} />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'white' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{ background: 'white' }} />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/25 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Free Forever for Job Seekers
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-balance" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Ready to find your dream job?
              </h2>
              <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Join thousands of professionals using JobFusion to discover their perfect roles in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/sign-up">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-xl font-bold px-8 shadow-xl h-12">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl font-semibold px-8 h-12">
                    Browse Jobs
                  </Button>
                </Link>
              </div>
              <p className="text-white/50 text-xs mt-5">No credit card required · 2 min setup · Cancel anytime</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
