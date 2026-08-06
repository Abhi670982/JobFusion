import { redirect } from 'next/navigation';

/**
 * Redirect /saved-jobs to the canonical Saved Jobs route (/jobs/saved)
 */
export default function SavedJobsRedirectPage() {
  redirect('/jobs/saved');
}
