'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, FileText, Download, Trash2, MoreVertical, Eye,
  CheckCircle2, Clock, Star, Plus, RefreshCw, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import { resumeVersions } from '@/lib/data';
import { cn } from '@/lib/utils';

const analysisItems = [
  { label: 'ATS Compatibility', score: 88, color: '#10b981' },
  { label: 'Keyword Optimization', score: 74, color: '#6366f1' },
  { label: 'Formatting & Structure', score: 92, color: '#8b5cf6' },
  { label: 'Action Words', score: 68, color: '#f59e0b' },
];

const suggestions = [
  { type: 'warning', text: 'Add quantifiable achievements (e.g., "increased performance by 40%")' },
  { type: 'error', text: 'Missing keywords: Kubernetes, CI/CD, System Design' },
  { type: 'success', text: 'Strong action verbs used throughout' },
  { type: 'warning', text: 'Consider adding a professional summary section' },
];

export default function ResumePage() {
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(true);
  const [activeVersion, setActiveVersion] = useState('r1');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Resume Manager</h1>
            <p className="text-muted-foreground text-sm">Upload, manage, and optimize your resume with AI</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Versions + Upload */}
            <div className="space-y-5">
              {/* Upload Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer',
                  dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/50'
                )}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); setUploaded(true); }}
                onClick={() => setUploaded(true)}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium text-sm mb-1">Drop your resume here</p>
                <p className="text-xs text-muted-foreground mb-3">PDF, DOCX, or TXT · Max 5MB</p>
                <Button size="sm" className="rounded-xl gradient-brand text-white border-0 hover:opacity-90 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Upload Resume
                </Button>
              </motion.div>

              {/* Resume Versions */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Versions</h3>
                  <Badge variant="secondary" className="text-xs rounded-lg">{resumeVersions.length} saved</Badge>
                </div>
                <div className="space-y-2">
                  {resumeVersions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVersion(v.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                        activeVersion === v.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-accent border border-transparent'
                      )}
                    >
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{v.name}</span>
                          {v.isDefault && <Badge className="text-[10px] h-4 px-1.5 gradient-brand text-white border-0 flex-shrink-0">Default</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{v.updatedAt} · {v.size}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded-lg hover:bg-accent transition-colors" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="rounded-lg gap-2"><Download className="w-3.5 h-3.5" />Download</DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2"><Star className="w-3.5 h-3.5" />Set as Default</DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 text-destructive focus:text-destructive"><Trash2 className="w-3.5 h-3.5" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Center: Preview */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-premium overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Engineering Focus.pdf</span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" className="rounded-lg h-7 px-2.5 text-xs gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </Button>
                  <Button size="sm" className="rounded-lg h-7 px-2.5 text-xs gap-1.5 gradient-brand text-white border-0">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-muted/30 flex flex-col items-center justify-center min-h-[500px] p-8">
                <div className="w-full max-w-xs bg-background rounded-xl shadow-xl border border-border p-6 space-y-4">
                  <div className="text-center border-b border-border pb-4">
                    <div className="w-12 h-12 rounded-full gradient-brand mx-auto mb-2 flex items-center justify-center text-white font-bold">RS</div>
                    <h3 className="font-bold text-sm">Rahul Sharma</h3>
                    <p className="text-xs text-muted-foreground">Senior Frontend Engineer</p>
                    <p className="text-[10px] text-muted-foreground">rahul@example.com · Bengaluru, Karnataka</p>
                  </div>
                  {['Experience', 'Skills', 'Education'].map(section => (
                    <div key={section}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">{section}</p>
                      <div className="space-y-1">
                        <div className="h-2 bg-muted rounded-full w-full" />
                        <div className="h-2 bg-muted rounded-full w-3/4" />
                        <div className="h-2 bg-muted rounded-full w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Updated 2 days ago
                </p>
              </div>
            </motion.div>

            {/* Right: AI Analysis */}
            <div className="space-y-5">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-premium p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">AI Resume Score</h3>
                  <Button size="sm" variant="ghost" className="rounded-lg gap-1.5 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Re-analyze
                  </Button>
                </div>
                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 40 * 0.81} ${2 * Math.PI * 40 * 0.19}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold">81</span>
                      <span className="text-[10px] text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {analysisItems.map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.score}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.score}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card-premium p-5">
                <h3 className="font-semibold mb-4">AI Suggestions</h3>
                <div className="space-y-3">
                  {suggestions.map((s, i) => {
                    const iconClass = s.type === 'success' ? 'text-emerald-500' : s.type === 'error' ? 'text-destructive' : 'text-amber-500';
                    const Icon = s.type === 'success' ? CheckCircle2 : AlertCircle;
                    return (
                      <div key={i} className="flex gap-2.5 text-xs">
                        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconClass}`} />
                        <span className="text-muted-foreground leading-relaxed">{s.text}</span>
                      </div>
                    );
                  })}
                </div>
                <Button className="w-full mt-4 rounded-xl gradient-brand text-white border-0 hover:opacity-90 text-xs h-9">
                  Apply All Suggestions
                </Button>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
