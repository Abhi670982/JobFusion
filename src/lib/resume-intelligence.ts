/**
 * Resume Intelligence Engine
 * Analyzes raw resume text and extracts structured insights:
 * - Resume category/domain classification
 * - Suggested career roles
 * - Auto-generated professional summary
 * - Resume insights (what was found, what's missing)
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface ResumeInsights {
  found: string[];       // Sections / signals detected
  missing: string[];     // Sections that seem absent
  tips: string[];        // Actionable improvements
}

export interface ResumeIntelligenceResult {
  category: string;
  suggestedRoles: string[];
  resumeSummary: string;
  insights: ResumeInsights;
}

// ── Category Detection ───────────────────────────────────────────────────────

interface CategorySignal {
  category: string;
  keywords: string[];
  roles: string[];
}

const CATEGORY_SIGNALS: CategorySignal[] = [
  {
    category: "Software Development",
    keywords: ["javascript", "typescript", "python", "java", "react", "node", "backend", "frontend", "full stack", "api", "software engineer", "developer", "coding", "programming", "github", "git", "web development", "docker", "microservices", "rest api", "graphql", "c++", "golang", "kotlin", "swift", "flutter"],
    roles: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Software Engineer", "Mobile Developer", "DevOps Engineer", "Site Reliability Engineer"],
  },
  {
    category: "Data Science & Analytics",
    keywords: ["data science", "machine learning", "deep learning", "python", "pandas", "numpy", "tensorflow", "pytorch", "scikit-learn", "tableau", "power bi", "data analyst", "data scientist", "sql", "big data", "hadoop", "spark", "r language", "statistics", "visualization", "nlp", "ai", "artificial intelligence"],
    roles: ["Data Scientist", "Data Analyst", "Business Intelligence Analyst", "ML Engineer", "AI Engineer", "Research Scientist"],
  },
  {
    category: "UI/UX Design",
    keywords: ["figma", "photoshop", "illustrator", "adobe xd", "sketch", "ui design", "ux design", "user experience", "wireframing", "prototyping", "canva", "design system", "user research", "usability testing", "interaction design", "visual design", "motion design", "after effects"],
    roles: ["UI Designer", "UX Designer", "Product Designer", "Visual Designer", "Interaction Designer", "UX Researcher"],
  },
  {
    category: "Marketing",
    keywords: ["digital marketing", "seo", "sem", "social media", "content marketing", "email marketing", "google analytics", "brand management", "market research", "ppc", "advertising", "campaign", "marketing", "copywriting", "influencer", "growth hacking", "crm", "salesforce", "hubspot"],
    roles: ["Digital Marketing Executive", "SEO Specialist", "Content Marketer", "Social Media Manager", "Brand Manager", "Growth Marketing Manager", "Marketing Analyst"],
  },
  {
    category: "Finance & Accounting",
    keywords: ["accounting", "finance", "tally", "taxation", "gst", "audit", "financial analysis", "budgeting", "ms excel", "pivot table", "bookkeeping", "balance sheet", "profit and loss", "ifrs", "gaap", "investment", "banking", "equity", "ca", "cma", "cfa", "mba finance", "cost accounting", "payroll"],
    roles: ["Financial Analyst", "Accountant", "Auditor", "Tax Consultant", "Finance Manager", "Investment Analyst", "CA", "CFO"],
  },
  {
    category: "Human Resources",
    keywords: ["recruitment", "talent acquisition", "onboarding", "payroll", "performance management", "employee relations", "training", "hr", "human resources", "hrms", "labour law", "compensation", "benefits", "hr analytics", "campus hiring", "sourcing", "jd writing", "keka", "darwinbox", "workday"],
    roles: ["HR Executive", "Talent Acquisition Specialist", "HR Manager", "HR Business Partner", "Recruiter", "Training Manager", "HR Analyst"],
  },
  {
    category: "Operations & Supply Chain",
    keywords: ["supply chain", "logistics", "procurement", "inventory", "warehouse", "operations", "lean", "six sigma", "erp", "sap", "project management", "vendor management", "quality control", "iso", "process improvement", "kaizen", "business analysis"],
    roles: ["Operations Executive", "Supply Chain Manager", "Logistics Manager", "Procurement Manager", "Business Analyst", "Project Manager", "Quality Manager"],
  },
  {
    category: "Sales & Business Development",
    keywords: ["sales", "business development", "lead generation", "account management", "b2b", "b2c", "cold calling", "crm", "salesforce", "channel sales", "revenue", "targets", "negotiation", "client acquisition", "key account"],
    roles: ["Sales Executive", "Business Development Manager", "Key Account Manager", "Sales Manager", "Inside Sales Executive", "BD Executive"],
  },
  {
    category: "Business Management",
    keywords: ["mba", "management", "strategy", "consulting", "general management", "p&l", "stakeholder management", "leadership", "board", "ceo", "coo", "strategic planning", "business strategy", "change management"],
    roles: ["Management Consultant", "Business Analyst", "Strategy Manager", "General Manager", "Operations Manager", "Chief of Staff"],
  },
];

// ── Section Detection ────────────────────────────────────────────────────────

const SECTION_PATTERNS: Record<string, string[]> = {
  contact:        ["email", "@", "phone", "mobile", "contact", "linkedin", "github", "portfolio"],
  education:      ["education", "b.tech", "btech", "mca", "mba", "b.com", "bcom", "bba", "m.sc", "m.tech", "mtech", "bachelor", "master", "degree", "university", "college", "cgpa", "gpa", "10th", "12th"],
  experience:     ["experience", "work experience", "employment", "internship", "worked at", "professional experience", "company", "designation", "role", "responsibilities"],
  skills:         ["skills", "technical skills", "core competencies", "tools", "technologies", "proficient", "expertise"],
  projects:       ["project", "projects", "personal project", "academic project", "capstone", "built", "developed", "created"],
  certifications: ["certification", "certified", "certificate", "course", "training", "udemy", "coursera", "edx", "nptel"],
  achievements:   ["achievement", "award", "honor", "recognition", "winner", "rank", "topper", "distinction", "scholarship"],
  languages:      ["language", "english", "hindi", "spoken language", "linguistic"],
};

function detectSections(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
    if (patterns.some(p => lower.includes(p))) {
      found.push(section);
    }
  }
  return found;
}

// ── Category Classification ──────────────────────────────────────────────────

function classifyCategory(text: string): CategorySignal {
  const lower = text.toLowerCase();
  let best = CATEGORY_SIGNALS[0];
  let bestScore = 0;

  for (const signal of CATEGORY_SIGNALS) {
    const score = signal.keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      best = signal;
    }
  }

  // Fall back to General Professional if signal is too weak
  if (bestScore < 2) {
    return {
      category: "General Professional",
      keywords: [],
      roles: ["Administrative Executive", "Office Coordinator", "Business Associate", "Management Trainee"],
    };
  }

  return best;
}

// ── Summary Generation ───────────────────────────────────────────────────────

function extractName(text: string): string {
  // Try to get the first non-empty line as candidate name
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const nameLine = lines[0] || "";
  // Keep if it looks like a name (short, mostly alphabetic)
  if (nameLine.length <= 50 && /^[A-Za-z\s.'-]+$/.test(nameLine)) {
    return nameLine;
  }
  return "";
}

function extractYearsOfExp(text: string): string {
  // Pattern: "5 years", "3+ years", "2 yrs"
  const match = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i);
  if (match) return `${match[1]}+ years`;
  return "";
}

function generateSummary(text: string, category: string, topSkills: string[], detectedSections: string[]): string {
  const yearsExp = extractYearsOfExp(text);
  const hasExp   = detectedSections.includes("experience");
  const hasEdu   = detectedSections.includes("education");
  const hasCerts = detectedSections.includes("certifications");
  const hasProjects = detectedSections.includes("projects");

  // Pick up to 4 skills for the summary
  const skillMention = topSkills.slice(0, 4).join(", ");

  const parts: string[] = [];

  // Opening — who they are
  if (yearsExp) {
    parts.push(`Professional with ${yearsExp} of experience in ${category}`);
  } else if (hasExp) {
    parts.push(`Experienced professional in ${category}`);
  } else if (hasEdu) {
    parts.push(`${category} graduate and aspiring professional`);
  } else {
    parts.push(`Professional with a background in ${category}`);
  }

  // Skills mention
  if (skillMention) {
    parts.push(`skilled in ${skillMention}`);
  }

  // Supporting signals
  const extras: string[] = [];
  if (hasProjects) extras.push("demonstrated through hands-on projects");
  if (hasCerts)    extras.push("backed by relevant certifications");
  if (extras.length) parts.push(extras.join(" and "));

  return parts.join(", ").replace(/,\s*$/, "") + ".";
}

// ── Insights Builder ─────────────────────────────────────────────────────────

function buildInsights(
  detectedSections: string[],
  skillCount: number,
  category: string,
): ResumeInsights {
  const found: string[] = [];
  const missing: string[] = [];
  const tips: string[] = [];

  const sectionLabels: Record<string, string> = {
    contact:        "Contact Information",
    education:      "Education",
    experience:     "Work Experience",
    skills:         "Skills Section",
    projects:       "Projects",
    certifications: "Certifications",
    achievements:   "Achievements",
    languages:      "Languages",
  };

  for (const [key, label] of Object.entries(sectionLabels)) {
    if (detectedSections.includes(key)) {
      found.push(`${label} detected`);
    } else {
      missing.push(label);
    }
  }

  if (skillCount > 0) {
    found.push(`${skillCount} relevant skills identified`);
  } else {
    tips.push("Add a clear Skills section listing your key competencies.");
  }

  if (missing.includes("Certifications")) {
    tips.push("Consider adding certifications or online courses to strengthen credibility.");
  }
  if (missing.includes("Projects")) {
    tips.push("Include at least 2 projects (academic or personal) with descriptions.");
  }
  if (missing.includes("Work Experience")) {
    tips.push("Add internships or work experience — even short stints add significant value.");
  }
  if (skillCount < 5) {
    tips.push(`List domain-specific skills relevant to ${category} roles for better visibility.`);
  }
  if (missing.includes("Contact Information")) {
    tips.push("Include your email, phone number, and LinkedIn profile at the top of your resume.");
  }

  return { found, missing, tips };
}

// ── Main Export ──────────────────────────────────────────────────────────────

export function analyzeResume(
  resumeText: string,
  extractedSkillNames: string[],
): ResumeIntelligenceResult {
  if (!resumeText || resumeText.trim().length < 50) {
    return {
      category: "General Professional",
      suggestedRoles: ["Management Trainee", "Administrative Executive"],
      resumeSummary: "Resume text is too short to generate a detailed summary.",
      insights: { found: [], missing: Object.values({
        contact: "Contact Information", education: "Education", experience: "Work Experience",
        skills: "Skills Section", projects: "Projects", certifications: "Certifications",
      }), tips: ["Upload a richer resume for better analysis."] },
    };
  }

  const detectedSections = detectSections(resumeText);
  const categorySignal   = classifyCategory(resumeText);
  const resumeSummary    = generateSummary(resumeText, categorySignal.category, extractedSkillNames, detectedSections);
  const insights         = buildInsights(detectedSections, extractedSkillNames.length, categorySignal.category);

  return {
    category:       categorySignal.category,
    suggestedRoles: categorySignal.roles.slice(0, 5),
    resumeSummary,
    insights,
  };
}
