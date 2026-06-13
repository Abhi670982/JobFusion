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
  extractedSkillsText?: string;
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
  resumeSkillMode?: 'merge' | 'replace';
  resumeCategory?: string;
  resumeSummary?: string;
  suggestedRoles?: string[];
  resumeInsights?: {
    found: string[];
    missing: string[];
    tips: string[];
  };
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
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success && data.user) {
      return data.user;
    }
  } catch (error) {
    console.error("Error fetching current user:", error);
  }
  return null;
}

export async function fetchProfile(userId: string): Promise<DbProfile | null> {
  try {
    const res = await fetch(`/api/profile?userId=${userId}`);
    if (!res.ok) {
      if (res.status === 404) return null; // Profile doesn't exist yet
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (data.success) return data.data;
  } catch (error) {
    console.error("Error fetching profile:", error);
  }
  return null;
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
    if (data.success) return data.data;
  } catch (error) {
    console.error("Error updating profile:", error);
  }
  return null;
}

export async function fetchJobs(): Promise<DbJob[]> {
  try {
    const res = await fetch('/api/jobs');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) return data.data;
  } catch (error) {
    console.error("Error fetching jobs:", error);
  }
  return [];
}

export async function fetchJobById(id: string): Promise<DbJob | null> {
  try {
    const res = await fetch(`/api/jobs?id=${id}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) return data.data;
  } catch (error) {
    console.error("Error fetching job by ID:", error);
  }
  return null;
}

export async function fetchApplications(userId: string): Promise<DbApplication[]> {
  try {
    const res = await fetch(`/api/applications?userId=${userId}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) return data.data;
  } catch (error) {
    console.error("Error fetching applications:", error);
  }
  return [];
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
    if (data.success) return data.data;
  } catch (error) {
    console.error("Error applying to job:", error);
  }
  return null;
}

export async function fetchSavedJobs(userId: string): Promise<DbSavedJob[]> {
  try {
    const res = await fetch(`/api/saved-jobs?userId=${userId}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) return data.data;
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
  }
  return [];
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
    if (data.success) return data.data;
  } catch (error) {
    console.error("Error saving job:", error);
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
    return data.success;
  } catch (error) {
    console.error("Error unsaving job:", error);
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
    return await res.json();
  } catch (error: any) {
    console.error("Error in uploadResume helper:", error);
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
    return await res.json();
  } catch (error: any) {
    console.error("Error in parseResume helper:", error);
    throw error;
  }
}
