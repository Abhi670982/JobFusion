import { DbProfile, DbUser } from "./api-helper";

export function calculateCompletion(profile: DbProfile | null, user: DbUser | null): number {
  if (!profile) return 0;
  
  let score = 0;
  
  // 1. Profile photo (10%)
  if (user?.profileImage) score += 10;
  
  // 2. Name (5%)
  if (user?.fullName && user.fullName.trim().length > 0) score += 5;
  
  // 3. Email (5%)
  if (user?.email && user.email.trim().length > 0) score += 5;
  
  // 4. Phone (10%)
  if (profile.phone && profile.phone.trim().length > 0) score += 10;
  
  // 5. Location (15%)
  if (profile.location && profile.location.trim().length > 0) score += 15;
  
  // 6. Skills (20%) - has at least one skill
  if (profile.skills && profile.skills.length > 0) score += 20;
  
  // 7. Resume uploaded (25%)
  if (profile.resumeUrl && profile.resumeUrl.trim().length > 0) score += 25;
  
  // 8. LinkedIn (5%)
  if (profile.linkedinUrl && profile.linkedinUrl.trim().length > 0) score += 5;
  
  // 9. Portfolio (5%)
  if (profile.portfolioUrl && profile.portfolioUrl.trim().length > 0) score += 5;
  
  return score;
}
