'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  Search, MapPin, ArrowRight, CheckCircle2,
  Zap, BarChart3, FileText, Brain, Target, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PricingCard } from '@/components/pricing/PricingCard';
import { FREE_PLAN_FEATURES, PRO_PLAN_FEATURES } from '@/lib/plans';
import { AutocompleteInput } from '@/components/ui/autocomplete';
import Navbar from '@/components/navbar';
import { features } from '@/lib/data';

// Dynamic imports — these components are below the fold or decorative,
// so they don't need to be in the initial JS bundle.
const Footer = dynamic(() => import('@/components/footer'), { ssr: true });
const HeroBackground = dynamic(() => import('@/components/hero-background'), { ssr: false });

const iconMap: Record<string, React.ComponentType<any>> = {
  brain: Brain, zap: Zap, target: Target,
  'bar-chart': BarChart3, 'file-text': FileText,
  search: Search, history: History,
};

const howItWorks = [
  { step: '01', title: 'Build Your Profile', description: 'Upload your resume — our AI extracts skills, detects your domain, and builds your career DNA automatically.', icon: FileText, color: 'from-blue-500 to-indigo-600' },
  { step: '02', title: 'AI Finds Matches', description: 'Our engine scans LinkedIn, Indeed, Wellfound, Internshala and company career pages, scoring each role against your profile.', icon: Brain, color: 'from-purple-500 to-violet-600' },
  { step: '03', title: 'Apply Smarter', description: 'One-click apply, save roles for later, track your pipeline, and get real-time insights — all in a unified command center.', icon: Zap, color: 'from-emerald-500 to-teal-600' },
];

const CARD_PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    description: 'Perfect for getting started with your job search.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    buttonText: 'Get Started Free',
    buttonVariant: 'outline' as const,
    features: FREE_PLAN_FEATURES,
  },
  {
    id: 'pro_monthly' as const,
    name: 'Pro Monthly',
    description: 'Unlock the full power of AI-driven job search.',
    monthlyPrice: 299,
    yearlyPrice: null,
    buttonText: 'Upgrade Monthly',
    buttonVariant: 'outline' as const,
    features: PRO_PLAN_FEATURES,
  },
  {
    id: 'pro_yearly' as const,
    name: 'Pro Yearly',
    description: 'Best value for long-term career growth.',
    monthlyPrice: null,
    yearlyPrice: 2999,
    badge: 'Most Popular',
    recommended: true,
    buttonText: 'Upgrade Yearly',
    buttonVariant: 'default' as const,
    features: PRO_PLAN_FEATURES,
  },
];

const FAQS = [
  {
    question: "How does the AI matching work?",
    answer: "Our AI engine analyzes your resume's skills, experience, and domain, then cross-references them against thousands of active job listings across multiple platforms to find the perfect match."
  },
  {
    question: "Is JobFusion really free?",
    answer: "Yes! We offer a generous free tier that gives you access to basic job matching and tracking. You only pay when you want to unlock advanced features like unlimited matches, AI cover letters, and priority support."
  },
  {
    question: "Can I use JobFusion if I'm not in tech?",
    answer: "Absolutely. While we excel at tech roles, our AI is trained on a vast array of industries including finance, marketing, healthcare, design, and more."
  },
  {
    question: "How often are new jobs added?",
    answer: "Our platform syncs continuously with major job boards and company career pages, meaning new opportunities are surfaced in real-time as soon as they're posted."
  },
  {
    question: "Can I cancel my Pro subscription at any time?",
    answer: "Yes, you can manage or cancel your subscription at any time from your billing dashboard. There are no long-term contracts unless you explicitly choose the annual plan."
  }
];

