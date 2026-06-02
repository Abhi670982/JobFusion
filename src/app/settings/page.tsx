'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Bell, Shield, Palette, Globe, CreditCard,
  ChevronRight, Smartphone, Mail, Lock, Eye, EyeOff,
  Save, Trash2, LogOut, Moon, Sun, Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';

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
  const [notifSettings, setNotifSettings] = useState({
    jobMatches: true,
    applicationUpdates: true,
    recruiterMessages: true,
    aiRecommendations: true,
    weeklyDigest: false,
    marketingEmails: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [theme, setTheme] = useState('light');

  const toggle = (key: keyof typeof notifSettings) =>
    setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 mobile-header-offset page-content">
        <Navbar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-3xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your account preferences and settings</p>
          </div>

          <Tabs defaultValue="profile">
            <TabsList className="rounded-xl mb-6 grid grid-cols-2 sm:grid-cols-4 h-auto sm:h-10 gap-1 p-1">
              <TabsTrigger value="profile" className="rounded-lg text-xs gap-1.5 py-2"><User className="w-3.5 h-3.5" />Profile</TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-lg text-xs gap-1.5 py-2"><Bell className="w-3.5 h-3.5" />Alerts</TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg text-xs gap-1.5 py-2"><Shield className="w-3.5 h-3.5" />Security</TabsTrigger>
              <TabsTrigger value="appearance" className="rounded-lg text-xs gap-1.5 py-2"><Palette className="w-3.5 h-3.5" />Display</TabsTrigger>
            </TabsList>
 
            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-5">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
                <h2 className="font-semibold mb-5">Profile Information</h2>
                <div className="flex items-center gap-5 mb-6">
                  <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                    <AvatarFallback className="text-xl gradient-brand text-white">RS</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button size="sm" variant="outline" className="rounded-xl mb-1.5">Change Photo</Button>
                    <p className="text-xs text-muted-foreground">JPG, PNG, or WebP · Max 2MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>First Name</Label><Input defaultValue="Rahul" className="rounded-xl h-10" /></div>
                  <div className="space-y-2"><Label>Last Name</Label><Input defaultValue="Sharma" className="rounded-xl h-10" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input defaultValue="rahul@example.com" className="rounded-xl h-10" /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input defaultValue="+91 98765 43210" className="rounded-xl h-10" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Job Title</Label><Input defaultValue="Senior Frontend Engineer" className="rounded-xl h-10" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Location</Label><Input defaultValue="Bengaluru, Karnataka" className="rounded-xl h-10" /></div>
                </div>
                <Separator className="my-5" />
                <div className="flex justify-end gap-3">
                  <Button variant="outline" className="rounded-xl">Cancel</Button>
                  <Button className="rounded-xl gradient-brand text-white border-0"><Save className="w-4 h-4 mr-1.5" />Save Changes</Button>
                </div>
              </motion.div>
 
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-6">
                <h2 className="font-semibold mb-2">Job Preferences</h2>
                <p className="text-sm text-muted-foreground mb-5">Help our AI find better matches for you</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Desired Role</Label><Input defaultValue="Senior/Staff Engineer" className="rounded-xl h-10" /></div>
                  <div className="space-y-2"><Label>Expected Salary</Label><Input defaultValue="₹28L – ₹45L" className="rounded-xl h-10" /></div>
                  <div className="space-y-2"><Label>Availability</Label><Input defaultValue="30 days notice" className="rounded-xl h-10" /></div>
                  <div className="space-y-2"><Label>Work Preference</Label><Input defaultValue="Remote / Hybrid" className="rounded-xl h-10" /></div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6 space-y-1">
                <h2 className="font-semibold mb-4">Notification Preferences</h2>
                {[
                  { key: 'jobMatches', label: 'Job Matches', desc: 'New jobs matching your profile and preferences' },
                  { key: 'applicationUpdates', label: 'Application Updates', desc: 'Status changes on your job applications' },
                  { key: 'recruiterMessages', label: 'Recruiter Messages', desc: 'Direct messages from recruiters and companies' },
                  { key: 'aiRecommendations', label: 'AI Recommendations', desc: 'Smart career insights and suggestions' },
                  { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of top jobs and career insights' },
                  { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Product updates, tips, and promotions' },
                ].map(({ key, label, desc }, i) => (
                  <div key={key}>
                    <SettingRow label={label} description={desc}>
                      <Switch
                        checked={notifSettings[key as keyof typeof notifSettings]}
                        onCheckedChange={() => toggle(key as keyof typeof notifSettings)}
                      />
                    </SettingRow>
                    {i < 5 && <Separator />}
                  </div>
                ))}
              </motion.div>
            </TabsContent>

            {/* Security */}
            <TabsContent value="security" className="space-y-5">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
                <h2 className="font-semibold mb-5">Change Password</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type={showPw ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 rounded-xl h-11" />
                      <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" placeholder="Min. 8 characters" className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input type="password" placeholder="••••••••" className="rounded-xl h-11" />
                  </div>
                  <Button className="rounded-xl gradient-brand text-white border-0">Update Password</Button>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-6">
                <h2 className="font-semibold mb-4">Two-Factor Authentication</h2>
                <SettingRow label="Authenticator App" description="Use an authenticator app for 2FA">
                  <div className="flex items-center gap-3">
                    <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 rounded-full px-2">Enabled</Badge>
                    <Button variant="outline" size="sm" className="rounded-xl">Manage</Button>
                  </div>
                </SettingRow>
                <Separator />
                <SettingRow label="SMS Authentication" description="Receive codes via text message">
                  <Switch />
                </SettingRow>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-premium p-6 border-destructive/20">
                <h2 className="font-semibold text-destructive mb-4">Danger Zone</h2>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign Out of All Devices
                  </Button>
                  <Button variant="outline" className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
                <h2 className="font-semibold mb-5">Appearance</h2>
                <div>
                  <Label className="text-sm mb-3 block">Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', icon: Sun, label: 'Light' },
                      { id: 'dark', icon: Moon, label: 'Dark' },
                      { id: 'system', icon: Monitor, label: 'System' },
                    ].map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        onClick={() => setTheme(id)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}
                      >
                        <Icon className={`w-5 h-5 ${theme === id ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-xs font-medium ${theme === id ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
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
      </div>
    </div>
  );
}
