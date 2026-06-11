'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Download, Trash2, Eye,
  CheckCircle2, Clock, Star, Plus, RefreshCw, AlertCircle,
  FileDown, BookOpen, UserCheck, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import {
  fetchCurrentUser,
  fetchProfile,
  updateProfile,
  uploadResume,
  parseResume,
  DbUser,
  DbProfile,
  DbSkill
} from '@/lib/api-helper';
import { cn } from '@/lib/utils';

export default function ResumePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DbUser | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Skill Add Modal
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(80);
  const [editingSkill, setEditingSkill] = useState<{ index: number; name: string; level: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const prof = await fetchProfile(currentUser._id);
          setProfile(prof);
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
    if (ext !== 'pdf' && ext !== 'docx') {
      setError('Only PDF and DOCX files are allowed.');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadResume(user._id, file);
      if (result.success) {
        setSuccessMessage(`Resume uploaded and ${result.data.skillsExtracted} skills extracted successfully!`);
        // Refresh profile data
        const updatedProf = await fetchProfile(user._id);
        setProfile(updatedProf);
      } else {
        setError(result.error || 'Failed to upload resume.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during resume processing.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleManualParse = async () => {
    if (!user || !profile?.resumeUrl || parsing) return;
    setParsing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await parseResume(user._id);
      if (result.success) {
        setSuccessMessage(`Resume re-parsed successfully! Extracted ${result.data.skillsExtractedCount} skills.`);
        const updatedProf = await fetchProfile(user._id);
        setProfile(updatedProf);
      } else {
        setError(result.error || 'Failed to parse resume.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during parsing.');
    } finally {
      setParsing(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!user || !profile) return;
    if (!confirm('Are you sure you want to remove your resume? This will clear the file link from your profile.')) return;
    
    try {
      const updated = await updateProfile(user._id, {
        resumeUrl: '',
        resumeName: '',
        resumeUpdatedAt: undefined
      });
      if (updated) {
        setProfile(updated);
        setSuccessMessage('Resume deleted successfully.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete resume.');
    }
  };

  // Skill CRUD
  const handleAddSkill = async () => {
    if (!user || !profile || !newSkillName.trim()) return;

    const exists = profile.skills.some(
      (s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase()
    );
    if (exists) {
      setError('Skill already exists.');
      return;
    }

    const updatedSkills = [...profile.skills, { name: newSkillName.trim(), level: newSkillLevel }];
    
    try {
      const updated = await updateProfile(user._id, { skills: updatedSkills });
      if (updated) {
        setProfile(updated);
        setNewSkillName('');
        setNewSkillLevel(80);
        setSkillModalOpen(false);
        setSuccessMessage('Skill added successfully.');
      }
    } catch (err: any) {
      setError('Failed to add skill.');
    }
  };

  const handleRemoveSkill = async (skillName: string) => {
    if (!user || !profile) return;
    
    const updatedSkills = profile.skills.filter(s => s.name !== skillName);
    
    try {
      const updated = await updateProfile(user._id, { skills: updatedSkills });
      if (updated) {
        setProfile(updated);
        setSuccessMessage('Skill removed successfully.');
      }
    } catch (err: any) {
      setError('Failed to remove skill.');
    }
  };

  const handleEditSkillSave = async () => {
    if (!user || !profile || !editingSkill) return;

    const updatedSkills = [...profile.skills];
    updatedSkills[editingSkill.index] = { name: editingSkill.name, level: editingSkill.level };

    try {
      const updated = await updateProfile(user._id, { skills: updatedSkills });
      if (updated) {
        setProfile(updated);
        setEditingSkill(null);
        setSuccessMessage('Skill updated successfully.');
      }
    } catch (err: any) {
      setError('Failed to update skill.');
    }
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Compute dynamic stats for resume
  const skillsCount = profile?.skills?.length || 0;
  
  // Retrieve dynamic ATS score from backend
  const atsScore = profile?.atsScore || 0;

  const atsCompatibility = profile?.resumeUrl ? Math.max(70, Math.min(100, atsScore + 5)) : 30;
  const keywordScore = Math.min(100, Math.max(40, skillsCount * 8));
  const formattingScore = profile?.resumeUrl ? 95 : 30;

  const analysisItems = [
    { label: 'ATS Compatibility', score: atsCompatibility, color: '#10b981' },
    { label: 'Keyword Optimization', score: keywordScore, color: '#3b82f6' },
    { label: 'Formatting & Structure', score: formattingScore, color: '#2563eb' },
    { label: 'Completeness', score: atsScore, color: '#eab308' },
  ];

  // Dynamic recommendations generated from the database audit details
  const suggestions = [
    ...(profile?.atsDetails?.weaknesses?.map(text => ({ type: 'error', text })) || []),
    ...(profile?.atsDetails?.missingSections?.map(text => ({ type: 'warning', text: `Missing section: ${text}` })) || []),
    ...(profile?.atsDetails?.suggestions?.map(text => ({ type: 'warning', text })) || []),
    ...(profile?.atsDetails?.strengths?.map(text => ({ type: 'success', text })) || []),
  ].slice(0, 8); // Limit to top 8 items to fit UI nicely

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 mobile-header-offset page-content">
        <Navbar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto w-full">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Resume Manager</h1>
              <p className="text-muted-foreground text-sm">Upload, parse, and extract technical skills dynamically with local pipelines</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-xl shadow-sm">
                <span className="text-xs font-medium text-muted-foreground">Skill Mode:</span>
                <select
                  value={profile?.resumeSkillMode || 'merge'}
                  onChange={async (e) => {
                    const mode = e.target.value as 'merge' | 'replace';
                    if (user) {
                      try {
                        const updated = await updateProfile(user._id, { resumeSkillMode: mode });
                        if (updated) {
                          setProfile(updated);
                          setSuccessMessage(`Skills will now be ${mode}d on upload.`);
                        }
                      } catch (err) {
                        setError('Failed to update skill mode configuration.');
                      }
                    }
                  }}
                  className="text-xs bg-transparent border-0 font-semibold focus:ring-0 cursor-pointer focus-visible:outline-none"
                >
                  <option value="merge">Merge</option>
                  <option value="replace">Replace</option>
                </select>
              </div>

              {profile?.resumeUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualParse}
                  disabled={parsing}
                  className="rounded-xl gap-1.5 text-xs border-border bg-card shadow-sm h-9"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", parsing && "animate-spin")} />
                  {parsing ? 'Parsing...' : 'Re-parse Resume'}
                </Button>
              )}
            </div>
          </div>

          {/* Success / Error Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
            {successMessage && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 animate-bounce" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-44 bg-muted rounded-2xl" />
                <div className="h-64 bg-muted rounded-2xl" />
              </div>
              <div className="h-96 bg-muted rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Upload Area + Skills List */}
              <div className="lg:col-span-2 space-y-6">
                {/* Drag-and-Drop Upload Area */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                  className="hidden"
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[180px]',
                    dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/50',
                    (uploading || parsing) && 'opacity-65 pointer-events-none'
                  )}
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                    {uploading || parsing ? (
                      <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  {uploading ? (
                    <>
                      <p className="font-semibold text-sm mb-1">Uploading resume to Cloudinary...</p>
                      <p className="text-xs text-muted-foreground">This secures and hosts your file</p>
                    </>
                  ) : parsing ? (
                    <>
                      <p className="font-semibold text-sm mb-1">Parsing resume text & extracting skills...</p>
                      <p className="text-xs text-muted-foreground">Identifying keywords using NLP</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-sm mb-1">
                        {profile?.resumeUrl ? 'Drag a new resume here to replace' : 'Drop your resume file here'}
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">Accepts PDF and DOCX only · Max 5MB</p>
                      <Button size="sm" type="button" className="rounded-xl gradient-brand text-white border-0 hover:opacity-90 text-xs">
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        {profile?.resumeUrl ? 'Replace Resume' : 'Upload Resume'}
                      </Button>
                    </>
                  )}
                </motion.div>

                {/* Stored Resume File Card */}
                {profile?.resumeUrl && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{profile.resumeName || 'Uploaded Resume'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          Uploaded: {formatDate(profile.resumeUpdatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="rounded-lg h-8 px-2.5 text-xs gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </a>
                      <Button size="sm" variant="ghost" onClick={handleDeleteResume} className="rounded-lg h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1">
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Skills Management Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-6">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h3 className="font-semibold text-sm">Extracted & Custom Skills</h3>
                      <p className="text-xs text-muted-foreground">Matched keywords from your resume & manual additions</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSkillModalOpen(true)} className="rounded-xl gap-1 h-8 text-xs">
                      <Plus className="w-3.5 h-3.5" />
                      Add Skill
                    </Button>
                  </div>

                  {(!profile?.skills || profile.skills.length === 0) ? (
                    <div className="text-center py-10">
                      <p className="text-sm text-muted-foreground">No skills detected. Upload your resume to extract skills automatically.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {profile.skills.map((skill, index) => (
                        <div
                          key={skill.name}
                          className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl bg-muted/60 border border-border/80 text-xs hover:border-primary/30 transition-all group"
                        >
                          <span className="font-medium">{skill.name}</span>
                          <span className="text-muted-foreground opacity-60">({skill.level}%)</span>
                          <button
                            onClick={() => setEditingSkill({ index, name: skill.name, level: skill.level })}
                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-1"
                          >
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          </button>
                          <button
                            onClick={() => handleRemoveSkill(skill.name)}
                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Right: AI Score & Suggestions */}
              <div className="space-y-6">
                {/* Circular Score */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card-premium p-5 text-center">
                  <h3 className="font-semibold text-sm mb-4 text-left">Resume Strength Score</h3>
                  <div className="flex items-center justify-center mb-5">
                    <div className="relative w-28 h-28">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 40 * (atsScore / 100)} ${2 * Math.PI * 40 * (1 - atsScore / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold">{atsScore}</span>
                        <span className="text-[10px] text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 text-left">
                    {analysisItems.map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-[11px] mb-1">
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

                {/* Suggestions List */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card-premium p-5">
                  <h3 className="font-semibold text-sm mb-4">ATS Recommendations</h3>
                  <div className="space-y-3.5">
                    {suggestions.map((s, i) => {
                      const iconClass = s.type === 'success' ? 'text-emerald-500' : s.type === 'error' ? 'text-destructive' : 'text-amber-500';
                      const Icon = s.type === 'success' ? CheckCircle2 : s.type === 'error' ? ShieldAlert : AlertCircle;
                      return (
                        <div key={i} className="flex gap-2.5 text-xs">
                          <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconClass}`} />
                          <span className="text-muted-foreground leading-relaxed">{s.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Add Skill Dialog */}
          <Dialog open={skillModalOpen} onOpenChange={setSkillModalOpen}>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Add Skill Manually</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-3">
                <div className="space-y-2">
                  <Label htmlFor="skillName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skill Name</Label>
                  <Input
                    id="skillName"
                    value={newSkillName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSkillName(e.target.value)}
                    placeholder="e.g. Kubernetes, Rust, GraphQL"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skillLevel" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proficiency Level ({newSkillLevel}%)</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      id="skillLevel"
                      min="10"
                      max="100"
                      step="5"
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(Number(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSkillModalOpen(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleAddSkill} className="rounded-xl gradient-brand text-white border-0">Add Skill</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Skill Level Dialog */}
          <Dialog open={!!editingSkill} onOpenChange={() => setEditingSkill(null)}>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Adjust Skill Proficiency</DialogTitle>
              </DialogHeader>
              {editingSkill && (
                <div className="space-y-4 py-3">
                  <p className="text-sm">Modify the experience level for <span className="font-bold">{editingSkill.name}</span>:</p>
                  <div className="space-y-2">
                    <Label htmlFor="editLevel" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level ({editingSkill.level}%)</Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        id="editLevel"
                        min="10"
                        max="100"
                        step="5"
                        value={editingSkill.level}
                        onChange={(e) => setEditingSkill({ ...editingSkill, level: Number(e.target.value) })}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setEditingSkill(null)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleEditSkillSave} className="rounded-xl gradient-brand text-white border-0">Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </main>
      </div>
    </div>
  );
}
