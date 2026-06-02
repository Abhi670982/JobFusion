'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Users, Bookmark, BookmarkCheck, Share2,
  CheckCircle2, XCircle, ArrowLeft, ExternalLink, Briefcase,
  DollarSign, Wifi, Star, ChevronRight, Zap, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import JobCard from '@/components/job-card';
import { jobs } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const job = jobs.find(j => j.id === params.id) ?? jobs[0];
  const [saved, setSaved] = useState(job?.saved ?? false);
  const [applied, setApplied] = useState(false);

  const similarJobs = jobs.filter(j => j.id !== job?.id && j.category === job?.category).slice(0, 3);

  const matchedSkills = job?.skills.slice(0, 3) ?? [];
  const missingSkills = ['System Design', 'Kubernetes', 'gRPC'];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 mobile-header-offset page-content">
        <Navbar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto w-full">
          {/* Back */}
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0"
                      style={{ backgroundColor: job.companyColor }}
                    >
                      {job.companyLogo}
                    </div>
                    <div>
                      <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{job.title}</h1>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-muted-foreground font-medium">{job.company}</span>
                        <span className="text-muted-foreground">·</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSaved(!saved)}
                      className={cn('p-2 rounded-xl transition-all', saved ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-accent')}
                    >
                      {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                    </button>
                    <button className="p-2 rounded-xl text-muted-foreground hover:bg-accent transition-all">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  <Badge variant="secondary" className="rounded-lg gap-1.5"><Wifi className="w-3 h-3" />{job.locationType}</Badge>
                  <Badge variant="secondary" className="rounded-lg gap-1.5"><Briefcase className="w-3 h-3" />{job.type}</Badge>
                  <Badge variant="secondary" className="rounded-lg gap-1.5"><Clock className="w-3 h-3" />{job.experience}</Badge>
                  <Badge variant="secondary" className="rounded-lg gap-1.5"><DollarSign className="w-3 h-3" />{job.salary}</Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-5">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {job.applicants} applicants
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Posted {job.postedAt}
                  </div>
                </div>

                {applied ? (
                  <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    Application Submitted! We'll notify you of updates.
                  </div>
                ) : (
                  <Button
                    onClick={() => setApplied(true)}
                    className="w-full h-11 rounded-xl gradient-brand text-white border-0 font-semibold hover:opacity-90 shadow-lg text-sm"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Apply with JobFusion Profile
                  </Button>
                )}
              </motion.div>

              {/* Skill Match */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">AI Skill Match</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-primary">AI</span>
                    </div>
                    <span className={cn('font-bold', job.matchScore >= 85 ? 'text-emerald-500' : 'text-blue-500')}>{job.matchScore}% match</span>
                  </div>
                </div>
                <Progress value={job.matchScore} className="h-2 mb-6" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-3">
                      <CheckCircle2 className="w-4 h-4" />
                      Skills You Have
                    </h4>
                    <div className="space-y-2">
                      {matchedSkills.map(skill => (
                        <div key={skill} className="flex items-center gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-3">
                      <XCircle className="w-4 h-4" />
                      Skills to Develop
                    </h4>
                    <div className="space-y-2">
                      {missingSkills.map(skill => (
                        <div key={skill} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {skill}
                          </div>
                          <button className="text-xs text-primary hover:underline">Learn →</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Description */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-premium p-6 space-y-6">
                <div>
                  <h2 className="font-semibold mb-3">About the Role</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
                </div>
                <Separator />
                <div>
                  <h2 className="font-semibold mb-3">Requirements</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h2 className="font-semibold mb-3">Responsibilities</h2>
                  <ul className="space-y-2">
                    {job.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-muted-foreground">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h2 className="font-semibold mb-3">Benefits & Perks</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.benefits.map((b) => (
                      <Badge key={b} variant="secondary" className="rounded-lg text-xs">{b}</Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Company Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card-premium p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  About {job.company}
                </h3>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-3"
                  style={{ backgroundColor: job.companyColor }}
                >
                  {job.companyLogo}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {job.company} is a global technology company building the future of financial infrastructure and developer tools.
                </p>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Industry', value: 'FinTech / SaaS' },
                    { label: 'Company size', value: '5,000 – 10,000' },
                    { label: 'Founded', value: '2014' },
                    { label: 'HQ', value: 'Bengaluru, India' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4 rounded-xl gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Company Profile
                </Button>
              </motion.div>

              {/* Similar Jobs */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <h3 className="font-semibold mb-3">Similar Jobs</h3>
                <div className="space-y-3">
                  {similarJobs.map((sj) => (
                    <Link key={sj.id} href={`/jobs/${sj.id}`} className="block card-premium p-4 hover:border-primary/30 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: sj.companyColor }}>
                          {sj.companyLogo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary">{sj.title}</p>
                          <p className="text-xs text-muted-foreground">{sj.company} · {sj.salary}</p>
                        </div>
                        <Badge className={cn('text-[10px] flex-shrink-0', sj.matchScore >= 85 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20')}>
                          {sj.matchScore}%
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
