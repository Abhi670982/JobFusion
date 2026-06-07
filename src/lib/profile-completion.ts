import { DbProfile, DbUser } from "./api-helper";

export function calculateCompletion(profile: DbProfile | null, user: DbUser | null): number {
  if (!profile) return 0;
  
  let score = 0;
  
  // 1. Profile photo (15%)
  const hasPhoto = !!user?.profileImage;
  if (hasPhoto) score += 15;
  
  // 2. Headline (15%)
  const hasHeadline = !!profile.headline && profile.headline.trim().length > 0;
  if (hasHeadline) score += 15;
  
  // 3. Skills (15%) - has at least one skill
  const hasSkills = profile.skills && profile.skills.length > 0;
  if (hasSkills) score += 15;
  
  // 4. Resume (15%)
  const hasResume = !!profile.resumeUrl && profile.resumeUrl.trim().length > 0;
  if (hasResume) score += 15;
  
  // 5. Education (15%) - has at least one education entry
  const hasEducation = profile.education && profile.education.length > 0;
  if (hasEducation) score += 15;
  
  // 6. Experience (15%) - has at least one experience entry or overall experience level set
  const hasExperience = (profile.experiences && profile.experiences.length > 0) || (!!profile.experience && profile.experience.trim().length > 0);
  if (hasExperience) score += 15;
  
  // 7. Social links (10%) - at least one social link provided
  const hasSocials = 
    (!!profile.githubUrl && profile.githubUrl.trim().length > 0) || 
    (!!profile.linkedinUrl && profile.linkedinUrl.trim().length > 0) || 
    (!!profile.portfolioUrl && profile.portfolioUrl.trim().length > 0);
  if (hasSocials) score += 10;
  
  return score;
}
