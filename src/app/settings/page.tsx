'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User, Bell, Shield, Palette,
  Save, Trash2, LogOut, Moon, Sun, Monitor,
  Camera, Loader2, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchCurrentUser, fetchProfile, updateProfile, DbUser, DbProfile } from '@/lib/api-helper';
import { useClerk } from '@clerk/nextjs';

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}


export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data states
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<DbUser | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('jobseeker');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  


  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const prof = await fetchProfile(currentUser._id);
          setProfile(prof);
          if (prof) {
            setFullName(currentUser.fullName);
            setEmail(currentUser.email);
            setRole(currentUser.role);
            setHeadline(prof.headline || '');
            setLocation(prof.location || '');
            setPhone(prof.phone || '');
            setExpectedSalary(prof.expectedSalary || '');
            setNoticePeriod(prof.noticePeriod || '');

          }
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      const updated = await updateProfile(user._id, {
        fullName,
        email,
        headline,
        location,
        phone,
      } as any);

      if (updated) {
        setProfile(updated);
        // Update local user state
        setUser(prev => prev ? { ...prev, fullName, email } : null);
        showToast('success', 'Settings updated successfully!');
      } else {
        showToast('error', 'Failed to update settings.');
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Something went wrong.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Image size must be under 2MB');
      return;
    }

    setUploading(true);
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
        showToast('success', 'Profile picture updated successfully!');
      } else {
        showToast('error', data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
      showToast('error', 'Something went wrong while uploading.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirm = window.confirm("Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.");
    if (!confirm) return;

    try {
      const res = await fetch(`/api/profile?userId=${user._id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        alert("Your account has been deleted. Logging you out...");
        await signOut();
        window.location.href = '/';
      } else {
        showToast('error', data.error || 'Failed to delete account.');
      }
    } catch (err) {
      console.error("Delete account error:", err);
      showToast('error', 'Something went wrong.');
    }
  };



  const getInitials = () => {
    if (fullName) return fullName.slice(0, 2).toUpperCase();
    return 'US';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

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
          
          {/* Toast Notification */}
          {toast && (
            <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm border font-medium ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                : 'bg-destructive/10 border-destructive/25 text-destructive'
            }`}>
              <span>{toast.message}</span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your profile, preferences, and notifications</p>
          </div>

          <Tabs defaultValue="profile">
            <TabsList className="rounded-xl mb-6 grid grid-cols-3 h-auto sm:h-10 gap-1 p-1">
              <TabsTrigger value="profile" className="rounded-lg text-xs gap-1.5 py-2"><User className="w-3.5 h-3.5" />Profile</TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg text-xs gap-1.5 py-2"><Shield className="w-3.5 h-3.5" />Security</TabsTrigger>
              <TabsTrigger value="appearance" className="rounded-lg text-xs gap-1.5 py-2"><Palette className="w-3.5 h-3.5" />Display</TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-5">
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
                  <h2 className="font-semibold mb-5 text-base">Personal Information</h2>
                  
                  <div className="flex items-center gap-5 mb-6">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                      <Avatar className="w-16 h-16 ring-4 ring-primary/20 hover:opacity-85 transition-opacity">
                        <AvatarImage src={user?.profileImage} alt={fullName} />
                        <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleAvatarChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                    <div>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        className="rounded-xl mb-1.5"
                        onClick={handleAvatarClick}
                        disabled={uploading}
                      >
                        {uploading ? 'Uploading...' : 'Change Photo'}
                      </Button>
                      <p className="text-xs text-muted-foreground">JPG, PNG, or WebP · Max 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        className="rounded-xl h-10" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input 
                        id="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="rounded-xl h-10" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        className="rounded-xl h-10" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)} 
                        className="rounded-xl h-10" 
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="headline">Headline / Job Title</Label>
                      <Input 
                        id="headline" 
                        value={headline} 
                        onChange={(e) => setHeadline(e.target.value)} 
                        className="rounded-xl h-10" 
                        placeholder="e.g. Senior Full Stack Engineer | React & Node.js"
                      />
                    </div>
                  </div>

                  <Separator className="my-5" />
                  <div className="flex justify-end pt-2">
                    <Button 
                      type="submit" 
                      className="rounded-xl gradient-brand text-white border-0 shadow-lg touch-auto"
                      disabled={updating}
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1.5" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </form>
            </TabsContent>



            {/* Security */}
            <TabsContent value="security" className="space-y-5">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
                <h2 className="font-semibold mb-3">Clerk Security Management</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  JobFusion integrates with Clerk for enterprise-grade authentication. To manage passwords, active sessions, and multi-factor authentication, please use Clerk Account Settings.
                </p>
                <Button variant="outline" className="rounded-xl" onClick={() => window.open('https://accounts.clerk.com', '_blank')}>
                  Open Clerk Account Center
                </Button>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-6 border-destructive/20">
                <h2 className="font-semibold text-destructive mb-2">Danger Zone</h2>
                <p className="text-xs text-muted-foreground mb-4">Deleting your account is permanent. All your job applications, saved jobs, resumes, and profile information will be deleted forever.</p>
                <div className="space-y-3">
                  <Button 
                    onClick={handleDeleteAccount} 
                    variant="outline" 
                    className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 gap-2 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete My Account
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
                <h2 className="font-semibold mb-5">Appearance</h2>
                <p className="text-sm text-muted-foreground mb-4">Display theme is configured automatically based on your system and the top navigation bar toggles.</p>
                <Separator className="my-5" />
                <SettingRow label="Compact Mode" description="Reduce spacing for a denser layout">
                  <Switch />
                </SettingRow>
                <Separator />
                <SettingRow label="Animations" description="Enable smooth animations and transitions">
                  <Switch defaultChecked />
                </SettingRow>
              </motion.div>
            </TabsContent>
          </Tabs>
        </main>
  );
}
