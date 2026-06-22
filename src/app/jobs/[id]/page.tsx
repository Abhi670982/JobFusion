'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Clock, Users, Bookmark, BookmarkCheck, Share2,
  CheckCircle2, XCircle, ArrowLeft, ExternalLink, Briefcase,
  DollarSign, Wifi, Star, Zap, Building2, X, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { trackVisitedJob } from '@/lib/visited-jobs';
import {
  fetchCurrentUser,
  fetchProfile,
  fetchJobById,
  fetchSavedJobs,
  fetchApplications,
  saveJob,
  unsaveJob,
  applyToJob,
  updateProfile,
  logActivity,
  DbUser,
  DbJob,
  DbSavedJob,
  DbApplication,
  DbProfile
} from '@/lib/api-helper';

function JobDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card-premium p-6 space-y-4">
        <div className="flex gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl animate-pulse" />
          <div className="space-y-2 flex-1">
            <Skeleton className="w-1/2 h-6 animate-pulse" />
            <Skeleton className="w-1/4 h-4 animate-pulse" />
          </div>
        </div>
        <Skeleton className="w-full h-10 rounded-xl animate-pulse" />
      </div>
      <div className="card-premium p-6 space-y-4">
        <Skeleton className="w-1/3 h-5 animate-pulse" />
        <Skeleton className="w-full h-2 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16 animate-pulse" />
          <Skeleton className="h-16 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function getPortalSearchUrl(source: string, title: string, company: string): string {
  const cleanTitle = title
    .replace(/[\(\[][^\)\]]*[\)\]]/g, "") // remove parentheses/brackets
    .replace(/\b(?:remote|india|us|usa|canada|uk|europe|london|germany|world|worldwide|timezone|utc|gmt|emea|latam|apac)\b/gi, "") // remove location/timezone keywords
    .replace(/[-|/\\+,;:]+$/g, "") // remove trailing punctuation
    .replace(/\s+/g, " ") // normalize whitespace
    .trim();
  const query = encodeURIComponent(`${cleanTitle} ${company}`);
  const src = (source || "").toLowerCase();

  switch (src) {
    case 'indeed':
      return `https://www.indeed.com/jobs?q=${query}`;
    case 'linkedin':
      return `https://www.linkedin.com/jobs/search/?keywords=${query}`;
    case 'wellfound':
      return `https://wellfound.com/jobs?q=${query}`;
    case 'internshala':
      return `https://internshala.com/jobs/keyword-${encodeURIComponent(cleanTitle)}/`;
    case 'glassdoor':
      return `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${query}`;
    default:
      return `https://www.linkedin.com/jobs/search/?keywords=${query}`;
  }
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<DbJob | null>(null);
  const [similarJobs, setSimilarJobs] = useState<DbJob[]>([]);
  const [user, setUser] = useState<DbUser | null>(null);

  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Quick Apply missing details states
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [formData, setFormData] = useState({ phone: '', location: '', portfolioUrl: '' });
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [extractingDetails, setExtractingDetails] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!jobId) return;
      try {
        setLoading(true);
        const [currentUser, jobData] = await Promise.all([
          fetchCurrentUser(),
          fetchJobById(jobId)
        ]);

        if (jobData) {
          setJob(jobData);
          trackVisitedJob(jobData);

          if (currentUser) {
            setUser(currentUser);
            logActivity({
              type: "viewed",
              jobId: jobData._id,
              jobTitle: jobData.title,
              company: jobData.company,
            }).catch((err) => console.error("Failed to log viewed activity:", err));

            // Check if saved
            const savedJobs = await fetchSavedJobs(currentUser._id);
            const isSaved = savedJobs.some((s: DbSavedJob) => s.jobId?._id === jobData._id);
            setSaved(isSaved);

            // Check if applied
            const applications = await fetchApplications(currentUser._id);
            const isApplied = applications.some((a: DbApplication) => a.jobId?._id === jobData._id);
            setApplied(isApplied);

            // Fetch profile
            const prof = await fetchProfile(currentUser._id);
            setProfile(prof);
          }

          // Fetch similar jobs asynchronously in the background using the category filter
          fetch(`/api/jobs?category=${encodeURIComponent(jobData.category)}&limit=4`)
            .then(res => res.json())
            .then(resData => {
              if (resData.success && resData.data) {
                const similar = resData.data
                  .filter((j: DbJob) => j._id !== jobData._id)
                  .slice(0, 3);
                setSimilarJobs(similar);
              }
            })
            .catch(err => console.error("Failed to load similar jobs in background:", err));
        }
      } catch (err) {
        console.error("Error loading job details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [jobId]);

  const handleSaveToggle = async () => {
    if (!user || !job || actionLoading) return;
    setActionLoading(true);

    const nextSaved = !saved;
    setSaved(nextSaved); // Optimistic UI

    try {
      if (nextSaved) {
        await saveJob(user._id, job._id);
      } else {
        await unsaveJob(user._id, job._id);
      }
    } catch (err) {
      console.error("Failed to toggle saved job:", err);
      setSaved(saved); // Revert
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setResumeFile(file);
    setUploadingResume(true);
    setModalError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('userId', user._id);

      const uploadRes = await fetch('/api/upload-resume', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json();
        throw new Error(uploadData.error || 'Failed to upload resume file.');
      }

      const uploadData = await uploadRes.json();
      
      if (uploadData.success && uploadData.data) {
        const updatedProf = {
          ...profile,
          resumeUrl: uploadData.data.resumeUrl,
          resumeName: uploadData.data.resumeName,
          resumeUpdatedAt: uploadData.data.resumeUpdatedAt,
          skills: uploadData.data.skills,
          phone: uploadData.data.phone,
          location: uploadData.data.location,
          portfolioUrl: uploadData.data.portfolioUrl,
          linkedinUrl: uploadData.data.linkedinUrl,
          githubUrl: uploadData.data.githubUrl,
        } as DbProfile;
        setProfile(updatedProf);

        // Pre-fill form fields dynamically
        setFormData(prev => ({
          phone: (uploadData.data.phone && uploadData.data.phone !== "+91 98765 43210") ? uploadData.data.phone : prev.phone,
          location: uploadData.data.location || prev.location,
          portfolioUrl: uploadData.data.portfolioUrl || prev.portfolioUrl
        }));

        setToastMessage("JobFusion AI successfully extracted details from your resume!");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }
    } catch (err: any) {
      console.error("Error auto-parsing uploaded resume:", err);
      setModalError(err.message || 'Failed to auto-extract details from resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleApply = () => {
    if (!user || !job || actionLoading) return;

    const applyUrl = job.applyUrl || getPortalSearchUrl(job.source || 'Google Jobs', job.title, job.company);

    setActionLoading(true);
    // Record application in database in the background without blocking the redirect gesture
    applyToJob(user._id, job._id)
      .then((app) => {
        if (app) setApplied(true);
      })
      .catch((err) => console.error("Failed to record application in background:", err))
      .finally(() => setActionLoading(false));

    // Show redirect toast
    setToastMessage(`Redirecting you to the official verified application page...`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);

    // Open target application URL synchronously and securely with noopener,noreferrer
    window.open(applyUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job || actionLoading) return;
    setModalError(null);
    setActionLoading(true);

    try {
      let currentResumeUrl = profile?.resumeUrl || '';
      let currentResumeName = profile?.resumeName || '';

      // 1. Upload resume if needed (and not already done in background)
      if (!profile?.resumeUrl && resumeFile) {
        setUploadingResume(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', resumeFile);
        uploadFormData.append('userId', user._id);

        const uploadRes = await fetch('/api/upload-resume', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json();
          throw new Error(uploadData.error || 'Failed to upload resume file.');
        }

        const uploadData = await uploadRes.json();
        currentResumeUrl = uploadData.data.resumeUrl;
        currentResumeName = uploadData.data.resumeName;
        setUploadingResume(false);
      }

      // 2. Update profile
      const updatedProfile = await updateProfile(user._id, {
        phone: formData.phone || profile?.phone,
        location: formData.location || profile?.location,
        portfolioUrl: formData.portfolioUrl || profile?.portfolioUrl,
        ...(resumeFile ? {
          resumeUrl: currentResumeUrl,
          resumeName: currentResumeName,
          resumeUpdatedAt: new Date()
        } : {})
      });

      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      // 3. Apply to job
      const application = await applyToJob(user._id, job._id);
      if (application) {
        setApplied(true);
        setShowDetailsModal(false);
        setToastMessage("Get it! You can check it out - Applied successfully!");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }
    } catch (err: any) {
      console.error("Error submitting application details:", err);
      setModalError(err.message || 'An error occurred during submission.');
    } finally {
      setActionLoading(false);
      setUploadingResume(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto w-full">
            <Skeleton className="w-24 h-4 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <JobDetailSkeleton />
              </div>
              <div>
                <div className="card-premium p-5 space-y-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-1/2 h-4" />
                </div>
              </div>
            </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto w-full text-center py-20">
            <h2 className="text-xl font-bold mb-2">Job not found</h2>
            <p className="text-muted-foreground text-sm mb-4">The job posting you are looking for does not exist or has expired.</p>
            <Link href="/jobs">
              <Button className="rounded-xl gradient-brand text-white border-0">Back to Jobs</Button>
            </Link>
      </main>
    );
  }

  const matchedSkills = job.skills.slice(0, Math.ceil(job.skills.length * 0.7));
  const missingSkills = job.skills.slice(Math.ceil(job.skills.length * 0.7));

  return (
    <>
      <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto w-full">
          {/* Back */}
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: job.companyColor || '#6366f1' }}
                    >
                      {job.companyLogo && (job.companyLogo.startsWith('http') || job.companyLogo.includes('/')) ? (
                        <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                      ) : (
                        job.companyLogo || job.company.charAt(0)
                      )}
                    </div>
                    <div>
                      <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{job.title}</h1>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-muted-foreground font-medium">{job.company}</span>
                        <span className="text-muted-foreground">·</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user && (
                      <button
                        onClick={handleSaveToggle}
                        disabled={actionLoading}
                        className={cn('p-2 rounded-xl transition-all', saved ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-accent')}
                      >
                        {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                      </button>
                    )}
                    <button className="p-2 rounded-xl text-muted-foreground hover:bg-accent transition-all">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  <Badge variant="secondary" className="rounded-lg gap-1.5"><Wifi className="w-3 h-3" />{job.locationType}</Badge>
                  <Badge variant="secondary" className="rounded-lg gap-1.5"><Briefcase className="w-3 h-3" />{job.type}</Badge>
                  <Badge variant="secondary" className="rounded-lg gap-1.5"><Clock className="w-3 h-3" />{job.experience}</Badge>
                  <Badge variant="secondary" className="rounded-lg gap-1.5"><DollarSign className="w-3 h-3" />{job.salary}</Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-5">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {job.applicants} applicants
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Posted {job.postedAt}
                  </div>
                </div>

                  <div className="flex flex-col gap-2 w-full">
                    <Button
                      onClick={handleApply}
                      disabled={actionLoading || !user}
                      className="w-full h-11 rounded-xl gradient-brand text-white border-0 font-semibold hover:opacity-90 shadow-lg text-sm flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Apply on Company Site (Verified)
                    </Button>
                    {job.source && (
                      <a
                        href={getPortalSearchUrl(job.source, job.title, job.company)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-center text-muted-foreground hover:text-primary transition-colors py-1 underline"
                      >
                        Or search on {job.source}
                      </a>
                    )}
                  </div>
              </motion.div>

              {/* Skill Match */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">AI Skill Match</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-primary">AI</span>
                    </div>
                    <span className={cn('font-bold', job.matchScore >= 85 ? 'text-emerald-500' : 'text-blue-500')}>{job.matchScore}% match</span>
                  </div>
                </div>
                <Progress value={job.matchScore} className="h-2 mb-6" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-3">
                      <CheckCircle2 className="w-4 h-4" />
                      Skills You Have
                    </h4>
                    <div className="space-y-2">
                      {matchedSkills.map(skill => (
                        <div key={skill} className="flex items-center gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-3">
                      <XCircle className="w-4 h-4" />
                      Skills to Develop
                    </h4>
                    <div className="space-y-2">
                      {missingSkills.length === 0 ? (
                        <p className="text-xs text-muted-foreground">You match all skills for this role!</p>
                      ) : (
                        missingSkills.map(skill => (
                          <div key={skill} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {skill}
                            </div>
                            <button className="text-xs text-primary hover:underline">Learn →</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Description */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-premium p-6 space-y-6">
                <div>
                  <h2 className="font-semibold mb-3">About the Role</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
                </div>
                {job.requirements && job.requirements.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="font-semibold mb-3">Requirements</h2>
                      <ul className="space-y-2">
                        {job.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                {job.responsibilities && job.responsibilities.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="font-semibold mb-3">Responsibilities</h2>
                      <ul className="space-y-2">
                        {job.responsibilities.map((r, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span className="text-muted-foreground">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                {job.benefits && job.benefits.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="font-semibold mb-3">Benefits & Perks</h2>
                      <div className="flex flex-wrap gap-2">
                        {job.benefits.map((b) => (
                          <Badge key={b} variant="secondary" className="rounded-lg text-xs">{b}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Company Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card-premium p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  About {job.company}
                </h3>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-3 overflow-hidden"
                  style={{ backgroundColor: job.companyColor || '#6366f1' }}
                >
                  {job.companyLogo && (job.companyLogo.startsWith('http') || job.companyLogo.includes('/')) ? (
                    <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                  ) : (
                    job.companyLogo || job.company.charAt(0)
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {job.company} is a global leader in its sector, dedicated to innovation, high quality, and delivering outstanding client solutions.
                </p>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Industry', value: 'Technology / SaaS' },
                    { label: 'Company size', value: '1,000 – 5,000' },
                    { label: 'Founded', value: '2015' },
                    { label: 'HQ', value: 'Bengaluru, India' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4 rounded-xl gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Company Profile
                </Button>
              </motion.div>

              {/* Similar Jobs */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <h3 className="font-semibold mb-3">Similar Jobs</h3>
                <div className="space-y-3">
                  {similarJobs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No similar jobs found.</p>
                  ) : (
                    similarJobs.map((sj) => (
                      <Link key={sj._id} href={`/jobs/${sj._id}`} className="block card-premium p-4 hover:border-primary/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm overflow-hidden" style={{ backgroundColor: sj.companyColor || '#6366f1' }}>
                            {sj.companyLogo && (sj.companyLogo.startsWith('http') || sj.companyLogo.includes('/')) ? (
                              <img src={sj.companyLogo} alt={sj.company} className="w-full h-full object-cover" />
                            ) : (
                              sj.companyLogo || sj.company.charAt(0)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary">{sj.title}</p>
                            <p className="text-xs text-muted-foreground">{sj.company} · {sj.salary}</p>
                          </div>
                          <Badge className={cn('text-[10px] flex-shrink-0', sj.matchScore >= 85 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20')}>
                            {sj.matchScore}%
                          </Badge>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </main>

      {/* Details Dialog */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Additional Details Required</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitApply} className="space-y-4 py-3">
            {modalError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {modalError}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Quick Apply requires the following details which are currently missing from your profile. Filling them here will also save them to your profile.
            </p>

            {missingFields.includes('resume') && (
              <div className="space-y-2">
                <Label htmlFor="resume" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload Resume (PDF/DOCX)</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleResumeChange}
                  required={!profile?.resumeUrl}
                  className="rounded-xl cursor-pointer bg-muted/50 border-border"
                />
                {uploadingResume && (
                  <p className="text-[11px] text-primary animate-pulse font-medium">
                    JobFusion AI is uploading and reading your resume...
                  </p>
                )}
              </div>
            )}

            {missingFields.includes('phone') && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                  className="rounded-xl bg-muted/50 border-border"
                />
              </div>
            )}

            {missingFields.includes('location') && (
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location (City, Country)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Bengaluru, India"
                  required
                  className="rounded-xl bg-muted/50 border-border"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="portfolioUrl" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Portfolio or LinkedIn URL (Optional)</Label>
              <Input
                id="portfolioUrl"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                placeholder="https://yourportfolio.com"
                className="rounded-xl bg-muted/50 border-border"
              />
            </div>

            <DialogFooter className="gap-2 pt-2 flex flex-col-reverse sm:flex-row justify-end">
              <Button type="button" variant="outline" onClick={() => setShowDetailsModal(false)} disabled={actionLoading} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={actionLoading} className="rounded-xl gradient-brand text-white border-0 font-medium">
                {uploadingResume ? 'Uploading...' : actionLoading ? 'Submitting...' : 'Submit & Apply'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl glass border border-emerald-500/20 shadow-2xl flex items-start gap-3 bg-card/90"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
              <Sparkles className="w-4.5 h-4.5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Application Status</h4>
              <p className="text-sm font-semibold text-foreground mt-0.5">{toastMessage}</p>
            </div>
            <button onClick={() => setShowSuccessToast(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
