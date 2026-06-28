'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Briefcase, MapPin, GraduationCap, Sparkles, Upload, Plus, X,
  ChevronRight, ChevronLeft, Loader2, CheckCircle2, AlertCircle, FileText, Smile, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@clerk/nextjs';
import { fetchCurrentUser, fetchProfile, updateProfile, DbUser, DbProfile } from '@/lib/api-helper';

export default function OnboardingPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<DbUser | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form Fields
  // Step 1: Professional Info
  const [headline, setHeadline] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [expectedSalary, setExpectedSalary] = useState('');

  // Step 2: Location & Education
  const [location, setLocation] = useState('');
  const [school, setSchool] = useState('');
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [gradYear, setGradYear] = useState('');

  // Step 3: Resume & Skills
  const [resumeName, setResumeName] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [skills, setSkills] = useState<{ name: string; level: number }[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const prof = await fetchProfile(currentUser._id);
          setProfile(prof);
          
          // If already onboarded, redirect to dashboard
          if (prof && prof.isOnboarded) {
            router.push('/dashboard');
            return;
          }
          
          // Prepopulate details if available
          if (prof) {
            setHeadline(prof.headline || '');
            setLocation(prof.location || '');
            setExpectedSalary(prof.expectedSalary || '');
            if (prof.skills) setSkills(prof.skills);
            if (prof.resumeName) {
              setResumeName(prof.resumeName);
              setResumeUrl(prof.resumeUrl || '');
            }
          }
        } else {
          router.push('/sign-in');
        }
      } catch (err) {
        console.error("Error loading onboarding details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleSkip = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await updateProfile(user._id, {
        isOnboarded: true
      } as any);
      router.push('/dashboard');
    } catch (err) {
      console.error("Error skipping onboarding:", err);
      setErrorMsg("Failed to update onboarding state. Please try again.");
      setSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const exists = skills.some(s => s.name.toLowerCase() === newSkill.trim().toLowerCase());
    if (!exists) {
      setSkills(prev => [...prev, { name: newSkill.trim(), level: 80 }]);
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkills(prev => prev.filter(s => s.name !== skillName));
  };

  const handleResumeUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'pdf' && extension !== 'docx') {
      setErrorMsg("Only PDF and DOCX files are allowed");
      return;
    }

    setUploading(true);
    setErrorMsg('');
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
        setResumeName(data.data.resumeName);
        setResumeUrl(data.data.resumeUrl);
        if (data.data.skills) {
          setSkills(data.data.skills);
        }
      } else {
        setErrorMsg(data.error || "Failed to process resume");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error during resume upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setErrorMsg('');

    // Construct education and experience elements if provided
    const educationEntries = [];
    if (school || degree || fieldOfStudy) {
      educationEntries.push({
        school: school || 'N/A',
        degree: degree || 'Degree',
        fieldOfStudy: fieldOfStudy || 'Field',
        startYear: '2020', // Default placeholders
        endYear: gradYear || '2024',
        current: !gradYear
      });
    }

    const payload = {
      headline,
      location,
      expectedSalary,
      skills,
      resumeUrl,
      resumeName,
      education: educationEntries,
      experience: experienceLevel, // Experience level label
      isOnboarded: true
    };

    try {
      const updated = await updateProfile(user._id, payload as any);
      if (updated) {
        router.push('/dashboard');
      } else {
        setErrorMsg("Failed to save your onboarding details.");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Onboarding submission error:", err);
      setErrorMsg("Something went wrong. Please check your inputs.");
      setSubmitting(false);
    }
  };

  const getGreetingName = () => {
    if (user?.fullName) return user.fullName.split(' ')[0];
    if (clerkUser?.firstName) return clerkUser.firstName;
    return 'there';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mesh-bg flex flex-col justify-between pt-6 pb-12 px-4">
      {/* Top Header */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight">
            <span className="gradient-brand-text">Job</span>
            <span className="text-foreground">Fusion</span>
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSkip}
          disabled={submitting}
          className="rounded-xl text-muted-foreground hover:text-foreground text-xs"
        >
          Skip Onboarding
        </Button>
      </div>

      {/* Main Wizard Card */}
      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-6 sm:p-8 relative overflow-hidden"
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <motion.div 
              className="h-full gradient-brand"
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="mb-6 flex justify-between items-center text-xs text-muted-foreground mt-2">
            <span>STEP {step} OF {totalSteps}</span>
            <span className="font-medium text-primary">
              {step === 1 && 'Professional Info'}
              {step === 2 && 'Location & Education'}
              {step === 3 && 'Resume & Skills'}
            </span>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Professional Info */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      Welcome, {getGreetingName()}! <Smile className="w-5.5 h-5.5 text-amber-500" />
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Let's set up your professional profile to tailor job matches. What role are you looking for?
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="headline">Desired Job Title / Role</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="headline"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="e.g. Frontend Engineer, Product Manager"
                          className="pl-10 rounded-xl h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experienceLevel">Experience Level</Label>
                      <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                        <SelectTrigger className="rounded-xl h-11">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="entry">Entry-Level (0-2 years)</SelectItem>
                          <SelectItem value="mid">Mid-Level (2-5 years)</SelectItem>
                          <SelectItem value="senior">Senior (5-8 years)</SelectItem>
                          <SelectItem value="lead">Lead / Staff (8+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedSalary">Expected Salary (Optional)</Label>
                      <Input
                        id="expectedSalary"
                        value={expectedSalary}
                        onChange={(e) => setExpectedSalary(e.target.value)}
                        placeholder="e.g. ₹15L – ₹25L or $120,000"
                        className="rounded-xl h-11"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Location & Education */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5 animate-fade-in" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      Where are you based? <MapPin className="w-5 h-5 text-primary" />
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      We match candidates to local, hybrid, and remote roles.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="location">Your Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Bengaluru, Karnataka or London, UK"
                          className="pl-10 rounded-xl h-11"
                          required
                        />
                      </div>
                    </div>

                    <Separator className="my-2" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-primary" />Education (Optional)</h3>
                      <p className="text-xs text-muted-foreground">Add your most recent academic credentials.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="school">School / University</Label>
                        <Input
                          id="school"
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          placeholder="e.g. IIT Delhi"
                          className="rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="degree">Degree</Label>
                        <Input
                          id="degree"
                          value={degree}
                          onChange={(e) => setDegree(e.target.value)}
                          placeholder="e.g. B.Tech, M.S."
                          className="rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fieldOfStudy">Field of Study</Label>
                        <Input
                          id="fieldOfStudy"
                          value={fieldOfStudy}
                          onChange={(e) => setFieldOfStudy(e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gradYear">Graduation Year</Label>
                        <Input
                          id="gradYear"
                          value={gradYear}
                          onChange={(e) => setGradYear(e.target.value)}
                          placeholder="e.g. 2024"
                          className="rounded-xl h-10"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Resume & Skills */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      Resume & Skills <Rocket className="w-5 h-5 text-primary" />
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Upload your resume and JobFusion will parse it to auto-extract your skills.
                    </p>
                  </div>

                  {/* Resume Upload Box */}
                  <div 
                    onClick={handleResumeUploadClick}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      resumeUrl 
                        ? 'border-emerald-500/40 bg-emerald-500/5' 
                        : 'border-border hover:border-primary/50 hover:bg-accent/30'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleResumeFileChange} 
                      accept=".pdf,.docx" 
                      className="hidden" 
                    />
                    
                    {uploading ? (
                      <div className="space-y-2">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                        <p className="text-xs font-semibold">Parsing & Extracting Skills...</p>
                        <p className="text-[10px] text-muted-foreground">Uploading to Cloudinary and parsing text</p>
                      </div>
                    ) : resumeUrl ? (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-500">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-foreground truncate max-w-xs mx-auto">{resumeName}</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Successfully processed! Click to replace.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold">Click to upload resume</p>
                        <p className="text-[10px] text-muted-foreground">PDF or DOCX • Max 5MB</p>
                      </div>
                    )}
                  </div>

                  {/* Skills tags */}
                  <div className="space-y-3">
                    <Label className="flex justify-between items-center">
                      <span>Skills ({skills.length})</span>
                      <span className="text-[10px] text-muted-foreground">Optional</span>
                    </Label>

                    {/* Skill manual input */}
                    <div className="flex gap-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                        placeholder="Add a skill manually..."
                        className="rounded-xl h-10 flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={handleAddSkill}
                        className="rounded-xl h-10 px-3.5"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Extracted/Selected Skills list */}
                    <div className="flex flex-wrap gap-1.5 pt-1.5 max-h-32 overflow-y-auto pr-1">
                      {skills.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No skills added yet. Upload your resume or enter them manually.</p>
                      ) : (
                        skills.map((s) => (
                          <Badge 
                            key={s.name} 
                            variant="secondary" 
                            className="rounded-full px-2.5 py-1 text-xs gap-1 border border-border bg-muted/50 hover:bg-muted"
                          >
                            <span>{s.name}</span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveSkill(s.name)}
                              className="text-muted-foreground hover:text-foreground rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-3 pt-4 border-t border-border/40 mt-6">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={submitting}
                  className="rounded-xl px-5"
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="rounded-xl gradient-brand text-white border-0 px-5 shadow-lg shadow-primary/10 ml-auto"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting || uploading}
                  className="rounded-xl gradient-brand text-white border-0 px-6 shadow-lg shadow-primary/10 ml-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Finish Onboarding
                      <Sparkles className="w-4 h-4 ml-1.5 animate-pulse" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </motion.div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-[10px] text-muted-foreground max-w-xl mx-auto mt-6">
        &copy; {new Date().getFullYear()} JobFusion Inc. All rights reserved.
      </div>
    </div>
  );
}
