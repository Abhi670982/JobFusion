'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, ArrowLeft, User, Mail, Briefcase, MapPin,
  Edit3, Save, Loader2, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  fetchCurrentUser,
  fetchProfile,
  updateProfile,
  DbUser,
  DbProfile
} from '@/lib/api-helper';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Profile states
  const [user, setUser] = useState<DbUser | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Edit states
  const [editOpen, setEditOpen] = useState(false);
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editExpectedSalary, setEditExpectedSalary] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    async function loadData() {
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
            setEditExpectedSalary(prof.expectedSalary || '');
          }
        }
      } catch (err) {
        console.error("Error loading settings profile data:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadData();
  }, []);

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleEditSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const updated = await updateProfile(user._id, {
        headline: editHeadline,
        bio: editBio,
        location: editLocation,
        experience: editExperience,
        expectedSalary: editExpectedSalary,
      });
      if (updated) {
        setProfile(updated);
        setEditOpen(false);
        showToast('success', 'Profile Updated', 'Your profile details have been saved successfully.');
      } else {
        showToast('error', 'Update Failed', 'Failed to update profile details.');
      }
    } catch (err) {
      console.error("Error saving profile changes:", err);
      showToast('error', 'Update Failed', 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) {
    return (
      <main className="flex-1 p-4 lg:p-6 max-w-3xl mx-auto w-full space-y-6">
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-2 transition-all touch-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your preferences and appearance</p>
        </div>

        <div className="card-premium p-6 animate-pulse space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4">
            <div className="h-28 bg-muted rounded-2xl" />
            <div className="h-28 bg-muted rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  const currentTheme = theme === 'system' ? 'dark' : theme;

  return (
    <main className="flex-1 p-4 lg:p-6 max-w-3xl mx-auto w-full space-y-6">
      {/* Back Button */}
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-2 transition-all touch-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Settings</h1>
        <p className="text-muted-foreground text-sm font-medium">Manage your preferences, profile and appearance</p>
      </div>

      {/* Profile Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="card-premium p-6 sm:p-8 space-y-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Personal Profile</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Your main identity and resume information across JobFusion.</p>
          </div>
          {!loadingProfile && profile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="rounded-xl text-xs h-8 gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
          )}
        </div>

        {loadingProfile ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !profile ? (
          <div className="text-center py-6 border border-dashed rounded-2xl p-4">
            <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold">No Profile Found</p>
            <p className="text-xs text-muted-foreground mt-1">Please complete onboarding to create your profile.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Intro */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold">{user?.fullName}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 font-medium">
                  <Mail className="w-3.5 h-3.5" /> {user?.email}
                </p>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Headline</span>
                  <span className="text-foreground text-sm font-bold block">{profile.headline || 'Not Specified'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Location</span>
                  <span className="text-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    {profile.location || 'Not Specified'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Experience</span>
                  <span className="text-foreground flex items-center gap-1 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                    {profile.experience || 'Not Specified'}
                  </span>
                </div>
                {profile.expectedSalary && (
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Expected Salary</span>
                    <span className="text-foreground text-sm font-bold block mt-0.5">₹{profile.expectedSalary}</span>
                  </div>
                )}
              </div>
            </div>

            {profile.bio && (
              <div className="pt-2 text-xs font-semibold">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">About Me (Bio)</span>
                <p className="text-muted-foreground font-medium bg-muted/30 p-3 rounded-xl border border-border/40 whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Appearance Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="card-premium p-6 sm:p-8 space-y-6"
      >
        <div>
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Appearance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Customize the visual theme of the JobFusion interface.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
          {/* Light Theme Card */}
          <button
            onClick={() => setTheme('light')}
            className={cn(
              "flex flex-col items-center gap-3.5 p-6 rounded-2xl border-2 text-center transition-all cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/40",
              currentTheme === 'light'
                ? "border-primary bg-primary/5 text-primary shadow-[0_0_25px_rgba(99,102,241,0.15)] font-semibold"
                : "border-border/60 bg-card/45 hover:bg-accent/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              currentTheme === 'light' 
                ? "bg-primary text-white scale-110 shadow-lg" 
                : "bg-muted text-muted-foreground"
            )}>
              <Sun className="w-6 h-6" />
            </div>
            <div className="text-sm">☀️ Light Mode</div>
            {currentTheme === 'light' && (
              <motion.div
                layoutId="activeThemeGlow"
                className="absolute inset-x-0 bottom-0 h-1 bg-primary"
              />
            )}
          </button>

          {/* Dark Theme Card */}
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              "flex flex-col items-center gap-3.5 p-6 rounded-2xl border-2 text-center transition-all cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/40",
              currentTheme === 'dark'
                ? "border-primary bg-primary/5 text-primary shadow-[0_0_25px_rgba(99,102,241,0.15)] font-semibold"
                : "border-border/60 bg-card/45 hover:bg-accent/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              currentTheme === 'dark' 
                ? "bg-primary text-white scale-110 shadow-lg" 
                : "bg-muted text-muted-foreground"
            )}>
              <Moon className="w-6 h-6" />
            </div>
            <div className="text-sm">🌙 Dark Mode</div>
            {currentTheme === 'dark' && (
              <motion.div
                layoutId="activeThemeGlow"
                className="absolute inset-x-0 bottom-0 h-1 bg-primary"
              />
            )}
          </button>
        </div>
      </motion.div>

      {/* Edit Profile Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Profile Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="headline" className="text-xs font-semibold text-muted-foreground uppercase">Headline</Label>
              <Input id="headline" value={editHeadline} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditHeadline(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs font-semibold text-muted-foreground uppercase">About Me (Bio)</Label>
              <Textarea id="bio" value={editBio} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditBio(e.target.value)} placeholder="Tell companies about yourself..." rows={4} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-semibold text-muted-foreground uppercase">Location</Label>
                <Input id="location" value={editLocation} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditLocation(e.target.value)} placeholder="e.g. Bengaluru, India" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-xs font-semibold text-muted-foreground uppercase">Total Experience</Label>
                <Input id="experience" value={editExperience} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditExperience(e.target.value)} placeholder="e.g. 6 years" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-xs font-semibold text-muted-foreground uppercase">Expected Salary</Label>
              <Input id="salary" value={editExpectedSalary} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditExpectedSalary(e.target.value)} placeholder="e.g. 2800000" className="rounded-xl" />
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

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl glass border shadow-2xl flex items-start gap-3 bg-card/90 ${
              toast.type === 'success' ? 'border-emerald-500/20' : 'border-rose-500/20'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4.5 h-4.5" />
              ) : (
                <AlertCircle className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                toast.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>{toast.title}</h4>
              <p className="text-sm font-semibold text-foreground mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-muted-foreground hover:text-foreground touch-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
