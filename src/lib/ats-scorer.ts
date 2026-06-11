import { PREDEFINED_SKILLS } from "./skills-extractor";

interface DbSkill {
  name: string;
  level: number;
}

interface DbExperience {
  company: string;
  role: string;
  period: string;
  duration: string;
  description: string;
  skills: string[];
}

interface DbEducation {
  school: string;
  degree: string;
  period: string;
}

interface DbCertification {
  name: string;
  issuer: string;
  year: string;
}

interface DbProject {
  name: string;
  description: string;
  tech: string[];
}

interface DbProfile {
  headline?: string;
  bio?: string;
  skills: DbSkill[];
  location?: string;
  experience?: string;
  resumeUrl?: string;
  resumeName?: string;
  resumeText?: string;
  experiences: DbExperience[];
  education: DbEducation[];
  certifications: DbCertification[];
  projects: DbProject[];
  phone?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  userEmail?: string;
}

export interface AtsAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missingSections: string[];
  suggestions: string[];
}

export function calculateAtsScore(profile: DbProfile): AtsAnalysis {
  let score = 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const missingSections: string[] = [];
  const suggestions: string[] = [];

  // 1. Contact Information (Max 15 points)
  let contactScore = 0;
  const emailVal = profile.userEmail || "";
  const phoneVal = profile.phone || "";
  const linkedinVal = profile.linkedinUrl || "";
  const githubVal = profile.githubUrl || "";
  const portfolioVal = profile.portfolioUrl || "";

  const isDefaultPhone = phoneVal === "+91 98765 43210" || phoneVal.trim() === "";

  if (emailVal.trim()) {
    contactScore += 3;
  }
  if (phoneVal.trim() && !isDefaultPhone) {
    contactScore += 3;
    strengths.push("Contact phone number is provided.");
  } else {
    weaknesses.push("Missing valid phone number.");
    suggestions.push("Provide a direct phone number in your contact information for recruiters.");
  }

  if (linkedinVal.trim()) {
    contactScore += 3;
    strengths.push("LinkedIn profile is linked.");
  } else {
    weaknesses.push("Missing LinkedIn profile.");
    suggestions.push("Link your LinkedIn profile to increase visibility and network presence.");
  }

  if (githubVal.trim()) {
    contactScore += 3;
    strengths.push("GitHub profile is linked.");
  } else {
    weaknesses.push("Missing GitHub profile.");
    suggestions.push("Link your GitHub profile to showcase code quality and personal repositories.");
  }

  if (portfolioVal.trim()) {
    contactScore += 3;
    strengths.push("Personal portfolio website is linked.");
  } else {
    weaknesses.push("Missing portfolio link.");
    suggestions.push("Link a personal website or portfolio to showcase live versions of your work.");
  }

  if (contactScore === 15) {
    strengths.push("All vital contact links are successfully populated.");
  }
  score += contactScore;

  // 2. Skills Coverage (Max 20 points)
  const skillsCount = profile.skills?.length || 0;
  const skillsScore = Math.min(20, skillsCount * 2);
  score += skillsScore;

  if (skillsCount >= 8) {
    strengths.push(`Excellent skills coverage with ${skillsCount} skills defined.`);
  } else if (skillsCount >= 4) {
    strengths.push(`Good tech stack representation (${skillsCount} skills listed).`);
    suggestions.push("Add at least 8-10 technical skills to optimize your resume for automated scanners.");
  } else {
    weaknesses.push("Low technical skills keyword count.");
    suggestions.push("List more technical skills matching jobs you are targetting to increase ATS discovery.");
  }

  // 3. Education (Max 15 points)
  const educationCount = profile.education?.length || 0;
  if (educationCount > 0) {
    score += 15;
    strengths.push("Education section is structured and filled.");
  } else {
    weaknesses.push("Academic history is empty.");
    missingSections.push("Education");
    suggestions.push("Add your degree, major, and graduation year to complete the education history.");
  }

  // 4. Experience (Max 20 points)
  const experienceCount = profile.experiences?.length || 0;
  let expScore = 0;
  if (experienceCount >= 2) {
    expScore = 20;
    strengths.push("Robust work experience history (2+ structured roles).");
  } else if (experienceCount === 1) {
    expScore = 10;
    strengths.push("Professional experience section populated.");
    suggestions.push("Add additional past work experiences to show career history and longevity.");
  } else {
    weaknesses.push("Professional work history is blank.");
    missingSections.push("Experience");
    suggestions.push("List your past professional roles with detailed bullet points on accomplishments.");
  }
  score += expScore;

  // 5. Projects (Max 15 points)
  const projectCount = profile.projects?.length || 0;
  let projScore = 0;
  if (projectCount >= 2) {
    projScore = 15;
    strengths.push("Strong projects section displaying technical builds.");
  } else if (projectCount === 1) {
    projScore = 7.5;
    strengths.push("Technical project detail is provided.");
    suggestions.push("Add another project demonstrating a wider breadth of technical capabilities.");
  } else {
    weaknesses.push("No personal or professional projects listed.");
    missingSections.push("Projects");
    suggestions.push("List 2-3 projects with github links and key tech stacks used to demonstrate practical expertise.");
  }
  score += projScore;

  // 6. Certifications (Max 10 points)
  const certificationCount = profile.certifications?.length || 0;
  let certScore = 0;
  if (certificationCount >= 2) {
    certScore = 10;
    strengths.push("Multiple professional certifications listed.");
  } else if (certificationCount === 1) {
    certScore = 5;
    strengths.push("Professional certification details provided.");
  } else {
    weaknesses.push("No professional certifications or courses listed.");
    missingSections.push("Certifications");
    suggestions.push("Add relevant licenses, certifications, or online course credentials to boost credibility.");
  }
  score += certScore;

  // 7. Profile/Resume Completeness & Keyword Density (Max 5 points)
  let completenessScore = 0;
  if (profile.headline?.trim()) {
    completenessScore += 1.5;
    strengths.push("Professional headline is set.");
  } else {
    suggestions.push("Write a clear headline summary (e.g. 'Software Engineer | React & Django').");
  }

  if (profile.bio?.trim()) {
    completenessScore += 1.5;
    strengths.push("Professional biography/bio is set.");
  } else {
    suggestions.push("Write a brief bio outlining your experience, interests, and target roles.");
  }

  if (profile.resumeUrl?.trim()) {
    completenessScore += 2.0;
    strengths.push("Resume file uploaded.");
  } else {
    weaknesses.push("No resume PDF/DOCX uploaded.");
    missingSections.push("Resume Upload");
    suggestions.push("Upload your PDF or DOCX resume to enable parsing and score calculations.");
  }
  score += completenessScore;

  // 8. Keyword Density & Resume Text Analysis (Optional check / modifier)
  // Let's analyze keywords from the extracted resumeText if present.
  const resumeText = profile.resumeText || "";
  if (resumeText.trim().length > 200) {
    const textLower = resumeText.toLowerCase();
    let matchedKeywords = 0;
    for (const skill of PREDEFINED_SKILLS) {
      const match = skill.aliases.some(alias => textLower.includes(alias.toLowerCase()));
      if (match) {
        matchedKeywords++;
      }
    }
    // High keyword match gives positive feedback
    if (matchedKeywords >= 10) {
      strengths.push(`High resume keyword optimization (${matchedKeywords} matched skills).`);
    } else if (matchedKeywords > 0 && matchedKeywords < 5) {
      weaknesses.push("Resume keyword density is relatively low.");
      suggestions.push("Include more target keywords in your resume text to trigger automated ATS scanner matches.");
    }
  }

  // Ensure score is bounded between 0 and 100, and rounded
  const finalScore = Math.min(100, Math.max(0, Math.round(score)));

  return {
    score: finalScore,
    strengths,
    weaknesses,
    missingSections,
    suggestions
  };
}
