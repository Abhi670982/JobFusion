import { DbJob } from './api-helper';

export interface VisitedJob {
  _id: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyColor?: string;
  location: string;
  salary: string;
  matchScore: number;
  visitedAt: string;
}

const STORAGE_KEY = 'jobfusion_visited_jobs';
const MAX_HISTORY_LIMIT = 20;

export function trackVisitedJob(job: DbJob): void {
  if (typeof window === 'undefined') return;

  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    let history: VisitedJob[] = rawData ? JSON.parse(rawData) : [];

    // Filter out any existing occurrence of this job to move it to the top
    history = history.filter(item => item._id !== job._id);

    const visitedItem: VisitedJob = {
      _id: job._id,
      title: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      companyColor: job.companyColor,
      location: job.location,
      salary: job.salary,
      matchScore: job.matchScore,
      visitedAt: new Date().toISOString(),
    };

    history.unshift(visitedItem);

    // Keep only the most recent items
    if (history.length > MAX_HISTORY_LIMIT) {
      history = history.slice(0, MAX_HISTORY_LIMIT);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to track visited job:', error);
  }
}

export function getVisitedJobs(): VisitedJob[] {
  if (typeof window === 'undefined') return [];

  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    console.error('Failed to retrieve visited jobs:', error);
    return [];
  }
}

export function clearVisitedJobs(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear visited jobs:', error);
  }
}
