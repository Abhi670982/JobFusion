export interface DbUser {
  _id: string;
  clerkId: string;
  fullName: string;
  email: string;
  profileImage?: string;
  role: string;
}

export interface DbSkill {
  name: string;
  level: number;
}

export interface DbExperience {
  company: string;
  role: string;
  period: string;
  duration: string;
  description: string;
  skills: string[];
  companyColor: string;
  logo: string;
}

export interface DbEducation {
  school: string;
  degree: string;
  period: string;
  logo: string;
  color: string;
}

export interface DbCertification {
  name: string;
  issuer: string;
  year: string;
  iconName: string;
}

export interface DbProject {
  name: string;
  description: string;
  tech: string[];
  link: string;
  stars: string;
}

export interface DbProfile {
  _id: string;
  userId: DbUser | string;
  headline?: string;
  bio?: string;
  skills: DbSkill[];
  location?: string;
  experience?: string;
  resumeUrl?: string;
  resumeName?: string;
  resumeUpdatedAt?: string | Date | null;
  resumeText?: string;
  experiences: DbExperience[];
  education: DbEducation[];
  certifications: DbCertification[];
  projects: DbProject[];
  noticePeriod: string;
  expectedSalary: string;
  phone: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  isOnboarded?: boolean;
  // Resume Intelligence fields

  resumeCategory?: string;
  resumeSummary?: string;
  suggestedRoles?: string[];
  lastAnalyzedAt?: string | Date | null;
  resumeInsights?: {
    found: string[];
    missing: string[];
    tips: string[];
  };
  resumeSkillMode?: 'merge' | 'replace';
}

export interface DbJob {
  _id: string;
  title: string;
  company: string;
  companyLogo: string;
  companyColor: string;
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  salary: string;
  salaryMin: number;
  salaryMax: number;
  experience: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  skills: string[];
  matchScore: number;
  postedAt: string;
  postedAtDate?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicants: number;
  featured: boolean;
  category: string;
  source?: string;
  sourceCategory?: string;
  applyUrl?: string;
  dedupeHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbApplication {
  _id: string;
  userId: DbUser | string;
  jobId: DbJob;
  status: 'Applied' | 'Under Review' | 'Interview' | 'Rejected' | 'Offer';
  appliedAt: string;
}

export interface DbSavedJob {
  _id: string;
  userId: DbUser | string;
  jobId: DbJob;
  savedAt: string;
}

// ─── Cache Storage ───────────────────────────────────────────────────────────
let cachedUserPromise: Promise<DbUser | null> | null = null;
let cachedUser: DbUser | null = null;
let lastUserFetchTime = 0;

const profileCache = new Map<string, { data: DbProfile | null; time: number }>();
const profilePromiseCache = new Map<string, Promise<DbProfile | null>>();

const savedJobsCache = new Map<string, { data: DbSavedJob[]; time: number }>();
const savedJobsPromiseCache = new Map<string, Promise<DbSavedJob[]>>();

const applicationsCache = new Map<string, { data: DbApplication[]; time: number }>();
const applicationsPromiseCache = new Map<string, Promise<DbApplication[]>>();

let cachedJobsPromise: Promise<DbJob[]> | null = null;
let cachedJobs: DbJob[] = [];
let lastJobsFetchTime = 0;

const CACHE_TTL = 15000; // 15 seconds TTL for personalized profile, saved items, and applications
const JOBS_CACHE_TTL = 30000; // 30 seconds TTL for jobs listing

export function clearApiCache() {

  cachedUserPromise = null;
  cachedUser = null;
  lastUserFetchTime = 0;
  profileCache.clear();
  profilePromiseCache.clear();
  savedJobsCache.clear();
  savedJobsPromiseCache.clear();
  applicationsCache.clear();
  applicationsPromiseCache.clear();
  cachedJobsPromise = null;
  cachedJobs = [];
  lastJobsFetchTime = 0;
}

// ─── API Helper Functions ───────────────────────────────────────────────────

export async function fetchCurrentUser(forceRefresh = false): Promise<DbUser | null> {
  const now = Date.now();
  if (!forceRefresh && cachedUser && (now - lastUserFetchTime < CACHE_TTL)) {

    return cachedUser;
  }
  if (!forceRefresh && cachedUserPromise) {

    return cachedUserPromise;
  }


  cachedUserPromise = (async () => {
    try {
      const res = await fetch('/api/users');

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.success && data.user) {
        cachedUser = data.user;
        lastUserFetchTime = Date.now();
        return data.user;
      }
    } catch (error: any) {
      // "TypeError: Failed to fetch" is a transient network error (e.g. during Clerk hydration).
      // Downgrade to warn so it doesn't pollute the error console on normal page loads.
      if (error?.name === 'TypeError') {
        console.warn("[Frontend API] fetchCurrentUser() - Transient network error:", error.message);
      } else {
        console.error("[Frontend API] Error fetching current user:", error);
      }
    } finally {
      cachedUserPromise = null;
    }
    return null;
  })();

