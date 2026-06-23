'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Trash2, Eye,
  CheckCircle2, Clock, Plus, RefreshCw, AlertCircle,
  Lightbulb, Target, BookOpen, Briefcase, Award, Code2,
  XCircle, Info, ChevronRight, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  fetchCurrentUser,
  fetchProfile,
  updateProfile,
  uploadResume,
  parseResume,
  DbUser,
  DbProfile,
} from '@/lib/api-helper';
import { cn } from '@/lib/utils';

export default function ResumePage() {
  const [loading, setLoading]             = useState(true);
  const [user, setUser]                   = useState<DbUser | null>(null);
  const [profile, setProfile]             = useState<DbProfile | null>(null);
  const [dragging, setDragging]           = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [parsing, setParsing]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName]   = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(80);
  const [editingSkill, setEditingSkill]   = useState<{ index: number; name: string; level: number } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setProfile(await fetchProfile(currentUser._id));
        }
      } catch (err) {
        console.error("Error loading resume details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const processFile = async (file: File) => {
    if (!user) return;
    setError(null);
    setSuccessMessage(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') { setError('Only PDF and DOCX files are allowed.'); return; }
    setUploading(true);
    try {
      const result = await uploadResume(user._id, file);
      if (result.success) {
        setSuccessMessage(`Resume uploaded! ${result.data.skillsExtracted} skills extracted. Category: ${result.data.resumeCategory}`);
        setProfile(await fetchProfile(user._id, true));
      } else {
        setError(result.error || 'Failed to upload resume.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange  = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) await processFile(e.target.files[0]); };
  const handleDragOver    = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave   = () => setDragging(false);
  const handleDrop        = async (e: React.DragEvent) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.[0]) await processFile(e.dataTransfer.files[0]); };

  const handleManualParse = async () => {
    if (!user || !profile?.resumeUrl || parsing) return;
    setParsing(true); setError(null); setSuccessMessage(null);
    try {
      const result = await parseResume(user._id);
      if (result.success) {
        setSuccessMessage(`Re-parsed! ${result.data.skillsExtractedCount} skills. Category: ${result.data.resumeCategory}`);
        setProfile(await fetchProfile(user._id, true));
      } else { setError(result.error || 'Failed to parse resume.'); }
    } catch (err: any) { setError(err.message || 'Parsing error.'); }
    finally { setParsing(false); }
  };

  const handleDeleteResume = async () => {
    if (!user || !profile) return;
    try {
      const updated = await updateProfile(user._id, {
        resumeUrl: '',
        resumeName: '',
        resumeUpdatedAt: null,
        skills: [],
        resumeText: '',
        resumeCategory: '',
        resumeSummary: '',
        suggestedRoles: [],
        lastAnalyzedAt: null,
        resumeInsights: {
          found: [],
          missing: [],
          tips: []
        },
        bio: '',
        experiences: [],
        education: [],
        projects: []
      });
      if (updated) { 
        setProfile(updated); 
        setSuccessMessage('Resume removed.'); 
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('jobfusion_filter_query');
        }
      }
    } catch (err: any) { setError(err.message || 'Failed to remove resume.'); }
  };

  const handleAddSkill = async () => {
    if (!user || !profile || !newSkillName.trim()) return;
    if (profile.skills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) { setError('Skill already exists.'); return; }
    const updated = await updateProfile(user._id, { skills: [...profile.skills, { name: newSkillName.trim(), level: 100 }] });
    if (updated) { setProfile(updated); setNewSkillName(''); setSkillModalOpen(false); setSuccessMessage('Skill added.'); }
  };

  const handleRemoveSkill = async (skillName: string) => {
    if (!user || !profile) return;
    const updated = await updateProfile(user._id, { skills: profile.skills.filter(s => s.name !== skillName) });
    if (updated) { setProfile(updated); setSuccessMessage('Skill removed.'); }
  };

  const formatDate = (d?: string | Date | null) =>
    d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never';

  const insights = profile?.resumeInsights;

  return (
    <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Resume Manager</h1>
          <p className="text-muted-foreground text-sm">Upload your resume to extract skills, detect your domain, and get career insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Skill Mode Selector */}
          <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-xl shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground">On Upload:</span>
            <select
              value={profile?.resumeSkillMode || 'merge'}
              onChange={async (e) => {
                const mode = e.target.value as 'merge' | 'replace';
                if (user) {
                  const updated = await updateProfile(user._id, { resumeSkillMode: mode });
                  if (updated) { setProfile(updated); setSuccessMessage(`Skill mode set to "${mode}".`); }
                }
              }}
              className="text-xs bg-transparent border-0 font-semibold focus:ring-0 cursor-pointer focus-visible:outline-none touch-auto"
            >
              <option value="merge">Merge Skills</option>
              <option value="replace">Replace Skills</option>
            </select>
          </div>
          {profile?.resumeUrl && (
            <Button size="sm" variant="outline" onClick={handleManualParse} disabled={parsing}
              className="rounded-xl gap-1.5 text-xs border-border bg-card shadow-sm h-9 btn-press">
              <RefreshCw className={cn("w-3.5 h-3.5", parsing && "animate-spin")} />
              {parsing ? 'Analyzing...' : 'Re-analyze Resume'}
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
          </motion.div>
        )}
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" /><span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse skeleton-shimmer">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-44 bg-muted rounded-2xl" />
            <div className="h-64 bg-muted rounded-2xl" />
          </div>
          <div className="h-96 bg-muted rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT COL ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Upload Zone */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx" className="hidden" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[190px]',
                dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/50',
                (uploading || parsing) && 'opacity-65 pointer-events-none'
              )}>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                {uploading || parsing ? <RefreshCw className="w-6 h-6 text-primary animate-spin" /> : <Upload className="w-6 h-6 text-primary" />}
              </div>
              {uploading ? (
                <><p className="font-semibold text-sm mb-1">Uploading &amp; analyzing resume...</p><p className="text-xs text-muted-foreground">Extracting skills, detecting domain, generating insights</p></>
              ) : parsing ? (
                <><p className="font-semibold text-sm mb-1">Re-analyzing resume...</p><p className="text-xs text-muted-foreground">Running intelligence engine</p></>
              ) : (
                <>
                  <p className="font-semibold text-sm mb-1">{profile?.resumeUrl ? 'Drop a new resume here to replace' : 'Drop your resume here'}</p>
                  <p className="text-xs text-muted-foreground mb-4">PDF or DOCX · Works for any career — Tech, Finance, HR, Marketing &amp; more</p>
                  <Button size="sm" type="button" className="rounded-xl gradient-brand text-white border-0 hover:opacity-90 text-xs shadow-md glow-sm btn-press">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />{profile?.resumeUrl ? 'Replace Resume' : 'Upload Resume'}
                  </Button>
                </>
              )}
            </motion.div>

            {/* Current Resume Card */}
            {profile?.resumeUrl && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                className="card-premium p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{profile.resumeName || 'Uploaded Resume'}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Uploaded: {formatDate(profile.resumeUpdatedAt)}
                    </p>
                    {profile.resumeCategory && (
                      <Badge variant="secondary" className="mt-1.5 text-[10px] rounded-full font-bold bg-muted text-muted-foreground border-border/80 border">
                        {profile.resumeCategory}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setDeleteModalOpen(true)}
                    className="rounded-lg h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 gap-1 touch-auto"><Trash2 className="w-3.5 h-3.5" />Remove</Button>
                </div>
              </motion.div>
            )}

            {/* Skills */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-semibold text-sm">Skills</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Auto-extracted from your resume + manually added</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSkillModalOpen(true)} className="rounded-xl gap-1 h-8 text-xs touch-auto">
                  <Plus className="w-3.5 h-3.5" />Add Skill
                </Button>
              </div>
              {!profile?.skills || profile.skills.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Code2 className="w-8 h-8 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No skills yet. Upload your resume to extract skills automatically.</p>
                  <p className="text-xs text-muted-foreground">Works for any career — software, design, finance, HR, marketing &amp; more.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {profile.skills.map((skill, index) => (
                    <div key={skill.name}
                      className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl bg-muted/50 border border-border/80 text-xs hover:border-primary/30 transition-all group">
                      <span className="font-semibold">{skill.name}</span>
                      <button onClick={() => handleRemoveSkill(skill.name)}
                        className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors ml-1 touch-auto">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── RIGHT COL ─────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Resume Intelligence Summary */}
            {profile?.resumeUrl ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card-premium p-5 space-y-4">
                <h3 className="font-semibold text-sm">Resume Intelligence</h3>

                {/* Category */}
                {profile.resumeCategory && (
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Detected Category</p>
                    <p className="text-sm font-bold text-primary">{profile.resumeCategory}</p>
                  </div>
                )}

                {/* Summary */}
                {profile.resumeSummary && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Auto Summary</p>
                    <p className="text-xs text-foreground leading-relaxed font-medium">{profile.resumeSummary}</p>
                  </div>
                )}

                {/* Suggested Roles */}
                {profile.suggestedRoles && profile.suggestedRoles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                      <Target className="w-3 h-3" /> Suggested Roles
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.suggestedRoles.map(role => (
                        <Badge key={role} variant="secondary" className="rounded-full text-[10px] font-bold px-2.5 py-0.5 bg-muted text-muted-foreground border border-border/80">{role}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2.5 text-[11px] font-semibold">
                  <div className="p-3 rounded-xl bg-muted/40 text-center">
                    <div className="text-lg font-extrabold text-foreground">{profile.skills?.length || 0}</div>
                    <div className="text-muted-foreground mt-0.5">Skills Found</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 text-center">
                    <div className="text-lg font-extrabold text-foreground">
                      {profile.lastAnalyzedAt ? new Date(profile.lastAnalyzedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </div>
                    <div className="text-muted-foreground mt-0.5">Last Analyzed</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card-premium p-5">
                <h3 className="font-semibold text-sm mb-3">Resume Intelligence</h3>
                <div className="text-center py-6 space-y-2.5">
                  <Lightbulb className="w-8 h-8 mx-auto text-amber-500/60" />
                  <p className="text-xs text-muted-foreground leading-relaxed px-4">Upload your resume to get domain detection, career role suggestions, and an auto-generated summary.</p>
                </div>
              </motion.div>
            )}

            {/* Resume Insights */}
            {profile?.resumeUrl && insights && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card-premium p-5 space-y-4">
                <h3 className="font-semibold text-sm">Resume Insights</h3>

                {insights.found.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">✓ What We Found</p>
                    {insights.found.map((item, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-500" />
                        <span className="text-muted-foreground font-medium leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {insights.missing.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">⚠ Missing Sections</p>
                    {insights.missing.map((item, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                        <span className="text-muted-foreground font-medium leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {insights.tips.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-blue-500" /> Tips to Improve
                    </p>
                    {insights.tips.map((tip, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
                        <span className="text-muted-foreground leading-relaxed font-medium">{tip}</span>
                      </div>
                    ))}
                  </div>
                )}

                {insights.found.length === 0 && insights.missing.length === 0 && insights.tips.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Re-analyze your resume to generate fresh insights.</p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Add Skill Dialog */}
      <Dialog open={skillModalOpen} onOpenChange={setSkillModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg font-bold">Add Skill Manually</DialogTitle></DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="skillName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skill Name</Label>
              <Input id="skillName" value={newSkillName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSkillName(e.target.value)}
                placeholder="e.g. Tally, Figma, SEO, Recruitment, Python..."
                className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSkillModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleAddSkill} className="rounded-xl gradient-brand text-white border-0 shadow-md btn-press">Add Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Resume Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-2xl border-destructive/20">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3 text-destructive">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">Remove Resume?</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2 px-2">
              Are you sure you want to remove your resume? This will also clear all auto-extracted skills and resume insights. This action cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="rounded-xl flex-1 max-w-[120px]">
              Cancel
            </Button>
            <Button onClick={async () => { setDeleteModalOpen(false); await handleDeleteResume(); }} className="rounded-xl bg-destructive hover:bg-destructive/90 text-white border-0 flex-1 max-w-[120px] btn-press">
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
