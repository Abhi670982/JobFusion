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
  
  // 4. Phone (5%)
  if (profile.phone && profile.phone.trim().length > 0) score += 5;
  
  // 5. Location (10%)
  if (profile.location && profile.location.trim().length > 0) score += 10;
  
  // 6. Education (15%) - has at least one education entry
  if (profile.education && profile.education.length > 0) score += 15;
  
  // 7. Experience (15%) - has at least one experience entry or experience set
  const hasExperience = (profile.experiences && profile.experiences.length > 0) || (profile.experience && profile.experience.trim().length > 0);
  if (hasExperience) score += 15;
  
  // 8. Skills (10%) - has at least one skill
  if (profile.skills && profile.skills.length > 0) score += 10;
  
  // 9. Resume uploaded (15%)
  if (profile.resumeUrl && profile.resumeUrl.trim().length > 0) score += 15;
  
  // 10. LinkedIn (4%)
  if (profile.linkedinUrl && profile.linkedinUrl.trim().length > 0) score += 4;
  
  // 11. Portfolio (3%)
  if (profile.portfolioUrl && profile.portfolioUrl.trim().length > 0) score += 3;
  
  // 12. Certifications (4%) - has at least one certification
  if (profile.certifications && profile.certifications.length > 0) score += 4;
  
  return score;
}