  return cachedUserPromise;
}

export async function fetchProfile(userId: string, forceRefresh = false): Promise<DbProfile | null> {
  const now = Date.now();
  const cached = profileCache.get(userId);
  if (!forceRefresh && cached && (now - cached.time < CACHE_TTL)) {

    return cached.data;
  }
  
  let promise = profilePromiseCache.get(userId);
  if (!forceRefresh && promise) {

    return promise;
  }


  promise = (async () => {
    try {
      const res = await fetch(`/api/profile?userId=${userId}`);

      if (!res.ok) {
        if (res.status === 404) {
          console.warn(`[Frontend API] fetchProfile(${userId}) - Profile not found (404)`);
          profileCache.set(userId, { data: null, time: Date.now() });
          return null;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        profileCache.set(userId, { data: data.data, time: Date.now() });
        return data.data;
      }
    } catch (error) {
      console.error(`[Frontend API] Error fetching profile for user ${userId}:`, error);
    } finally {
      profilePromiseCache.delete(userId);
    }
    return null;
  })();

  profilePromiseCache.set(userId, promise);
  return promise;
}

export async function updateProfile(userId: string, profileData: Partial<DbProfile>): Promise<DbProfile | null> {

  try {
    const res = await fetch(`/api/profile?userId=${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...profileData }),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) {
      // Invalidate and update caches
      profileCache.set(userId, { data: data.data, time: Date.now() });
      return data.data;
    }
  } catch (error) {
    console.error(`[Frontend API] Error updating profile for user ${userId}:`, error);
  }
  return null;
}

export async function fetchJobs(forceRefresh = false): Promise<DbJob[]> {
  const now = Date.now();
  if (!forceRefresh && cachedJobs.length > 0 && (now - lastJobsFetchTime < JOBS_CACHE_TTL)) {

    return cachedJobs;
  }
  if (!forceRefresh && cachedJobsPromise) {

    return cachedJobsPromise;
  }


  cachedJobsPromise = (async () => {
    try {
      const res = await fetch('/api/jobs');

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.success) {
        cachedJobs = data.data;
        lastJobsFetchTime = Date.now();
        return data.data;
      }
    } catch (error) {
      console.error("[Frontend API] Error fetching jobs:", error);
    } finally {
      cachedJobsPromise = null;
    }
    return [];
  })();

  return cachedJobsPromise;
}

export async function fetchJobById(id: string): Promise<DbJob | null> {

  try {
    const res = await fetch(`/api/jobs?id=${id}`);

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) return data.data;
  } catch (error) {
    console.error(`[Frontend API] Error fetching job by ID ${id}:`, error);
  }
  return null;
}

export async function fetchApplications(userId: string, forceRefresh = false): Promise<DbApplication[]> {
  const now = Date.now();
  const cached = applicationsCache.get(userId);
  if (!forceRefresh && cached && (now - cached.time < CACHE_TTL)) {

    return cached.data;
  }
  let promise = applicationsPromiseCache.get(userId);
  if (!forceRefresh && promise) {

    return promise;
  }


  promise = (async () => {
    try {
      const res = await fetch(`/api/applications?userId=${userId}`);

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.success) {
        applicationsCache.set(userId, { data: data.data, time: Date.now() });
        return data.data;
      }
    } catch (error) {
      console.error(`[Frontend API] Error fetching applications for user ${userId}:`, error);
    } finally {
      applicationsPromiseCache.delete(userId);
    }
    return [];
  })();

  applicationsPromiseCache.set(userId, promise);
  return promise;
}

export async function applyToJob(userId: string, jobId: string): Promise<DbApplication | null> {

  try {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, jobId }),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) {
      // Invalidate applications cache
      applicationsCache.delete(userId);
      return data.data;
    }
  } catch (error) {
    console.error(`[Frontend API] Error applying to job ${jobId} for user ${userId}:`, error);
  }
  return null;
}

export async function fetchSavedJobs(userId: string, forceRefresh = false): Promise<DbSavedJob[]> {
  const now = Date.now();
  const cached = savedJobsCache.get(userId);
  if (!forceRefresh && cached && (now - cached.time < CACHE_TTL)) {

    return cached.data;
  }
  let promise = savedJobsPromiseCache.get(userId);
  if (!forceRefresh && promise) {

    return promise;
  }


  promise = (async () => {
    try {
      const res = await fetch(`/api/saved-jobs?userId=${userId}`);

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.success) {
        savedJobsCache.set(userId, { data: data.data, time: Date.now() });
        return data.data;
      }
    } catch (error) {
      console.error(`[Frontend API] Error fetching saved jobs for user ${userId}:`, error);
    } finally {
      savedJobsPromiseCache.delete(userId);
    }
    return [];
  })();

  savedJobsPromiseCache.set(userId, promise);
  return promise;
}

export async function saveJob(userId: string, jobId: string): Promise<DbSavedJob | null> {

  try {
    const res = await fetch('/api/saved-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, jobId }),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) {
      // Invalidate saved jobs cache
      savedJobsCache.delete(userId);
      return data.data;
    }
  } catch (error) {
    console.error(`[Frontend API] Error saving job ${jobId} for user ${userId}:`, error);
  }
  return null;
}

export async function unsaveJob(userId: string, jobId: string): Promise<boolean> {

  try {
    const res = await fetch(`/api/saved-jobs?userId=${userId}&jobId=${jobId}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) {
      // Invalidate saved jobs cache
      savedJobsCache.delete(userId);
      return true;
    }
  } catch (error) {
    console.error(`[Frontend API] Error unsaving job ${jobId} for user ${userId}:`, error);
  }
  return false;
}

export async function uploadResume(userId: string, file: File): Promise<any> {

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const res = await fetch('/api/upload-resume', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (data.success && data.data) {
      // Directly populate profile cache
      profileCache.set(userId, { data: data.data, time: Date.now() });
    } else {
      profileCache.delete(userId);
    }
    return data;
  } catch (error: any) {
    console.error(`[Frontend API] Error uploading resume for user ${userId}:`, error);
    profileCache.delete(userId);
    throw error;
  }
}

export async function parseResume(userId: string): Promise<any> {

  try {
    const res = await fetch('/api/parse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (data.success && data.data) {
      // Directly update profile cache
      profileCache.set(userId, { data: data.data, time: Date.now() });
    } else {
      profileCache.delete(userId);
    }
    return data;
  } catch (error: any) {
    console.error(`[Frontend API] Error parsing resume for user ${userId}:`, error);
    profileCache.delete(userId);
    throw error;
  }
}

export async function fetchDashboardData(): Promise<any> {
  try {
    const res = await fetch('/api/dashboard');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.success ? data : null;
  } catch (error) {
    console.error("[Frontend API] Error fetching dashboard data:", error);
    return null;
  }
}

export async function fetchDashboardStats(): Promise<any> {
  try {
    const res = await fetch('/api/dashboard/stats');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.success ? data.stats : null;
  } catch (error) {
    console.error("[Frontend API] Error fetching dashboard stats:", error);
    return null;
  }
}

export async function fetchDashboardActivity(): Promise<any> {
  try {
    const res = await fetch('/api/dashboard/activity');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.success ? data : null;
  } catch (error) {
    console.error("[Frontend API] Error fetching dashboard activity:", error);
    return null;
  }
}

export async function logActivity(activityData: {
  type: string;
  jobId?: string;
  jobTitle?: string;
  company?: string;
  details?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/dashboard/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return !!data.success;
  } catch (error) {
    console.error("[Frontend API] Error logging activity:", error);
    return false;
  }
}

export async function fetchDashboardNotifications(): Promise<any[]> {
  // Notifications feature is disabled — return empty list without making a network request
  return [];
}


export async function fetchDashboardMatches(): Promise<any> {
  try {
    const res = await fetch('/api/dashboard/matches');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.success ? data : null;
  } catch (error) {
    console.error("[Frontend API] Error fetching job matches:", error);
    return null;
  }
}

export async function fetchAnalyzerStatus(): Promise<any> {
  try {
    const res = await fetch('/api/resume-analyzer/status');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("[Frontend API] Error fetching analyzer status:", error);
    return null;
  }
}

export async function analyzeResumeFrontend(forceReanalyze = false): Promise<any> {
  try {
    const res = await fetch('/api/resume-analyzer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceReanalyze }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[Frontend API] Error running resume analyzer:", error);
    throw error;
  }
}