function FAQItem({ question, answer, delay }: { question: string, answer: string, delay: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="border border-border/50 bg-background/50 backdrop-blur-sm rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-6 text-left focus:outline-none"
      >
        <span className="font-semibold text-lg">{question}</span>
        <div className={`flex-shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1L7 13M13 7L1 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="p-6 pt-0 text-muted-foreground leading-relaxed">
          {answer}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [, setStats] = useState({ totalJobs: 0, activeSources: 4, addedLast24h: 0, isLoaded: false });
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, 80]);

  useEffect(() => {
    fetch('/api/jobs/stats').then(r => r.json()).then(j => {
      if (j.success && j.data) {
        const active = Object.values(j.data.bySource || {}).filter((c) => (c as number) > 0).length || 4;
        setStats({ totalJobs: j.data.total || 0, activeSources: active, addedLast24h: j.data.addedInLast24h || 0, isLoaded: true });
      }
    }).catch(() => { });
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-transparent overflow-x-hidden">
      <Navbar />

      <main>
        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative pt-24 pb-36 px-4 overflow-hidden isolate bg-transparent">

          {/* Premium Animated Hero Background */}
          <HeroBackground />

          <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative z-10 max-w-5xl mx-auto text-center">



            {/* Headline — uses CSS animation instead of Framer Motion so it
              renders immediately without waiting for JS (critical for LCP) */}
            <h1
              className="hero-title text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 animate-hero-fade-in"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              One Search.{' '}
              <span className="relative">
                <span className="gradient-brand-text">Every Opportunity.</span>
              </span>
            </h1>

            {/* Description — CSS animated, not Framer Motion, so LCP isn't blocked */}
            <p
              className="text-sm md:text-xl text-muted-foreground mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed animate-hero-fade-in px-4 md:px-0"
              style={{ animationDelay: '0.1s' }}
            >
              The most intelligent career platform. AI parses your resume, matches your skills and surfaces the roles you were meant to apply for.
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative max-w-2xl mx-auto mb-5 px-2 md:px-0"
            >
              <div className="glass bg-white/90 dark:bg-black/60 backdrop-blur-3xl rounded-2xl p-1 md:p-1.5 glow-brand border border-white/30 dark:border-white/10 relative z-30">
                <div className="flex flex-col sm:flex-row gap-1 md:gap-1.5">
                  <div className="flex items-center gap-2 flex-1 px-2 py-0.5 md:px-3 md:py-1">
                    <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                    <AutocompleteInput
                      dataSource="roles"
                      placeholder="Role, company, or keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onSelect={(val) => setSearchQuery(val)}
                      className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none text-xs md:text-sm h-8 md:h-9 px-0 w-full min-w-0"
                      wrapperClassName="w-full flex-1"
                    />
                  </div>
                  <div className="hidden sm:block w-px bg-border/60 my-2" />
                  <div className="flex items-center gap-2 flex-1 px-2 py-0.5 md:px-3 md:py-1">
                    <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                    <AutocompleteInput
                      dataSource="locations"
                      placeholder="Location or Remote..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onSelect={(val) => setLocation(val)}
                      className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none text-xs md:text-sm h-8 md:h-9 px-0 w-full min-w-0"
                      wrapperClassName="w-full flex-1"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (isSignedIn) {
                        router.push(`/jobs${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}${location ? `${searchQuery ? '&' : '?'}location=${encodeURIComponent(location)}` : ''}`);
                      } else {
                        sessionStorage.setItem('guestSearch', JSON.stringify({ role: searchQuery, location }));
                        router.push('/sign-in');
                      }
                    }}
                    className="gradient-brand text-white border-0 rounded-xl h-9 md:h-10 px-5 md:px-6 text-sm font-semibold hover:opacity-90 shadow-md glow-sm whitespace-nowrap w-full sm:w-auto mt-0.5 sm:mt-0"
                  >
                    <Search className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                    Find Jobs
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Popular searches */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center items-center gap-1.5 md:gap-2 mb-10 md:mb-14 px-2 md:px-0"
            >
              <span className="text-[10px] md:text-xs text-muted-foreground mr-1">Popular:</span>
              {['Remote Engineer', 'Product Designer', 'Data Scientist', 'Full Stack Dev', 'AI/ML Engineer'].map((term) => (
                <Link
                  key={term}
                  href={isSignedIn ? "/jobs" : "/sign-in"}
                  prefetch={false}
                  className="text-[10px] md:text-xs px-2.5 md:px-3 py-1 md:py-1.5 min-h-[24px] md:min-h-[32px] inline-flex items-center justify-center rounded-full border border-border hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200 font-medium m-0.5"
                >
                  {term}
                </Link>
              ))}
            </motion.div>


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
        <section id="how-it-works" className="py-28 px-4 relative">
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



        {/* ── PRICING ───────────────────────────────────────────────── */}
        <section id="pricing" className="py-28 px-4 relative bg-muted/10 border-y border-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge className="mb-4 rounded-full px-4 py-1.5 border border-primary/20 bg-primary/8 text-primary font-semibold text-xs">
                ✦ Simple Pricing
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Invest in your career growth
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">Choose a plan that works best for you and unlock the full potential of AI-driven job matching.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-12">
              {CARD_PLANS.map((plan, i) => (
                <PricingCard
                  key={plan.id}
                  plan={plan as any}
                  interval={plan.id === 'pro_yearly' ? 'yearly' : 'monthly'}
                  index={i}
                />
              ))}
            </div>

            <div className="text-center">
              <Link href="/pricing">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 font-semibold px-8 py-6 rounded-2xl shadow-sm text-base group transition-all border-none">
                  Explore all features
                  <ArrowRight className="w-5 h-5 ml-2 text-white group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <section id="faq" className="py-28 px-4 relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge className="mb-4 rounded-full px-4 py-1.5 border border-primary/20 bg-primary/8 text-primary font-semibold text-xs">
                ✦ FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Got questions? We've got answers
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">Everything you need to know about JobFusion and how it works.</p>
            </div>

            <div className="flex flex-col gap-4">
              {FAQS.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} delay={i * 0.1} />
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

                <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-balance" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Ready to find your dream job?
                </h2>
                <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                  Join thousands of professionals using JobFusion to discover their perfect roles in real-time.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {isSignedIn ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-xl font-bold px-8 shadow-xl h-12">
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/sign-up" prefetch={false}>
                      <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-xl font-bold px-8 shadow-xl h-12">
                        Get Started Free
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                  <Link href={isSignedIn ? "/jobs" : "/sign-in"} prefetch={false}>
                    <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white rounded-xl font-semibold px-8 h-12">
                      Browse Jobs
                    </Button>
                  </Link>
                </div>

              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
