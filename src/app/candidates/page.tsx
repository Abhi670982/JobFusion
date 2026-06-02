'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, SlidersHorizontal, X, MapPin, Briefcase,
  MessageSquare, Star, ChevronRight, Eye, Wifi, CheckCircle2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import { candidates } from '@/lib/data';
import type { Candidate } from '@/lib/data';
import { cn } from '@/lib/utils';

const availabilityConfig = {
  immediately: { label: 'Available Now', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  'two-weeks': { label: '2 Weeks Notice', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  'one-month': { label: '1 Month Notice', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  'not-looking': { label: 'Not Looking', color: 'text-muted-foreground', bg: 'bg-muted border-transparent' },
};

const avatarColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

function CandidateCard({ candidate, index, onView }: { candidate: Candidate; index: number; onView: (c: Candidate) => void }) {
  const avail = availabilityConfig[candidate.availability];
  const color = avatarColors[index % avatarColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="card-premium p-5 group card-hover"
    >
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="w-14 h-14 ring-2 ring-border flex-shrink-0">
          <AvatarFallback className="text-lg font-bold text-white" style={{ backgroundColor: color }}>
            {candidate.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{candidate.name}</h3>
          <p className="text-xs text-muted-foreground">{candidate.title}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {candidate.location}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 justify-end mb-1">
            <span className="text-[8px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded">AI</span>
            <span className={cn('text-sm font-bold', candidate.matchScore >= 90 ? 'text-emerald-500' : 'text-primary')}>
              {candidate.matchScore}%
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">match</p>
        </div>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${candidate.matchScore}%` }}
          transition={{ duration: 0.8, delay: index * 0.07 + 0.3 }}
          className="h-full rounded-full gradient-brand"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {candidate.skills.slice(0, 4).map(skill => (
          <Badge key={skill} variant="secondary" className="text-[10px] rounded-md px-2">{skill}</Badge>
        ))}
        {candidate.skills.length > 4 && (
          <Badge variant="secondary" className="text-[10px] rounded-md px-2">+{candidate.skills.length - 4}</Badge>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          {candidate.experience}
        </div>
        <span className="font-medium text-foreground">{candidate.salary}</span>
      </div>

      <Badge className={cn('rounded-full text-[10px] px-2 mb-4 border', avail.bg, avail.color)}>
        {avail.label}
      </Badge>

      <div className="flex gap-2 pt-3 border-t border-border">
        <Button size="sm" className="flex-1 rounded-lg h-8 text-xs gradient-brand text-white border-0 hover:opacity-90">
          <MessageSquare className="w-3 h-3 mr-1.5" />
          Message
        </Button>
        <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs px-3" onClick={() => onView(candidate)}>
          <Eye className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" className="rounded-lg h-8 text-xs px-3">
          <Star className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function CandidatesPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [activeSkills, setActiveSkills] = useState<string[]>([]);

  const allSkills = Array.from(new Set(candidates.flatMap(c => c.skills))).slice(0, 10);
  const toggleSkill = (s: string) => setActiveSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const filtered = candidates.filter(c => {
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (activeSkills.length > 0 && !activeSkills.some(s => c.skills.includes(s))) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isRecruiter />
      <div className="flex-1 flex flex-col min-w-0 mobile-header-offset page-content">
        <Navbar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Candidate Discovery</h1>
              <Badge className="gradient-brand text-white border-0 rounded-full px-3 gap-1.5">
                <Sparkles className="w-3 h-3" />
                AI-Ranked
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{filtered.length} candidates matching your criteria</p>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, title, or skill..." className="pl-9 rounded-xl h-10" />
            </div>
            <Button variant="outline" className="rounded-xl gap-1.5 text-sm">
              <SlidersHorizontal className="w-4 h-4" />
              More Filters
            </Button>
          </div>

          {/* Skill Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {allSkills.map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border transition-all',
                  activeSkills.includes(skill)
                    ? 'border-primary bg-primary text-white'
                    : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                )}
              >
                {skill}
              </button>
            ))}
            {activeSkills.length > 0 && (
              <button onClick={() => setActiveSkills([])} className="text-xs text-muted-foreground hover:text-foreground px-2">Clear</button>
            )}
          </div>

          {/* Candidate Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c, i) => (
              <CandidateCard key={c.id} candidate={c} index={i} onView={setSelected} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-semibold mb-2">No candidates found</h3>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button onClick={() => { setQuery(''); setActiveSkills([]); }} variant="outline" className="rounded-xl">Reset Search</Button>
            </div>
          )}
        </main>
      </div>

      {/* Profile Preview Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-xl font-bold text-white" style={{ backgroundColor: avatarColors[candidates.indexOf(selected) % avatarColors.length] }}>
                      {selected.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">{selected.name}</DialogTitle>
                    <p className="text-muted-foreground text-sm">{selected.title}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {selected.location} · {selected.experience} exp
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <span className="text-sm font-medium">AI Match Score</span>
                  <span className="text-lg font-bold text-primary">{selected.matchScore}%</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.bio}</p>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.skills.map(s => <Badge key={s} variant="secondary" className="rounded-md text-xs">{s}</Badge>)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Education</p>
                    <p className="font-medium text-xs">{selected.education}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Salary Range</p>
                    <p className="font-medium text-xs">{selected.salary}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 rounded-xl gradient-brand text-white border-0"><MessageSquare className="w-4 h-4 mr-1.5" />Send Message</Button>
                  <Button variant="outline" className="flex-1 rounded-xl">View Full Profile</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
