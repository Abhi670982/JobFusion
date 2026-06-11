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
  resumeUpdatedAt?: string | Date;
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
  notifications?: {
    jobMatches: boolean;
    applicationUpdates: boolean;
    recruiterMessages: boolean;
    aiRecommendations: boolean;
    weeklyDigest: boolean;
    marketingEmails: boolean;
  };
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
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicants: number;
  featured: boolean;
  category: string;
  source?: string;
  applyUrl?: string;
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

// ─── API Helper Functions ───────────────────────────────────────────────────

export async function fetchCurrentUser(): Promise<DbUser | null> {
  console.log("[Frontend API] fetchCurrentUser() - Request started");
  try {
    const res = await fetch('/api/users');
    console.log(`[Frontend API] fetchCurrentUser() - Response status: ${res.status}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    console.log("[Frontend API] fetchCurrentUser() - Data parsed:", JSON.stringify(data));
    if (data.success && data.user) {
      return data.user;
    }
  } catch (error) {
    console.error("[Frontend API] Error fetching current user:", error);
  }
  return null;
}

export async function fetchProfile(userId: string): Promise<DbProfile | null> {
  console.log(`[Frontend API] fetchProfile(${userId}) - Request started`);
  try {
    const res = await fetch(`/api/profile?userId=${userId}`);
    console.log(`[Frontend API] fetchProfile(${userId}) - Response status: ${res.status}`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`[Frontend API] fetchProfile(${userId}) - Profile not found (404)`);
        return null; // Profile doesn't exist yet
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log(`[Frontend API] fetchProfile(${userId}) - Data parsed:`, JSON.stringify(data));
    if (data.success) return data.data;
  } catch (error) {
    console.error(`[Frontend API] Error fetching profile for user ${userId}:`, error);
  }
  return null;
}

export async function updateProfile(userId: string, profileData: Partial<DbProfile>): Promise<DbProfile | null> {
  console.log(`[Frontend API] updateProfile(${userId}) - Request started`);
  try {
    const res = await fetch(`/api/profile?userId=${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...profileData }),
    });
    console.log(`[Frontend API] updateProfile(${userId}) - Response status: ${res.status}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    console.log(`[Frontend API] updateProfile(${userId}) - Data parsed:`, JSON.stringify(data));
    if (data.success) return data.data;
  } catch (error) {
    console.error(`[Frontend API] Error updating profile for user ${userId}:`, error);
  }
  return null;
}

export async function fetchJobs(): Promise<DbJob[]> {
  console.log("[Frontend API] fetchJobs() - Request started");
  try {
    const res = await fetch('/api/jobs');
    console.log(`[Frontend API] fetchJobs() - Response status: ${res.status}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    console.log(`[Frontend API] fetchJobs() - Loaded ${data.data?.length} jobs`);
    if (data.success) return data.data;
  } catch (error) {
    console.error("[Frontend API] Error fetching jobs:", error);
  }
  return [];
}

