'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, MapPin, Briefcase, GraduationCap, Award, Code2,
  Plus, Edit3, Star, CheckCircle2,
  Link2, ExternalLink, Globe, Camera, Phone, Mail,
  Cloud, Smartphone, Palette, Save, Trash2, Upload, FileText, Loader2, AlertCircle, ArrowLeft, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  fetchCurrentUser,
  fetchProfile,
  updateProfile,
  DbUser,
  DbProfile
} from '@/lib/api-helper';
import { cn } from '@/lib/utils';
import { calculateCompletion } from '@/lib/profile-completion';

const certIconMap: Record<string, React.ComponentType<any>> = {
  cloud: Cloud,
  smartphone: Smartphone,
  palette: Palette,
};

function SectionCard({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-premium p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DbUser | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);

  // Edit Profile States
  const [editOpen, setEditOpen] = useState(false);
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editNoticePeriod, setEditNoticePeriod] = useState('');
  const [editExpectedSalary, setEditExpectedSalary] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editPortfolio, setEditPortfolio] = useState('');
  const [saving, setSaving] = useState(false);

  // Upload states
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Toast notifications state
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  const triggerConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmAction({ title, description, onConfirm });
    setConfirmOpen(true);
  };

  // Skill Modals State
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(80);
  const [editingSkill, setEditingSkill] = useState<{ index: number; name: string; level: number } | null>(null);

  // Experience Modal States
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null);
  const [expCompany, setExpCompany] = useState('');
  const [expRole, setExpRole] = useState('');
  const [expPeriod, setExpPeriod] = useState('');
  const [expDuration, setExpDuration] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expSkillsString, setExpSkillsString] = useState('');

  // Education Modal States
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [editingEduIndex, setEditingEduIndex] = useState<number | null>(null);
  const [eduSchool, setEduSchool] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduPeriod, setEduPeriod] = useState('');

  // Project Modal States
  const [projModalOpen, setProjModalOpen] = useState(false);
  const [editingProjIndex, setEditingProjIndex] = useState<number | null>(null);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStars, setProjStars] = useState(0);
  const [projTechString, setProjTechString] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const prof = await fetchProfile(currentUser._id);
          if (prof) {
            setProfile(prof);
            setEditHeadline(prof.headline || '');
            setEditBio(prof.bio || '');
            setEditLocation(prof.location || '');
            setEditExperience(prof.experience || '');
            setEditNoticePeriod(prof.noticePeriod || '30 days');
            setEditExpectedSalary(prof.expectedSalary || '₹28L – ₹45L');
            setEditPhone(prof.phone || '');
            setEditGithub(prof.githubUrl || '');
            setEditLinkedin(prof.linkedinUrl || '');
            setEditPortfolio(prof.portfolioUrl || '');
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleEditSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const updated = await updateProfile(user._id, {
        headline: editHeadline,
        bio: editBio,
        location: editLocation,
        experience: editExperience,
        noticePeriod: editNoticePeriod,
        expectedSalary: editExpectedSalary,
        phone: editPhone,
        githubUrl: editGithub,
        linkedinUrl: editLinkedin,
        portfolioUrl: editPortfolio
      });
      if (updated) {
        setProfile(updated);
        setEditOpen(false);
      }
    } catch (err) {
      console.error("Error saving profile changes:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingResume(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user._id);

    try {
      const res = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data) {
        const prof = await fetchProfile(user._id);
        if (prof) {
          setProfile(prof);
          if (prof.skills) setProfile(prev => prev ? { ...prev, skills: prof.skills } : null);
        }
        showToast('success', 'Resume Uploaded', `Resume uploaded and parsed successfully! Extracted ${data.data.skillsExtracted} skills.`);
      } else {
        showToast('error', 'Upload Failed', data.error || "Failed to upload resume.");
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Upload Error', "Something went wrong during resume upload.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setUser(prev => prev ? { ...prev, profileImage: data.imageUrl } : null);
        showToast('success', 'Avatar Updated', "Profile picture updated successfully!");
      } else {
        showToast('error', 'Upload Failed', data.error || "Failed to upload profile photo.");
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Upload Error', "Something went wrong uploading profile photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Skills Editing
  const handleAddSkill = async () => {
    if (!user || !profile || !newSkillName.trim()) return;
    const exists = profile.skills.some(
      (s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase()
    );
    if (exists) return;

    const updatedSkills = [...profile.skills, { name: newSkillName.trim(), level: 100 }];
    try {
      const updated = await updateProfile(user._id, { skills: updatedSkills });
      if (updated) {
        setProfile(updated);
        setNewSkillName('');
        setNewSkillLevel(80);
        setSkillModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to add skill:", err);
    }
  };

  const handleRemoveSkill = async (skillName: string) => {
    if (!user || !profile) return;
    const updatedSkills = profile.skills.filter((s) => s.name !== skillName);
    try {
      const updated = await updateProfile(user._id, { skills: updatedSkills });
      if (updated) {
        setProfile(updated);
      }
    } catch (err) {
      console.error("Failed to remove skill:", err);
    }
  };

  // Experience Adding / Editing / Deleting
  const handleOpenExpModal = (index: number | null = null) => {
    if (index !== null && profile?.experiences) {
      const exp = profile.experiences[index];
      setEditingExpIndex(index);
      setExpCompany(exp.company || '');
      setExpRole(exp.role || '');
      setExpPeriod(exp.period || '');
      setExpDuration(exp.duration || '');
      setExpDesc(exp.description || '');
      setExpSkillsString(exp.skills?.join(', ') || '');
    } else {
      setEditingExpIndex(null);
      setExpCompany('');
      setExpRole('');
      setExpPeriod('');
      setExpDuration('');
      setExpDesc('');
      setExpSkillsString('');
    }
    setExpModalOpen(true);
  };

  const handleSaveExperience = async () => {
    if (!user || !profile) return;
    
    const newExp = {
      company: expCompany,
      role: expRole,
      period: expPeriod,
      duration: expDuration,
      description: expDesc,
      skills: expSkillsString.split(',').map(s => s.trim()).filter(Boolean),
      companyColor: '#6366f1',
      logo: expCompany.charAt(0).toUpperCase()
    };

    let updatedExps = [...(profile.experiences || [])];
    if (editingExpIndex !== null) {
      updatedExps[editingExpIndex] = newExp;
    } else {
      updatedExps.push(newExp);
    }

    try {
      const updated = await updateProfile(user._id, { experiences: updatedExps });
      if (updated) {
        setProfile(updated);
        setExpModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to save experience:", err);
    }
  };

  const handleDeleteExperience = async (index: number) => {
    if (!user || !profile) return;
    triggerConfirm(
      "Delete Experience",
      "Are you sure you want to delete this experience entry?",
      async () => {
        const updatedExps = profile.experiences.filter((_, i) => i !== index);
        try {
          const updated = await updateProfile(user._id, { experiences: updatedExps });
          if (updated) {
            setProfile(updated);
            showToast('success', 'Experience Deleted', 'The work experience entry has been deleted.');
          }
        } catch (err) {
          console.error("Failed to delete experience:", err);
          showToast('error', 'Error', 'Failed to delete experience entry.');
        }
      }
    );
  };

  // Education Adding / Editing / Deleting
  const handleOpenEduModal = (index: number | null = null) => {
    if (index !== null && profile?.education) {
      const edu = profile.education[index];
      setEditingEduIndex(index);
      setEduSchool(edu.school || '');
      setEduDegree(edu.degree || '');
      setEduPeriod(edu.period || '');
    } else {
      setEditingEduIndex(null);
      setEduSchool('');
      setEduDegree('');
      setEduPeriod('');
    }
    setEduModalOpen(true);
  };

  const handleSaveEducation = async () => {
    if (!user || !profile) return;
    
    const newEdu = {
      school: eduSchool,
      degree: eduDegree,
      period: eduPeriod,
      logo: eduSchool.charAt(0).toUpperCase(),
      color: '#003580'
    };

    let updatedEdus = [...(profile.education || [])];
    if (editingEduIndex !== null) {
      updatedEdus[editingEduIndex] = newEdu;
    } else {
      updatedEdus.push(newEdu);
    }

    try {
      const updated = await updateProfile(user._id, { education: updatedEdus });
      if (updated) {
        setProfile(updated);
        setEduModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to save education:", err);
    }
  };

  const handleDeleteEducation = async (index: number) => {
    if (!user || !profile) return;
    triggerConfirm(
      "Delete Education",
      "Are you sure you want to delete this education history?",
      async () => {
        const updatedEdus = profile.education.filter((_, i) => i !== index);
        try {
          const updated = await updateProfile(user._id, { education: updatedEdus });
          if (updated) {
            setProfile(updated);
            showToast('success', 'Education Deleted', 'The education entry has been deleted.');
          }
        } catch (err) {
          console.error("Failed to delete education:", err);
          showToast('error', 'Error', 'Failed to delete education entry.');
        }
      }
    );
  };

  // Projects Adding / Editing / Deleting
  const handleOpenProjModal = (index: number | null = null) => {
    if (index !== null && profile?.projects) {
      const proj = profile.projects[index];
      setEditingProjIndex(index);
      setProjName(proj.name || '');
      setProjDesc(proj.description || '');
      setProjStars(Number(proj.stars) || 0);
      setProjTechString(proj.tech?.join(', ') || '');
    } else {
      setEditingProjIndex(null);
      setProjName('');
      setProjDesc('');
      setProjStars(0);
      setProjTechString('');
    }
    setProjModalOpen(true);
  };

  const handleSaveProject = async () => {
    if (!user || !profile) return;
    
    const newProj = {
      name: projName,
      description: projDesc,
      stars: projStars.toString(),
      tech: projTechString.split(',').map(t => t.trim()).filter(Boolean),
      link: '#'
    };

    let updatedProjs = [...(profile.projects || [])];
    if (editingProjIndex !== null) {
      updatedProjs[editingProjIndex] = newProj;
    } else {
      updatedProjs.push(newProj);
    }

    try {
      const updated = await updateProfile(user._id, { projects: updatedProjs });
      if (updated) {
        setProfile(updated);
        setProjModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to save project:", err);
    }
  };

  const handleDeleteProject = async (index: number) => {
    if (!user || !profile) return;
    triggerConfirm(
      "Delete Project",
      "Are you sure you want to delete this project?",
      async () => {
        const updatedProjs = profile.projects.filter((_, i) => i !== index);
        try {
          const updated = await updateProfile(user._id, { projects: updatedProjs });
          if (updated) {
            setProfile(updated);
            showToast('success', 'Project Deleted', 'The project has been deleted.');
          }
        } catch (err) {
          console.error("Failed to delete project:", err);
          showToast('error', 'Error', 'Failed to delete project.');
        }
      }
    );
  };

  const getInitials = () => {
    if (!user) return 'US';
    const names = user.fullName.split(' ');
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`;
    return names[0].slice(0, 2).toUpperCase();
  };

  const completion = calculateCompletion(profile, user);

  return (
    <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-5xl mx-auto w-full space-y-5">
      {/* Back Button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="h-8 px-2.5 rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent -ml-2 transition-all touch-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            My Profile
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Keep your profile updated to get better job recommendations
          </p>
        </div>
        {!loading && profile && (
          <Button onClick={() => setEditOpen(true)} className="rounded-xl gradient-brand text-white border-0 gap-1.5 text-sm h-10 px-4 shadow-md glow-sm btn-press touch-auto">
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse skeleton-shimmer">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-60 w-full rounded-2xl" />
            <Skeleton className="h-60 md:col-span-2 w-full rounded-2xl" />
          </div>
        </div>
      ) : !profile ? (
        <div className="card-premium p-10 text-center space-y-4">
          <h2 className="text-xl font-bold">No profile found</h2>
          <p className="text-muted-foreground">Please sign out and sign in again to sync your profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium p-6 text-center relative"
            >
              <div className="relative inline-block mb-4">
                <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                  <AvatarImage src={user?.profileImage} alt={user?.fullName} />
                  <AvatarFallback className="text-2xl font-bold gradient-brand text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <button 
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors touch-auto"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <h2
                className="text-lg font-bold mb-1"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {user?.fullName}
              </h2>
              <p className="text-muted-foreground text-xs font-semibold mb-2">{profile.headline || 'Add a professional headline'}</p>
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mb-4 font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                {profile.location || 'Location Not Specified'}
              </div>

              {/* Social Links */}
              <div className="flex justify-center gap-2 mb-5">
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all touch-auto"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all touch-auto"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {profile.portfolioUrl && (
                  <a
                    href={profile.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all touch-auto"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </a>
                )}
                {!profile.githubUrl && !profile.linkedinUrl && !profile.portfolioUrl && (
                  <p className="text-[10px] text-muted-foreground font-semibold">No social links added</p>
                )}
              </div>

              <Separator className="mb-4" />
              <div className="text-left space-y-2.5 text-xs font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Experience
                  </span>
                  <span className="font-bold">{profile.experience || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </span>
                  <span className="font-bold text-xs truncate max-w-[120px]">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </span>
                  <span className="font-bold text-xs">{profile.phone || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Expected Salary</span>
                  <span className="font-bold">{profile.expectedSalary || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Notice Period</span>
                  <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 rounded-full px-2 border">
                    {profile.noticePeriod || 'Immediate'}
                  </Badge>
                </div>
              </div>
            </motion.div>

            {/* Profile Strength */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-premium p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Profile Strength</h3>
                <span className="text-sm font-bold text-primary">{completion}%</span>
              </div>
              <Progress value={completion} className="h-1.5 mb-4" />
              <div className="space-y-2">
                {[
                  { label: 'Basic information', done: !!user?.fullName && !!user?.email },
                  { label: 'Work experience', done: (profile?.experiences?.length || 0) > 0 },
                  { label: 'Education', done: (profile?.education?.length || 0) > 0 },
                  { label: 'Skills Added', done: (profile?.skills?.length || 0) > 0 },
                  { label: 'Resume Uploaded', done: !!profile?.resumeUrl },
                  { label: 'Projects Completed', done: (profile?.projects?.length || 0) > 0 },
                  { label: 'Profile Photo Set', done: !!user?.profileImage },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    {item.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className={item.done ? 'text-foreground font-semibold' : 'text-muted-foreground font-medium'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Resume section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <SectionCard
                title="Resume"
                icon={FileText}
                action={
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="rounded-lg gap-1.5 text-xs h-8 touch-auto"
                      disabled={uploadingResume}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {profile.resumeUrl ? 'Replace' : 'Upload'}
                    </Button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleResumeUpload} 
                      accept=".pdf,.docx" 
                      className="hidden" 
                    />
                  </div>
                }
              >
                {uploadingResume ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 animate-pulse justify-center">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <p className="text-xs font-semibold">Uploading & extracting skills...</p>
                  </div>
                ) : profile.resumeUrl ? (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate max-w-[200px] sm:max-w-xs">{profile.resumeName || 'resume.pdf'}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Updated {profile.resumeUpdatedAt ? new Date(profile.resumeUpdatedAt).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-border rounded-xl space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-500">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">No Resume Uploaded</p>
                      <p className="text-[10px] text-muted-foreground max-w-xs mx-auto px-4 mt-0.5">Upload a resume to automatically fill your skills and improve matches.</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="rounded-xl text-xs gradient-brand text-white border-0 shadow-md glow-sm btn-press touch-auto"
                    >
                      Upload Resume
                    </Button>
                  </div>
                )}
              </SectionCard>
            </motion.div>

            {/* Bio / About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <SectionCard title="About Me" icon={User}>
                {profile.bio ? (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line font-medium">{profile.bio}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Add details about yourself by clicking Edit Profile.</p>
                )}
              </SectionCard>
            </motion.div>

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <SectionCard
                title="Skills"
                icon={Code2}
                action={
                  <Button size="sm" variant="ghost" onClick={() => setSkillModalOpen(true)} className="rounded-lg gap-1.5 text-xs h-8 touch-auto">
                    <Plus className="w-3.5 h-3.5" />
                    Add Skill
                  </Button>
                }
              >
                <div className="flex flex-wrap gap-2.5">
                  {(!profile.skills || profile.skills.length === 0) ? (
                    <p className="text-xs text-muted-foreground italic">No skills added yet. Click Add Skill to add manually or upload a resume.</p>
                  ) : (
                    profile.skills.map((skill, index) => (
                      <div key={skill.name} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl bg-muted/50 border border-border/80 text-xs hover:border-primary/30 transition-all group">
                        <span className="font-semibold">{skill.name}</span>
                        <button onClick={() => handleRemoveSkill(skill.name)} className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors ml-1 touch-auto">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </motion.div>

            {/* Experience */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SectionCard
                title="Work Experience"
                icon={Briefcase}
                action={
                  <Button size="sm" variant="ghost" onClick={() => handleOpenExpModal(null)} className="rounded-lg gap-1.5 text-xs h-8 touch-auto">
                    <Plus className="w-3.5 h-3.5" />
                    Add Experience
                  </Button>
                }
              >
                <div className="space-y-5">
                  {(!profile.experiences || profile.experiences.length === 0) ? (
                    <p className="text-xs text-muted-foreground italic">No experience entries. Click Add Experience to add details.</p>
                  ) : (
                    profile.experiences.map((exp, i) => (
                      <div key={i}>
                        <div className="flex gap-4">
                          <div
                            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-extrabold text-sm flex-shrink-0"
                          >
                            {exp.company.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm">{exp.role}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {exp.company} · {exp.period} {exp.duration ? `· ${exp.duration}` : ''}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenExpModal(i)}
                                  className="rounded-lg p-1 h-auto touch-auto"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteExperience(i)}
                                  className="rounded-lg p-1 h-auto text-destructive hover:text-destructive hover:bg-destructive/10 touch-auto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line font-medium">
                              {exp.description}
                            </p>
                            {exp.skills && exp.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {exp.skills.map((s) => (
                                  <Badge key={s} variant="secondary" className="text-[10px] rounded-md px-2">
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {i < (profile.experiences?.length || 0) - 1 && <Separator className="mt-4" />}
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </motion.div>

            {/* Education */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <SectionCard 
                title="Education" 
                icon={GraduationCap}
                action={
                  <Button size="sm" variant="ghost" onClick={() => handleOpenEduModal(null)} className="rounded-lg gap-1.5 text-xs h-8 touch-auto">
                    <Plus className="w-3.5 h-3.5" />
                    Add Education
                  </Button>
                }
              >
                <div className="space-y-4">
                  {(!profile.education || profile.education.length === 0) ? (
                    <p className="text-xs text-muted-foreground italic">No education entries. Click Add Education to add details.</p>
                  ) : (
                    profile.education.map((edu, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex gap-3">
                          <div
                            className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-extrabold text-sm flex-shrink-0"
                          >
                            {edu.school.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{edu.school}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {edu.degree} {edu.period ? `· ${edu.period}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEduModal(i)}
                            className="rounded-lg p-1 h-auto touch-auto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEducation(i)}
                            className="rounded-lg p-1 h-auto text-destructive hover:text-destructive hover:bg-destructive/10 touch-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </motion.div>

            {/* Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SectionCard
                title="Projects"
                icon={Code2}
                action={
                  <Button size="sm" variant="ghost" onClick={() => handleOpenProjModal(null)} className="rounded-lg gap-1.5 text-xs h-8 touch-auto">
                    <Plus className="w-3.5 h-3.5" />
                    Add Project
                  </Button>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(!profile.projects || profile.projects.length === 0) ? (
                    <p className="text-xs text-muted-foreground italic sm:col-span-2">No projects added. Click Add Project to list yours.</p>
                  ) : (
                    profile.projects.map((proj, i) => (
                      <div
                        key={i}
                        className="border border-border rounded-xl p-4 hover:border-primary/40 transition-all group relative"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-xs sm:text-sm group-hover:text-primary transition-colors pr-8">
                            {proj.name}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            {proj.stars || 0}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed font-semibold">
                          {proj.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {proj.tech.map((t) => (
                            <Badge key={t} variant="secondary" className="text-[9px] rounded-md px-1.5 py-0.5 bg-muted text-muted-foreground">
                              {t}
                            </Badge>
                          ))}
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity bg-background/80 rounded p-0.5">
                          <button
                            onClick={() => handleOpenProjModal(i)}
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors touch-auto"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(i)}
                            className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors touch-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </motion.div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Profile Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="headline" className="text-xs font-semibold text-muted-foreground uppercase">Headline</Label>
              <Input id="headline" value={editHeadline} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditHeadline(e.target.value)} placeholder="e.g. Senior Frontend Engineer at Razorpay" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs font-semibold text-muted-foreground uppercase">About Me (Bio)</Label>
              <Textarea id="bio" value={editBio} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditBio(e.target.value)} placeholder="Tell companies about yourself..." rows={4} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-semibold text-muted-foreground uppercase">Location</Label>
                <Input id="location" value={editLocation} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditLocation(e.target.value)} placeholder="e.g. Bengaluru, Karnataka" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-xs font-semibold text-muted-foreground uppercase">Total Experience</Label>
                <Input id="experience" value={editExperience} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditExperience(e.target.value)} placeholder="e.g. 6 years" className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary" className="text-xs font-semibold text-muted-foreground uppercase">Expected Salary</Label>
                <Input id="salary" value={editExpectedSalary} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditExpectedSalary(e.target.value)} placeholder="e.g. ₹28L – ₹45L" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notice" className="text-xs font-semibold text-muted-foreground uppercase">Notice Period</Label>
                <Input id="notice" value={editNoticePeriod} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditNoticePeriod(e.target.value)} placeholder="e.g. 30 days" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</Label>
              <Input id="phone" value={editPhone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditPhone(e.target.value)} placeholder="e.g. +91 98765 43210" className="rounded-xl" />
            </div>
            
            <Separator className="my-2" />
            <h3 className="text-sm font-semibold">Social Profiles</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="github" className="text-xs font-semibold text-muted-foreground uppercase">GitHub Link</Label>
                <Input id="github" value={editGithub} onChange={(e) => setEditGithub(e.target.value)} placeholder="https://github.com/..." className="rounded-xl h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-xs font-semibold text-muted-foreground uppercase">LinkedIn Link</Label>
                <Input id="linkedin" value={editLinkedin} onChange={(e) => setEditLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="rounded-xl h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio" className="text-xs font-semibold text-muted-foreground uppercase">Portfolio Link</Label>
                <Input id="portfolio" value={editPortfolio} onChange={(e) => setEditPortfolio(e.target.value)} placeholder="https://..." className="rounded-xl h-10" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving} className="rounded-xl gradient-brand text-white border-0 gap-1.5 shadow-md glow-sm btn-press touch-auto">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Experience Add/Edit Dialog */}
      <Dialog open={expModalOpen} onOpenChange={setExpModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingExpIndex !== null ? 'Edit Work Experience' : 'Add Work Experience'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="expCompany">Company Name</Label>
              <Input id="expCompany" value={expCompany} onChange={(e) => setExpCompany(e.target.value)} placeholder="e.g. Google" className="rounded-xl" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expRole">Role / Job Title</Label>
              <Input id="expRole" value={expRole} onChange={(e) => setExpRole(e.target.value)} placeholder="e.g. Software Engineer" className="rounded-xl" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="expPeriod">Period</Label>
                <Input id="expPeriod" value={expPeriod} onChange={(e) => setExpPeriod(e.target.value)} placeholder="e.g. 2021 - Present" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expDuration">Duration</Label>
                <Input id="expDuration" value={expDuration} onChange={(e) => setExpDuration(e.target.value)} placeholder="e.g. 2 years" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expDesc">Description</Label>
              <Textarea id="expDesc" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="Describe your achievements and duties..." rows={3} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expSkills">Skills Used (comma separated)</Label>
              <Input id="expSkills" value={expSkillsString} onChange={(e) => setExpSkillsString(e.target.value)} placeholder="e.g. React, Node.js, Mongoose" className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExpModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveExperience} className="rounded-xl gradient-brand text-white border-0 shadow-md glow-sm btn-press touch-auto">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education Add/Edit Dialog */}
      <Dialog open={eduModalOpen} onOpenChange={setEduModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingEduIndex !== null ? 'Edit Education' : 'Add Education'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="eduSchool">School / University Name</Label>
              <Input id="eduSchool" value={eduSchool} onChange={(e) => setEduSchool(e.target.value)} placeholder="e.g. Stanford University" className="rounded-xl" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eduDegree">Degree / Credential</Label>
              <Input id="eduDegree" value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} placeholder="e.g. B.S. in Computer Science" className="rounded-xl" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eduPeriod">Study Period</Label>
              <Input id="eduPeriod" value={eduPeriod} onChange={(e) => setEduPeriod(e.target.value)} placeholder="e.g. 2018 - 2022" className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEduModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveEducation} className="rounded-xl gradient-brand text-white border-0 shadow-md glow-sm btn-press touch-auto">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Add/Edit Dialog */}
      <Dialog open={projModalOpen} onOpenChange={setProjModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingProjIndex !== null ? 'Edit Project' : 'Add Project'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="projName">Project Name</Label>
              <Input id="projName" value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="e.g. JobFusion SaaS" className="rounded-xl" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projDesc">Project Description</Label>
              <Textarea id="projDesc" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="What does this project do?" rows={3} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projStars">GitHub Stars (Optional)</Label>
              <Input id="projStars" type="number" value={projStars} onChange={(e) => setProjStars(Number(e.target.value))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projTech">Technologies (comma separated)</Label>
              <Input id="projTech" value={projTechString} onChange={(e) => setProjTechString(e.target.value)} placeholder="e.g. Next.js, Tailwind, MongoDB" className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setProjModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveProject} className="rounded-xl gradient-brand text-white border-0 shadow-md glow-sm btn-press touch-auto">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                dropdownDirection="up"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSkillModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleAddSkill} className="rounded-xl gradient-brand text-white border-0 shadow-md glow-sm btn-press touch-auto">Add Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl glass border shadow-2xl flex items-start gap-3 bg-card/90 ${
              toast.type === 'success'
                ? 'border-emerald-500/20'
                : toast.type === 'error'
                ? 'border-rose-500/20'
                : 'border-blue-500/20'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-500'
                : toast.type === 'error'
                ? 'bg-rose-500/10 text-rose-500'
                : 'bg-blue-500/10 text-blue-500'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4.5 h-4.5" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4.5 h-4.5" />
              ) : (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                toast.type === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : toast.type === 'error'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}>{toast.title}</h4>
              <p className="text-sm font-semibold text-foreground mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-muted-foreground hover:text-foreground touch-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{confirmAction?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">{confirmAction?.description}</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="rounded-xl flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                confirmAction?.onConfirm();
                setConfirmOpen(false);
              }} 
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white flex-1 sm:flex-none btn-press touch-auto"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
