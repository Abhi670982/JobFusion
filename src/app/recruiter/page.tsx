'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, Briefcase, TrendingUp, Plus,
  Search, Eye, MessageSquare, Star, MoreVertical,
  Calendar, ChevronRight, ArrowUpRight, Zap, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const hireData = [
  { month: 'Jan', hires: 4, applications: 120 },
  { month: 'Feb', hires: 7, applications: 180 },
  { month: 'Mar', hires: 5, applications: 150 },
  { month: 'Apr', hires: 9, applications: 220 },
  { month: 'May', hires: 12, applications: 310 },
  { month: 'Jun', hires: 8, applications: 265 },
];

const jobPostings = [
  { id: 1, title: 'Senior Frontend Engineer', department: 'Engineering', status: 'active', applications: 247, daysLeft: 12, match: 94 },
  { id: 2, title: 'Product Manager', department: 'Product', status: 'active', applications: 134, daysLeft: 5, match: 87 },
  { id: 3, title: 'Data Scientist', department: 'Data', status: 'paused', applications: 89, daysLeft: 0, match: 0 },
  { id: 4, title: 'DevOps Engineer', department: 'Infrastructure', status: 'active', applications: 73, daysLeft: 20, match: 82 },
];

const topCandidates = [
  { name: 'Rahul Sharma', role: 'Senior Frontend', match: 96, initials: 'RS', color: '#6366f1', stage: 'Interview' },
  { name: 'Priya Verma', role: 'Full Stack Dev', match: 89, initials: 'PV', color: '#8b5cf6', stage: 'Screening' },
  { name: 'Sneha Reddy', role: 'Data Scientist', match: 83, initials: 'SR', color: '#06b6d4', stage: 'Offer' },
  { name: 'Arjun Nair', role: 'Product Designer', match: 91, initials: 'AN', color: '#f59e0b', stage: 'Review' },
];

function StatCard({ icon: Icon, label, value, change, color }: any) {
  return (
    <div className="card-premium p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {change && (
          <span className="text-xs text-emerald-500 flex items-center gap-0.5 font-medium">
            <ArrowUpRight className="w-3 h-3" />{change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-1 tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function RecruiterDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isRecruiter />
      <div className="flex-1 flex flex-col min-w-0 mobile-header-offset page-content">
        <Navbar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-[1400px] mx-auto w-full space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Recruiter Hub</h1>
              <p className="text-muted-foreground text-sm mt-1">Managing 4 active job postings</p>
            </div>
            <Button className="rounded-xl gradient-brand text-white border-0 gap-2">
              <Plus className="w-4 h-4" />
              Post a Job
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Briefcase} label="Active Postings" value="4" change="+1 this week" color="#6366f1" />
            <StatCard icon={Users} label="Total Applicants" value="543" change="+47 today" color="#8b5cf6" />
            <StatCard icon={Star} label="Hires This Month" value="8" change="+3 vs last" color="#10b981" />
            <StatCard icon={TrendingUp} label="Avg. Time to Hire" value="14d" color="#f59e0b" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hiring Chart */}
            <div className="lg:col-span-2 card-premium p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold">Hiring Pipeline</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Applications & hires over 6 months</p>
                </div>
                <Badge variant="secondary" className="rounded-lg text-xs">Last 6 months</Badge>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={hireData}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="applications" stroke="#8b5cf6" fill="url(#colorApps)" strokeWidth={2} name="Applications" />
                  <Area type="monotone" dataKey="hires" stroke="#10b981" fill="url(#colorHires)" strokeWidth={2} name="Hires" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Top Candidates */}
            <div className="card-premium p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Top Candidates</h3>
                <Button variant="ghost" size="sm" className="rounded-lg text-xs">View all</Button>
              </div>
              <div className="space-y-3">
                {topCandidates.map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarFallback className="text-xs text-white font-semibold" style={{ backgroundColor: c.color }}>{c.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.role}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-primary">{c.match}%</p>
                      <Badge variant="secondary" className="text-[10px] rounded-md mt-0.5">{c.stage}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Job Postings Table */}
          <div className="card-premium overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold">Active Job Postings</h3>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5" />
                Filter
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Position</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Applications</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Days Left</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">AI Quality</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {jobPostings.map((job, i) => (
                    <motion.tr
                      key={job.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.department}</p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={`rounded-full text-xs px-2.5 ${job.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                          {job.status === 'active' ? '● Active' : '⏸ Paused'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium">{job.applications}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-sm font-medium ${job.daysLeft <= 5 ? 'text-red-500' : ''}`}>
                          {job.status === 'paused' ? '—' : `${job.daysLeft}d`}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {job.status === 'active' && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${job.match}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{job.match}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1.5 justify-end">
                          <Button size="sm" variant="ghost" className="rounded-lg h-7 px-2 text-xs gap-1"><Eye className="w-3 h-3" />View</Button>
                          <Button size="sm" variant="ghost" className="rounded-lg h-7 px-2 text-xs gap-1"><Users className="w-3 h-3" />Candidates</Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