export async function fetchJobById(id: string): Promise<DbJob | null> {
  console.log(`[Frontend API] fetchJobById(${id}) - Request started`);
  try {
    const res = await fetch(`/api/jobs?id=${id}`);
    console.log(`[Frontend API] fetchJobById(${id}) - Response status: ${res.status}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    console.log(`[Frontend API] fetchJobById(${id}) - Data parsed:`, JSON.stringify(data));
    if (data.success) return data.data;
  } catch (error) {
    console.error(`[Frontend API] Error fetching job by ID ${id}:`, error);
  }
  return null;
}

export async function fetchApplications(userId: string): Promise<DbApplication[]> {
  console.log(`[Frontend API] fetchApplications(${userId}) - Request started`);
  try {
    const res = await fetch(`/api/applications?userId=${userId}`);
    console.log(`[Frontend API] fetchApplications(${userId}) - Response status: ${res.status}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    console.log(`[Frontend API] fetchApplications(${userId}) - Loaded ${data.data?.length} applications`);
    if (data.success) return data.data;
  } catch (error) {
    console.error(`[Frontend API] Error fetching applications for user ${userId}:`, error);
  }
  return [];
}

export async function applyToJob(userId: string, jobId: string): Promise<DbApplication | null> {
  console.log(`[Frontend API] applyToJob(userId: ${userId}, jobId: ${jobId}) - Request started`);
  try {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, jobId }),
    });
    console.log(`[Frontend API] applyToJob(userId: ${userId}, jobId: ${jobId}) - Response status: ${res.status}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    console.log(`[Frontend API] applyToJob(userId: ${userId}, jobId: ${jobId}) - Data parsed:`, JSON.stringify(data));
    if (data.success) return data.data;
  } catch (error) {
    console.error(`[Frontend API] Error applying to job ${jobId} for user ${userId}:`, error);
  }
  return null;
}

export async function fetchSavedJobs(userId: string): Promise<DbSavedJob[]> {
  console.log(`[Frontend API] fetchSavedJobs(${userId}) - Request started`);
  try {
    const res = await fetch(`/api/saved-jobs?userId=${userId}`);
    console.log(`[Frontend API] fetchSavedJobs(${userId}) - Response status: ${res.status}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    console.log(`[Frontend API] fetchSavedJobs(${userId}) - Loaded ${data.data?.length} saved jobs`);
    if (data.success) return data.data;
  } catch (error) {
    console.error(`[Frontend API] Error fetching saved jobs for user ${userId}:`, error);
  }
  return [];
}

export async function saveJob(userId: string, jobId: string): Promise<DbSavedJob | null> {
  console.log(`[Frontend API] saveJob(userId: ${userId}, jobId: ${jobId}) - Request started`);
  try {
    const res = await fetch('/api/saved-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, jobId }),
    });
    console.log(`[Frontend API] saveJob(userId: ${userId}, jobId: ${jobId}) - Response status: ${res.status}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    console.log(`[Frontend API] saveJob(userId: ${userId}, jobId: ${jobId}) - Data parsed:`, JSON.stringify(data));
    if (data.success) return data.data;
  } catch (error) {
    console.error(`[Frontend API] Error saving job ${jobId} for user ${userId}:`, error);
  }
  return null;
}

export async function unsaveJob(userId: string, jobId: string): Promise<boolean> {
  console.log(`[Frontend API] unsaveJob(userId: ${userId}, jobId: ${jobId}) - Request started`);
  try {
    const res = await fetch(`/api/saved-jobs?userId=${userId}&jobId=${jobId}`, {
      method: 'DELETE',
    });
    console.log(`[Frontend API] unsaveJob(userId: ${userId}, jobId: ${jobId}) - Response status: ${res.status}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    console.log(`[Frontend API] unsaveJob(userId: ${userId}, jobId: ${jobId}) - Success status: ${data.success}`);
    return data.success;
  } catch (error) {
    console.error(`[Frontend API] Error unsaving job ${jobId} for user ${userId}:`, error);
  }
  return false;
}

export async function uploadResume(userId: string, file: File): Promise<any> {
  console.log(`[Frontend API] uploadResume(${userId}) - Request started (File: ${file.name}, Size: ${file.size})`);
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const res = await fetch('/api/upload-resume', {
      method: 'POST',
      body: formData,
    });
    console.log(`[Frontend API] uploadResume(${userId}) - Response status: ${res.status}`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log(`[Frontend API] uploadResume(${userId}) - Success parsed:`, JSON.stringify(data));
    return data;
  } catch (error: any) {
    console.error(`[Frontend API] Error uploading resume for user ${userId}:`, error);
    throw error;
  }
}

export async function parseResume(userId: string): Promise<any> {
  console.log(`[Frontend API] parseResume(${userId}) - Request started`);
  try {
    const res = await fetch('/api/parse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    console.log(`[Frontend API] parseResume(${userId}) - Response status: ${res.status}`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log(`[Frontend API] parseResume(${userId}) - Success parsed:`, JSON.stringify(data));
    return data;
  } catch (error: any) {
    console.error(`[Frontend API] Error parsing resume for user ${userId}:`, error);
    throw error;
  }
}
