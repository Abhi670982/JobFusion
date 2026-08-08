/**
 * Resume Analyzer — Premium Hybrid AI Resume Coach
 *
 * Part 1: Deterministic rule-based analysis (instant, layout check)
 * Part 2: Gemini-powered deep analysis (single consolidated prompt → one API call)
 *
 * Integrates with the centralized AIProviderConfig architecture.
 */

import { generateAIJson } from './ai-client';
import type { AIProviderConfig } from './ai-provider';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScoreDetail {
  score: number;
  maxScore: number;
  reason: string;
  positives: string[];
  problems: string[];
  recruiterPerspective: string;
  atsPerspective: string;
  improvements: string[];
  expectedScoreAfterFix: number;
  priority: 'high' | 'medium' | 'low';
  missingSkills?: string[];
  evidence?: string[];
}

export type CandidateCategory = 'Student' | 'Fresher' | 'Intern' | 'Junior Engineer' | 'Mid-Level Engineer' | 'Senior Engineer';

export interface ROIImprovement {
  title: string;
  action: string;
  category: string;
  currentScore: number;
  expectedScore: number;
  scoreGain: number;
  shortlistGain: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

export interface RecruiterVerdict {
  verdict: string;
  wouldShortlist: 'YES' | 'MAYBE' | 'NO';
  shortlistingProbability: string;
  atsPassProbability: string;
  marketCompetitiveness: string;
  resumeTier: string;
  careerCategory: CandidateCategory;
  peerBenchmarkComparison: string;
  topStrengths: string[];
  biggestWeakness: string;
  highestROIImprovement: ROIImprovement;
  roiImprovements: ROIImprovement[];
  recommendedRoles: string[];
}

export interface DetailedKeyword {
  term: string;
  status: 'matched' | 'missing' | 'weak';
  category: 'technical' | 'industry' | 'soft-skill';
  location: string;
  importance: 'high' | 'medium' | 'low';
  estimatedAtsImpact: number;
  recruiterReason: string;
}


export interface KeywordAnalysis {
  matched: string[];
  missing: string[];
  weak: string[];
  technical: string[];
  industry: string[];
  trending: string[];
  density: number;
  detailedList: DetailedKeyword[];
}

export interface SkillsBreakdown {
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  cloud: string[];
  devops: string[];
  aiMl: string[];
  tools: string[];
  softSkills: string[];
  missing: string[];
  recommended: string[];
  trendingSkills: string[];
  nextToLearn: string[];
}

export interface SeniorityAnalysis {
  level: 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Executive';
  title: string;
  reasoning: string;
  readinessScore: number;
  marketSalaryEstimate: string;
  growthPath: string[];
}

export interface ProjectAudit {
  projectName: string;
  currentDescription: string;
  score: number;
  complexity: 'High' | 'Medium' | 'Low';
  strengths: string[];
  weaknesses: string[];
  missingBusinessImpact: string;
  missingMetrics: string[];
  missingActionVerbs: string[];
  recruiterImpression: string;
  suggestedRewrite: string;
  expectedImprovement: string;
  suggestions: Array<{
    original: string;
    improved: string;
    rationale: string;
  }>;
}

export interface ExperienceAudit {
  company: string;
  role: string;
  period: string;
  evaluations: {
    impact: string;
    leadership: string;
    ownership: string;
    achievements: string;
    businessValue: string;
  };
  recruiterImpression: string;
  atsCompatibility: string;
  bulletSuggestions: Array<{
    original: string;
    improved: string;
    rationale: string;
  }>;
}

export interface GrammarAnalysis {
  passiveVoiceLines: string[];
  weakWordings: string[];
  repetitivePhrases: string[];
  grammarMistakes: string[];
  sentenceImprovements: Array<{
    original: string;
    improved: string;
    rationale: string;
  }>;
}

export interface SummaryReview {
  score: number;
  professionalism: string;
  confidence: string;
  technicalDepth: string;
  readability: string;
  recruiterAppeal: string;
  suggestedRewrite: string;
}

export interface CoachInsights {
  recruiterImpression: string;
  interviewReadiness: string; // e.g. "Medium (60%)"
  strengths: string[];
  weaknesses: string[];
  growthSuggestions: string[];
  recommendations: {
    learning: string[];
    portfolio: string[];
    github: string[];
    linkedin: string[];
  };
  mostSuitableRoles: string[];
  rolesToAvoid: string[];
  expectedSalaryRange: string;
  maturityLevel: string;
}

export interface RoadmapStep {
  priority: 'high' | 'medium' | 'low';
  title: string;
  reason: string;
}

export interface SectionStatus {
  name: string;
  found: boolean;
  quality: 'good' | 'needs-work' | 'missing';
  note: string;
}

export interface AnalysisReport {
  overallScore: number;
  atsScore: number;
  formattingScore: number;
  keywordScore: number;
  skillsScore: number;
  experienceScore: number;
  projectsScore: number;
  educationScore: number;
  achievementsScore: number;
  grammarScore: number;
  profileStrength: number;
  confidenceScore: number;
  confidenceReason: string;

  verdict: RecruiterVerdict;
  scores: Record<string, ScoreDetail>;
  projectAnalysis: ProjectAudit[];
  experienceAnalysis: ExperienceAudit[];
  keywords: KeywordAnalysis;
  skills: SkillsBreakdown;
  seniority: SeniorityAnalysis;
  grammar: GrammarAnalysis;
  summaryReview: SummaryReview;
  coach: CoachInsights;
  roadmap: RoadmapStep[];
  sections: SectionStatus[];
  resumeCategory: string;
  analyzedAt: string;
}

// Raw AI response shape
interface AIAnalysisRaw {
  verdict: RecruiterVerdict;
  scores: {
    overall: ScoreDetail;
    skills: ScoreDetail;
    ats: ScoreDetail;
    formatting: ScoreDetail;
    experience: ScoreDetail;
    projects: ScoreDetail;
    education: ScoreDetail;
    achievements: ScoreDetail;
    grammar: ScoreDetail;
  };
  projectAnalysis: ProjectAudit[];
  experienceAnalysis: ExperienceAudit[];
  keywords: {
    matched: string[];
    missing: string[];
    weak: string[];
    technical: string[];
    industry: string[];
    trending: string[];
    density: number;
    detailedList: DetailedKeyword[];
  };
  skills: {
    programmingLanguages: string[];
    frameworks: string[];
    databases: string[];
    cloud: string[];
    devops: string[];
    aiMl: string[];
    tools: string[];
    softSkills: string[];
    missing: string[];
    recommended: string[];
    trendingSkills: string[];
    nextToLearn: string[];
  };
  grammar: GrammarAnalysis;
  summaryReview: SummaryReview;
  coach: CoachInsights;
  seniority: SeniorityAnalysis;
  roadmap: RoadmapStep[];
  resumeCategory: string;
}

// Deterministic result
interface DeterministicResult {
  sectionScore: number;
  contactScore: number;
  formattingScore: number;
  educationScore: number;
  lengthScore: number;
  bulletScore: number;
  dateConsistencyScore: number;
  headingScore: number;
  sections: SectionStatus[];
  wordCount: number;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLinkedIn: boolean;
  hasGitHub: boolean;
  hasPortfolio: boolean;
  hasGPA: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

export function computeResumeHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ── Part 1: Deterministic Layout Check ────────────────────────────────────────

const SECTION_PATTERNS: Record<string, { keywords: string[]; label: string }> = {
  contact: {
    label: 'Contact Information',
    keywords: ['email', '@', 'phone', 'mobile', 'linkedin', 'github', 'portfolio', 'website'],
  },
  education: {
    label: 'Education',
    keywords: ['education', 'b.tech', 'btech', 'mca', 'mba', 'bachelor', 'master', 'degree', 'university', 'college', 'cgpa', 'gpa'],
  },
  experience: {
    label: 'Work Experience',
    keywords: ['experience', 'work experience', 'employment', 'internship', 'professional experience', 'worked at', 'responsibilities'],
  },
  skills: {
    label: 'Skills',
    keywords: ['skills', 'technical skills', 'core competencies', 'tools', 'technologies', 'proficient', 'expertise'],
  },
  projects: {
    label: 'Projects',
    keywords: ['project', 'projects', 'personal project', 'academic project', 'built', 'developed', 'created'],
  },
  certifications: {
    label: 'Certifications',
    keywords: ['certification', 'certified', 'certificate', 'course', 'training', 'udemy', 'coursera'],
  },
  achievements: {
    label: 'Achievements',
    keywords: ['achievement', 'award', 'honor', 'recognition', 'winner', 'rank', 'scholarship'],
  },
  summary: {
    label: 'Professional Summary',
    keywords: ['summary', 'objective', 'profile', 'about me', 'professional summary', 'career objective'],
  },
};

function runDeterministicAnalysis(text: string): DeterministicResult {
  const lower = text.toLowerCase();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const hasEmail = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /[\+]?[\d\s\-\(\)]{10,}/.test(text);
  const hasLinkedIn = lower.includes('linkedin');
  const hasGitHub = lower.includes('github');
  const hasPortfolio = lower.includes('portfolio') || lower.includes('website') || /https?:\/\//.test(text);

  const contactCount = [hasEmail, hasPhone, hasLinkedIn, hasGitHub, hasPortfolio].filter(Boolean).length;
  const contactScore = clamp((contactCount / 5) * 100);

  const sections: SectionStatus[] = Object.entries(SECTION_PATTERNS).map(([, cfg]) => {
    const found = cfg.keywords.some(kw => lower.includes(kw));
    return {
      name: cfg.label,
      found,
      quality: found ? 'good' : 'missing',
      note: found ? `${cfg.label} detected` : `${cfg.label} not found — consider adding it`,
    };
  });

  const coreKeys = ['contact', 'education', 'experience', 'skills'];
  const optionalKeys = ['projects', 'certifications', 'achievements', 'summary'];
  const foundCore = coreKeys.filter(k => sections.find(s => s.name === SECTION_PATTERNS[k].label)?.found).length;
  const foundOptional = optionalKeys.filter(k => sections.find(s => s.name === SECTION_PATTERNS[k].label)?.found).length;
  const sectionScore = clamp((foundCore / coreKeys.length) * 70 + (foundOptional / optionalKeys.length) * 30);

  let lengthScore = 100;
  if (wordCount < 150) lengthScore = 30;
  else if (wordCount < 300) lengthScore = 55;
  else if (wordCount < 400) lengthScore = 75;
  else if (wordCount > 1200) lengthScore = 70;
  else if (wordCount > 900) lengthScore = 85;

  const bulletLines = lines.filter(l => /^[\•\-\*\◦\▪]/.test(l));
  const bulletRatio = lines.length > 0 ? bulletLines.length / lines.length : 0;
  const bulletScore = clamp(bulletRatio > 0.15 && bulletRatio < 0.7 ? 85 : bulletRatio > 0 ? 60 : 40);

  const headingLines = lines.filter(l => (l === l.toUpperCase() && l.length > 3 && l.length < 40) || l.length < 35);
  const headingScore = clamp(headingLines.length >= 3 ? 80 : headingLines.length > 0 ? 55 : 30);

  const hasYears = /\b(19|20)\d{2}\b/.test(text);
  const dateConsistencyScore = hasYears ? 80 : 40;

  const educationFound = sections.find(s => s.name === 'Education')?.found;
  const hasDegree = /(bachelor|master|b\.tech|m\.tech|btech|mtech|mba|b\.com|bba)/i.test(text);
  const hasGPA = /(cgpa|gpa|percentage|%)/i.test(text);
  const educationScore = clamp(
    (educationFound ? 40 : 0) + (hasDegree ? 40 : 0) + (hasGPA ? 20 : 0)
  );

  const formattingScore = clamp(
    bulletScore * 0.35 + lengthScore * 0.30 + headingScore * 0.35
  );

  return {
    sectionScore,
    contactScore,
    formattingScore,
    educationScore,
    lengthScore,
    bulletScore,
    dateConsistencyScore,
    headingScore,
    sections,
    wordCount,
    hasEmail,
    hasPhone,
    hasLinkedIn,
    hasGitHub,
    hasPortfolio,
    hasGPA,
  };
}

// ── Part 2: AI Prompt Design ──────────────────────────────────────────────────

function buildAIPrompt(resumeText: string, jobDescription?: string): string {
  const truncated = resumeText.length > 6000 ? resumeText.slice(0, 6000) + '\n[Resume truncated]' : resumeText;

  let targetText = '';
  if (jobDescription && jobDescription.trim().length > 30) {
    targetText = `\n\nTARGET JOB DESCRIPTION TO MATCH AGAINST:\n---\n${jobDescription.trim().slice(0, 2000)}\n---`;
  }

  return `You are a Principal Senior Technical Recruiter, Hiring Manager, and ATS Architect.
Your PRIMARY GOAL is to evaluate whether a recruiter would shortlist this candidate within their peer pool.

RECRUITER-FIRST EVALUATION PHILOSOPHY:
1. CANDIDATE CATEGORY CLASSIFICATION:
   - First, classify the candidate into exactly ONE category: "Student", "Fresher", "Intern", "Junior Engineer", "Mid-Level Engineer", or "Senior Engineer".
   - Compare the candidate ONLY against peers in the same category. Do NOT evaluate a Student against a Senior Engineer benchmark.

2. RECRUITER SHORTLIST METRICS:
   - Recruiter Verdict: Executive synthesis of why this candidate would or would not be shortlisted.
   - Shortlisting Probability: e.g. "82% High", "55% Moderate", "30% Low".
   - ATS Pass Probability: e.g. "88% High".
   - Market Competitiveness: e.g. "Top 15% in Mid-Level Pool", "Top 30% in Student Pool".
   - Resume Tier: "Tier 1 - Strong Candidate", "Tier 2 - Competitive Candidate", or "Tier 3 - Needs Polish".

3. HIGHEST ROI IMPROVEMENTS (+X POINTS ESTIMATOR):
   - Identify the candidate's Biggest Weakness.
   - Calculate precise score gains (+X points) and shortlist probability gains (+Y%) for fixing each weakness.
   - Example 1: Title "Quantify Work Experience Metrics", Action "Add specific metric outputs (% latency reduction, scale, users) to bullet points", currentScore 65, expectedScore 72, scoreGain 7, shortlistGain "+12%".
   - Example 2: Title "Add Cloud Infrastructure Keywords", Action "Detail AWS & Docker usage", currentScore 72, expectedScore 75, scoreGain 3, shortlistGain "+5%".

4. RECRUITER WEIGHTING STRUCTURE:
   - Professional Experience: 30%
   - Projects: 25%
   - Technical Skills: 15%
   - ATS Keywords: 10%
   - Achievements: 10%
   - Education: 5%
   - Formatting: 5%

5. SECTION EVIDENCE:
   - Provide exact text quotes in the "evidence" array for every score category.

The JSON schema must contain precisely:
{
  "verdict": {
    "verdict": "Executive recruiter synthesis of candidate shortlist potential...",
    "wouldShortlist": "YES" | "MAYBE" | "NO",
    "shortlistingProbability": "82% High",
    "atsPassProbability": "88% High",
    "marketCompetitiveness": "Top 15% in Mid-Level Pool",
    "resumeTier": "Tier 1 - Strong Candidate",
    "careerCategory": "Student" | "Fresher" | "Intern" | "Junior Engineer" | "Mid-Level Engineer" | "Senior Engineer",
    "peerBenchmarkComparison": "Compared strictly against peer candidates at the Mid-Level Engineer benchmark.",
    "topStrengths": ["Fullstack production architecture", "Strong TypeScript & React patterns"],
    "biggestWeakness": "Lack of quantified metric outputs in work experience statements",
    "highestROIImprovement": {
      "title": "Quantify Work Experience Metrics",
      "action": "Add specific metric outputs (% latency reduction, scale, users) to bullet points.",
      "category": "Work Experience",
      "currentScore": 65,
      "expectedScore": 72,
      "scoreGain": 7,
      "shortlistGain": "+12%",
      "priority": "high",
      "rationale": "Recruiters prioritize candidates with proven business impact."
    },
    "roiImprovements": [
      {
        "title": "Quantify Work Experience Metrics",
        "action": "Add specific metric outputs to bullet points.",
        "category": "Work Experience",
        "currentScore": 65,
        "expectedScore": 72,
        "scoreGain": 7,
        "shortlistGain": "+12%",
        "priority": "high",
        "rationale": "High impact on recruiter shortlisting."
      },
      {
        "title": "Detail Cloud & Containerization Tools",
        "action": "Add Docker & AWS keywords.",
        "category": "Technical Skills",
        "currentScore": 72,
        "expectedScore": 75,
        "scoreGain": 3,
        "shortlistGain": "+5%",
        "priority": "medium",
        "rationale": "Fills key cloud infrastructure requirements."
      }
    ],
    "recommendedRoles": ["Fullstack Engineer", "Software Engineer"]
  },
  "scores": {
    "overall": { "score": 0-100, "maxScore": 100, "reason": "Detailed summary citing strengths and flaws", "evidence": ["Quote from resume"], "positives": ["positives"], "problems": ["problems"], "recruiterPerspective": "perspective", "atsPerspective": "perspective", "improvements": ["fix 1"], "expectedScoreAfterFix": 0-100, "priority": "high|medium|low" },
    "skills": { "score": 0-100, "maxScore": 100, "reason": "Critique of tech stack and soft skills", "evidence": ["Quote from resume"], "positives": ["positives"], "problems": ["problems"], "recruiterPerspective": "perspective", "atsPerspective": "perspective", "improvements": ["improvements"], "expectedScoreAfterFix": 0-100, "priority": "high|medium|low", "missingSkills": ["AWS", "Redis"] },
    "ats": { "score": 0-100, "maxScore": 100, "reason": "Parsing structure and layout order", "evidence": ["Quote"], "positives": ["positives"], "problems": ["problems"], "recruiterPerspective": "perspective", "atsPerspective": "perspective", "improvements": ["improvements"], "expectedScoreAfterFix": 0-100, "priority": "high|medium|low" },
    "formatting": { "score": 0-100, "maxScore": 100, "reason": "Length and visual layout", "evidence": ["Quote"], "positives": ["positives"], "problems": ["problems"], "recruiterPerspective": "perspective", "atsPerspective": "perspective", "improvements": ["improvements"], "expectedScoreAfterFix": 0-100, "priority": "high|medium|low" },
    "experience": { "score": 0-100, "maxScore": 100, "reason": "Job progression, enterprise pedigree, impact", "evidence": ["Worked at Deloitte...", "Optimized SQL queries by 40%..."], "positives": ["positives"], "problems": ["problems"], "recruiterPerspective": "perspective", "atsPerspective": "perspective", "improvements": ["improvements"], "expectedScoreAfterFix": 0-100, "priority": "high|medium|low" },
    "projects": { "score": 0-100, "maxScore": 100, "reason": "Scope, architecture, SaaS production vs CRUD", "evidence": ["Built Gohyred AI platform..."], "positives": ["positives"], "problems": ["problems"], "recruiterPerspective": "perspective", "atsPerspective": "perspective", "improvements": ["improvements"], "expectedScoreAfterFix": 0-100, "priority": "high|medium|low" },
    "education": { "score": 0-100, "maxScore": 100, "reason": "Degree, GPA, academic credibility", "evidence": ["B.Tech in Computer Science..."], "positives": ["positives"], "problems": ["problems"], "recruiterPerspective": "perspective", "atsPerspective": "perspective", "improvements": ["improvements"], "expectedScoreAfterFix": 0-100, "priority": "high|medium|low" },
    "achievements": { "score": 0-100, "maxScore": 100, "reason": "Hackathons, LeetCode, Open Source, Awards", "evidence": ["Winner of National Hackathon..."], "positives": ["positives"], "problems": ["problems"], "recruiterPerspective": "perspective", "atsPerspective": "perspective", "improvements": ["improvements"], "expectedScoreAfterFix": 0-100, "priority": "high|medium|low" },
    "grammar": { "score": 0-100, "maxScore": 100, "reason": "Action verb strength and voice clarity", "evidence": ["Quote"], "positives": ["positives"], "problems": ["problems"], "recruiterPerspective": "perspective", "atsPerspective": "perspective", "improvements": ["improvements"], "expectedScoreAfterFix": 0-100, "priority": "high|medium|low" }
  },
  "projectAnalysis": [
    {
      "projectName": "Name of project",
      "currentDescription": "Original description text",
      "strengths": ["strengths"],
      "weaknesses": ["weaknesses"],
      "missingBusinessImpact": "why it looks passive",
      "missingMetrics": ["metric 1", "metric 2"],
      "missingActionVerbs": ["Verb 1", "Verb 2"],
      "recruiterImpression": "manager impression",
      "suggestedRewrite": "STAR rewrite",
      "expectedImprovement": "expected improvement",
      "suggestions": [
        { "original": "Original bullet", "improved": "Optimized bullet", "rationale": "Rationale" }
      ]
    }
  ],
  "experienceAnalysis": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "period": "Period Dates",
      "evaluations": {
        "impact": "critique",
        "leadership": "critique",
        "ownership": "critique",
        "achievements": "critique",
        "businessValue": "critique"
      },
      "recruiterImpression": "impression",
      "atsCompatibility": "keywords comment",
      "bulletSuggestions": [
        { "original": "Original line", "improved": "Optimized bullet point", "rationale": "rationale" }
      ]
    }
  ],
  "keywords": {
    "matched": ["React", "CSS"],
    "missing": ["Docker"],
    "weak": ["helped with"],
    "technical": ["React"],
    "industry": ["Fullstack"],
    "trending": ["GraphQL"],
    "density": 0.05,
    "detailedList": [
      {
        "term": "Docker",
        "category": "technical",
        "location": "Not found",
        "importance": "high",
        "estimatedAtsImpact": 8,
        "recruiterReason": "Highly sought for deployment configurations."
      }
    ]
  },
  "skills": {
    "programmingLanguages": ["JavaScript"],
    "frameworks": ["React"],
    "databases": ["SQL"],
    "cloud": ["AWS"],
    "devops": [],
    "aiMl": [],
    "tools": [],
    "softSkills": ["Communication"],
    "missing": ["CI/CD"],
    "recommended": ["Docker"],
    "trendingSkills": ["Kubernetes"],
    "nextToLearn": ["Learn Docker basics"]
  },
  "grammar": {
    "passiveVoiceLines": [],
    "weakWordings": [],
    "repetitivePhrases": [],
    "grammarMistakes": [],
    "sentenceImprovements": [
      { "original": "...", "improved": "...", "rationale": "..." }
    ]
  },
  "summaryReview": {
    "score": 0-100,
    "professionalism": "critique",
    "confidence": "critique",
    "technicalDepth": "critique",
    "readability": "critique",
    "recruiterAppeal": "critique",
    "suggestedRewrite": "Optimized summary text"
  },
  "coach": {
    "recruiterImpression": "impression",
    "interviewReadiness": "Medium (60%)",
    "strengths": ["Frontend Frameworks"],
    "weaknesses": ["Metrics missing"],
    "growthSuggestions": ["Quantify experience statements"],
    "recommendations": {
      "learning": ["AWS Lambda"],
      "portfolio": ["Link active projects"],
      "github": ["Write complete readme docs"],
      "linkedin": ["Update profile banner"]
    },
    "mostSuitableRoles": ["Software Developer"],
    "rolesToAvoid": ["DevOps Architect"],
    "expectedSalaryRange": "Estimated salary range",
    "maturityLevel": "Intermediate Practitioner"
  },
  "roadmap": [
    { "priority": "high|medium|low", "title": "Quantify Achievements", "reason": "Reason details" }
  ],
  "resumeCategory": "Software Development"
}

All comments, evidence quotes, and suggestions must be strictly grounded in the resume text.

Resume to analyze:
---
${truncated}
---${targetText}`;
}

// ── Part 3: Merge, Score, Validation, Fallback & Calibration ─────────────────

function generateDynamicFallback(det: DeterministicResult, errorMsg: string): AIAnalysisRaw {
  const missingSectionsList = det.sections.filter(s => !s.found).map(s => s.name);
  const missingContacts = [
    !det.hasEmail && 'Email',
    !det.hasPhone && 'Phone',
    !det.hasLinkedIn && 'LinkedIn',
    !det.hasGitHub && 'GitHub',
    !det.hasPortfolio && 'Portfolio'
  ].filter(Boolean) as string[];

  const detailedList: DetailedKeyword[] = [];
  if (missingContacts.length > 0) {
    missingContacts.forEach(c => {
      detailedList.push({
        term: c,
        status: 'missing',
        category: 'soft-skill',
        location: 'Not found',
        importance: 'high',
        estimatedAtsImpact: 5,
        recruiterReason: `Hiring managers require quick ways to contact you. Missing ${c}.`
      });
    });
  }

  const defaultROI: ROIImprovement = {
    title: 'Add Quantified Work Experience Metrics',
    action: 'Include numbers, percentages, and scale metrics in your experience statements.',
    category: 'Work Experience',
    currentScore: Math.round(det.sectionScore),
    expectedScore: Math.min(98, Math.round(det.sectionScore + 7)),
    scoreGain: 7,
    shortlistGain: '+12%',
    priority: 'high',
    rationale: 'Recruiters prioritize candidates with proven business impact metrics.'
  };

  return {
    verdict: {
      verdict: `Candidate parsed via deterministic fallback due to temporary AI timeout (${errorMsg}). Standard section structure verified.`,
      wouldShortlist: det.sectionScore > 75 ? 'MAYBE' : 'NO',
      shortlistingProbability: `${Math.round(det.sectionScore * 0.9)}% Moderate`,
      atsPassProbability: `${Math.round(det.sectionScore)}% High`,
      marketCompetitiveness: det.sectionScore > 75 ? 'Top 30% in Candidate Pool' : 'Average in Candidate Pool',
      resumeTier: det.sectionScore > 75 ? 'Tier 2 - Competitive Candidate' : 'Tier 3 - Needs Polish',
      careerCategory: det.wordCount > 600 ? 'Mid-Level Engineer' : 'Junior Engineer',
      peerBenchmarkComparison: 'Compared strictly against baseline software engineering candidates.',
      topStrengths: det.sections.filter(s => s.found).map(s => `${s.name} section found.`),
      biggestWeakness: missingSectionsList.length > 0 ? `Missing ${missingSectionsList.join(', ')} sections.` : 'Experience statements lack quantified metric outputs.',
      highestROIImprovement: defaultROI,
      roiImprovements: [defaultROI],
      recommendedRoles: ['Software Engineer']
    },
    scores: {
      overall: { score: Math.max(30, det.sectionScore - 10), maxScore: 100, reason: `Evaluation fallback due to parsing error: ${errorMsg}`, positives: det.sections.filter(s => s.found).map(s => `${s.name} detected.`), problems: missingSectionsList.map(s => `Missing ${s} section.`), recruiterPerspective: 'Please recheck resume upload formatting.', atsPerspective: 'Formatting parser check complete.', improvements: ['Add missing sections.', 'Ensure clear PDF headings.'], expectedScoreAfterFix: 80, priority: 'high', evidence: [] },
      skills: { score: det.sections.find(s => s.name === 'Skills')?.found ? 70 : 30, maxScore: 100, reason: 'Skills section extraction bypass.', positives: [], problems: [], recruiterPerspective: '', atsPerspective: '', improvements: [], expectedScoreAfterFix: 80, priority: 'medium', evidence: [] },
      ats: { score: det.sectionScore, maxScore: 100, reason: 'ATS parsing metrics check.', positives: [], problems: [], recruiterPerspective: '', atsPerspective: '', improvements: [], expectedScoreAfterFix: 90, priority: 'high', evidence: [] },
      formatting: { score: det.formattingScore, maxScore: 100, reason: 'Formatting alignment check.', positives: [], problems: [], recruiterPerspective: '', atsPerspective: '', improvements: [], expectedScoreAfterFix: 90, priority: 'medium', evidence: [] },
      experience: { score: det.sections.find(s => s.name === 'Work Experience')?.found ? 70 : 30, maxScore: 100, reason: 'Experience section check.', positives: [], problems: [], recruiterPerspective: '', atsPerspective: '', improvements: [], expectedScoreAfterFix: 80, priority: 'high', evidence: [] },
      projects: { score: det.sections.find(s => s.name === 'Projects')?.found ? 70 : 30, maxScore: 100, reason: 'Project extraction check.', positives: [], problems: [], recruiterPerspective: '', atsPerspective: '', improvements: [], expectedScoreAfterFix: 80, priority: 'medium', evidence: [] },
      education: { score: det.educationScore, maxScore: 100, reason: 'Education layout check.', positives: [], problems: [], recruiterPerspective: '', atsPerspective: '', improvements: [], expectedScoreAfterFix: 90, priority: 'low', evidence: [] },
      achievements: { score: det.sections.find(s => s.name === 'Achievements')?.found ? 70 : 30, maxScore: 100, reason: 'Achievements section check.', positives: [], problems: [], recruiterPerspective: '', atsPerspective: '', improvements: [], expectedScoreAfterFix: 70, priority: 'medium', evidence: [] },
      grammar: { score: 70, maxScore: 100, reason: 'Word count and layout check.', positives: [], problems: [], recruiterPerspective: '', atsPerspective: '', improvements: [], expectedScoreAfterFix: 90, priority: 'medium', evidence: [] }
    },
    projectAnalysis: [],
    experienceAnalysis: [],
    keywords: {
      matched: [],
      missing: missingContacts,
      weak: [],
      technical: [],
      industry: [],
      trending: [],
      density: 0.01,
      detailedList
    },
    skills: {
      programmingLanguages: [],
      frameworks: [],
      databases: [],
      cloud: [],
      devops: [],
      aiMl: [],
      tools: [],
      softSkills: [],
      missing: [],
      recommended: [],
      trendingSkills: [],
      nextToLearn: []
    },
    grammar: {
      passiveVoiceLines: [],
      weakWordings: [],
      repetitivePhrases: [],
      grammarMistakes: [],
      sentenceImprovements: []
    },
    summaryReview: {
      score: 60,
      professionalism: 'Professional summary layout audit bypassed.',
      confidence: 'Medium',
      technicalDepth: 'Standard',
      readability: 'Good',
      recruiterAppeal: 'Standard',
      suggestedRewrite: 'Consider adding a professional summary matching your key skills.'
    },
    coach: {
      recruiterImpression: `Analysis parsed with minor warning: ${errorMsg}. Please ensure your document is text-readable and not a scanned image.`,
      interviewReadiness: 'Medium (50%)',
      strengths: det.sections.filter(s => s.found).map(s => `${s.name} section found.`),
      weaknesses: missingSectionsList.map(s => `Missing ${s} section.`),
      growthSuggestions: ['Include standard sections to improve parsing accuracy.'],
      recommendations: {
        learning: [],
        portfolio: [],
        github: [],
        linkedin: []
      },
      mostSuitableRoles: [],
      rolesToAvoid: [],
      expectedSalaryRange: 'Standard local rate',
      maturityLevel: det.wordCount > 600 ? 'Mid Practitioner' : 'Junior Practitioner'
    },
    seniority: {
      level: 'Mid-Level',
      title: 'Professional Candidate',
      reasoning: 'AI parse extraction was bypassed.',
      readinessScore: 65,
      marketSalaryEstimate: 'Standard local rate',
      growthPath: []
    },
    roadmap: [
      { priority: 'high', title: 'Re-analyze Resume', reason: 'Parser fallback was activated due to AI error.' }
    ],
    resumeCategory: 'General Professional'
  };
}

function validateAndCleanAIResponse(ai: any): AIAnalysisRaw {
  if (!ai || typeof ai !== 'object') {
    throw new Error('AI response is not a valid object.');
  }

  const rawVerdict = ai.verdict || {};

  const cleanROIItem = (r: any): ROIImprovement => ({
    title: typeof r?.title === 'string' && r.title.trim() ? r.title : 'Optimize Experience Bullets',
    action: typeof r?.action === 'string' && r.action.trim() ? r.action : 'Add metrics and action verbs.',
    category: typeof r?.category === 'string' && r.category.trim() ? r.category : 'General',
    currentScore: typeof r?.currentScore === 'number' ? clamp(r.currentScore) : 65,
    expectedScore: typeof r?.expectedScore === 'number' ? clamp(r.expectedScore) : 72,
    scoreGain: typeof r?.scoreGain === 'number' ? r.scoreGain : 7,
    shortlistGain: typeof r?.shortlistGain === 'string' && r.shortlistGain.trim() ? r.shortlistGain : '+10%',
    priority: (r?.priority === 'high' || r?.priority === 'medium' || r?.priority === 'low') ? r.priority : 'high',
    rationale: typeof r?.rationale === 'string' && r.rationale.trim() ? r.rationale : 'Improves recruiter shortlist rating.'
  });

  const rawROIArray = Array.isArray(rawVerdict.roiImprovements) ? rawVerdict.roiImprovements.map(cleanROIItem) : [];
  const highestROI = rawVerdict.highestROIImprovement ? cleanROIItem(rawVerdict.highestROIImprovement) : (rawROIArray[0] || cleanROIItem(null));

  const validCategories: CandidateCategory[] = ['Student', 'Fresher', 'Intern', 'Junior Engineer', 'Mid-Level Engineer', 'Senior Engineer'];
  const cleanCategory: CandidateCategory = validCategories.includes(rawVerdict.careerCategory) ? rawVerdict.careerCategory : (validCategories.includes(rawVerdict.careerLevel) ? rawVerdict.careerLevel : 'Mid-Level Engineer');

  const cleanVerdict: RecruiterVerdict = {
    verdict: typeof rawVerdict.verdict === 'string' && rawVerdict.verdict.trim() ? rawVerdict.verdict : 'Evaluated candidate profile against software engineering hiring standards.',
    wouldShortlist: (rawVerdict.wouldShortlist === 'YES' || rawVerdict.wouldShortlist === 'MAYBE' || rawVerdict.wouldShortlist === 'NO') ? rawVerdict.wouldShortlist : 'MAYBE',
    shortlistingProbability: typeof rawVerdict.shortlistingProbability === 'string' && rawVerdict.shortlistingProbability.trim() ? rawVerdict.shortlistingProbability : '75% Moderate',
    atsPassProbability: typeof rawVerdict.atsPassProbability === 'string' && rawVerdict.atsPassProbability.trim() ? rawVerdict.atsPassProbability : (typeof rawVerdict.atsPassRate === 'string' ? rawVerdict.atsPassRate : '80% High'),
    marketCompetitiveness: typeof rawVerdict.marketCompetitiveness === 'string' && rawVerdict.marketCompetitiveness.trim() ? rawVerdict.marketCompetitiveness : 'Top 25% in Candidate Pool',
    resumeTier: typeof rawVerdict.resumeTier === 'string' && rawVerdict.resumeTier.trim() ? rawVerdict.resumeTier : 'Tier 2 - Competitive Candidate',
    careerCategory: cleanCategory,
    peerBenchmarkComparison: typeof rawVerdict.peerBenchmarkComparison === 'string' && rawVerdict.peerBenchmarkComparison.trim() ? rawVerdict.peerBenchmarkComparison : (typeof rawVerdict.careerComparisonBenchmark === 'string' ? rawVerdict.careerComparisonBenchmark : 'Compared against peers in candidate category pool.'),
    topStrengths: Array.isArray(rawVerdict.topStrengths) ? rawVerdict.topStrengths.filter(Boolean) : ['Clear section structure.'],
    biggestWeakness: typeof rawVerdict.biggestWeakness === 'string' && rawVerdict.biggestWeakness.trim() ? rawVerdict.biggestWeakness : 'Experience lines require quantified metric outputs.',
    highestROIImprovement: highestROI,
    roiImprovements: rawROIArray.length > 0 ? rawROIArray : [highestROI],
    recommendedRoles: Array.isArray(rawVerdict.recommendedRoles) ? rawVerdict.recommendedRoles.filter(Boolean) : ['Software Engineer']
  };

  const scores = ai.scores || {};
  const cleanScores: any = {};
  const scoreKeys = ['overall', 'skills', 'ats', 'formatting', 'experience', 'projects', 'education', 'achievements', 'grammar'];

  scoreKeys.forEach(k => {
    const raw = scores[k] || {};
    cleanScores[k] = {
      score: typeof raw.score === 'number' ? clamp(raw.score) : 60,
      maxScore: typeof raw.maxScore === 'number' ? clamp(raw.maxScore) : 100,
      reason: typeof raw.reason === 'string' && raw.reason.trim() ? raw.reason : 'Section layout evaluated.',
      evidence: Array.isArray(raw.evidence) ? raw.evidence.filter(Boolean) : [],
      positives: Array.isArray(raw.positives) ? raw.positives.filter(Boolean) : ['Formatting check passes.'],
      problems: Array.isArray(raw.problems) ? raw.problems.filter(Boolean) : [],
      recruiterPerspective: typeof raw.recruiterPerspective === 'string' && raw.recruiterPerspective.trim() ? raw.recruiterPerspective : 'Should expand details for recruiter readability.',
      atsPerspective: typeof raw.atsPerspective === 'string' && raw.atsPerspective.trim() ? raw.atsPerspective : 'Standard ATS layout alignment verified.',
      improvements: Array.isArray(raw.improvements) ? raw.improvements.filter(Boolean) : [],
      expectedScoreAfterFix: typeof raw.expectedScoreAfterFix === 'number' ? clamp(raw.expectedScoreAfterFix) : 80,
      priority: (raw.priority === 'high' || raw.priority === 'medium' || raw.priority === 'low') ? raw.priority : 'medium',
      missingSkills: Array.isArray(raw.missingSkills) ? raw.missingSkills.filter(Boolean) : []
    };
  });

  const projectAnalysis = Array.isArray(ai.projectAnalysis) ? ai.projectAnalysis.map((p: any) => ({
    projectName: typeof p.projectName === 'string' && p.projectName.trim() ? p.projectName : 'Project Audit',
    currentDescription: typeof p.currentDescription === 'string' ? p.currentDescription : '',
    strengths: Array.isArray(p.strengths) ? p.strengths.filter(Boolean) : [],
    weaknesses: Array.isArray(p.weaknesses) ? p.weaknesses.filter(Boolean) : [],
    missingBusinessImpact: typeof p.missingBusinessImpact === 'string' && p.missingBusinessImpact.trim() ? p.missingBusinessImpact : 'Add business context/impact metrics.',
    missingMetrics: Array.isArray(p.missingMetrics) ? p.missingMetrics.filter(Boolean) : [],
    missingActionVerbs: Array.isArray(p.missingActionVerbs) ? p.missingActionVerbs.filter(Boolean) : [],
    recruiterImpression: typeof p.recruiterImpression === 'string' && p.recruiterImpression.trim() ? p.recruiterImpression : 'Manager looking for clear STAR alignment.',
    suggestedRewrite: typeof p.suggestedRewrite === 'string' ? p.suggestedRewrite : '',
    expectedImprovement: typeof p.expectedImprovement === 'string' ? p.expectedImprovement : '',
    suggestions: Array.isArray(p.suggestions) ? p.suggestions.map((s: any) => ({
      original: typeof s.original === 'string' ? s.original : '',
      improved: typeof s.improved === 'string' ? s.improved : '',
      rationale: typeof s.rationale === 'string' ? s.rationale : ''
    })) : []
  })) : [];

  const experienceAnalysis = Array.isArray(ai.experienceAnalysis) ? ai.experienceAnalysis.map((e: any) => ({
    company: typeof e.company === 'string' && e.company.trim() ? e.company : 'Company Name',
    role: typeof e.role === 'string' && e.role.trim() ? e.role : 'Professional Role',
    period: typeof e.period === 'string' ? e.period : '',
    evaluations: {
      impact: typeof e.evaluations?.impact === 'string' && e.evaluations.impact.trim() ? e.evaluations.impact : 'Review impact statements.',
      leadership: typeof e.evaluations?.leadership === 'string' && e.evaluations.leadership.trim() ? e.evaluations.leadership : 'Highlight ownership elements.',
      ownership: typeof e.evaluations?.ownership === 'string' && e.evaluations.ownership.trim() ? e.evaluations.ownership : 'Refine responsibility lines.',
      achievements: typeof e.evaluations?.achievements === 'string' && e.evaluations.achievements.trim() ? e.evaluations.achievements : 'Quantify achievements.',
      businessValue: typeof e.evaluations?.businessValue === 'string' && e.evaluations.businessValue.trim() ? e.evaluations.businessValue : 'Link role output to company metrics.'
    },
    recruiterImpression: typeof e.recruiterImpression === 'string' && e.recruiterImpression.trim() ? e.recruiterImpression : 'Recruiter checks for consistency and tenure.',
    atsCompatibility: typeof e.atsCompatibility === 'string' && e.atsCompatibility.trim() ? e.atsCompatibility : 'Standard parser keyword index verified.',
    bulletSuggestions: Array.isArray(e.bulletSuggestions) ? e.bulletSuggestions.map((b: any) => ({
      original: typeof b.original === 'string' ? b.original : '',
      improved: typeof b.improved === 'string' ? b.improved : '',
      rationale: typeof b.rationale === 'string' ? b.rationale : ''
    })) : []
  })) : [];

  const keywords = ai.keywords || {};
  const cleanKeywords = {
    matched: Array.isArray(keywords.matched) ? keywords.matched.filter(Boolean) : [],
    missing: Array.isArray(keywords.missing) ? keywords.missing.filter(Boolean) : [],
    weak: Array.isArray(keywords.weak) ? keywords.weak.filter(Boolean) : [],
    technical: Array.isArray(keywords.technical) ? keywords.technical.filter(Boolean) : [],
    industry: Array.isArray(keywords.industry) ? keywords.industry.filter(Boolean) : [],
    trending: Array.isArray(keywords.trending) ? keywords.trending.filter(Boolean) : [],
    density: typeof keywords.density === 'number' ? keywords.density : 0.05,
    detailedList: Array.isArray(keywords.detailedList) ? keywords.detailedList.map((k: any) => ({
      term: typeof k.term === 'string' ? k.term : 'Keyword',
      status: (k.status === 'matched' || k.status === 'missing' || k.status === 'weak') ? k.status : 'missing',
      category: (k.category === 'technical' || k.category === 'industry' || k.category === 'soft-skill') ? k.category : 'technical',
      location: typeof k.location === 'string' ? k.location : 'Not found',
      importance: (k.importance === 'high' || k.importance === 'medium' || k.importance === 'low') ? k.importance : 'medium',
      estimatedAtsImpact: typeof k.estimatedAtsImpact === 'number' ? clamp(k.estimatedAtsImpact) : 5,
      recruiterReason: typeof k.recruiterReason === 'string' && k.recruiterReason.trim() ? k.recruiterReason : 'Keyword increases ATS profile relevance.'
    })) : []
  };

  const skills = ai.skills || {};
  const cleanSkills = {
    programmingLanguages: Array.isArray(skills.programmingLanguages) ? skills.programmingLanguages.filter(Boolean) : [],
    frameworks: Array.isArray(skills.frameworks) ? skills.frameworks.filter(Boolean) : [],
    databases: Array.isArray(skills.databases) ? skills.databases.filter(Boolean) : [],
    cloud: Array.isArray(skills.cloud) ? skills.cloud.filter(Boolean) : [],
    devops: Array.isArray(skills.devops) ? skills.devops.filter(Boolean) : [],
    aiMl: Array.isArray(skills.aiMl) ? skills.aiMl.filter(Boolean) : [],
    tools: Array.isArray(skills.tools) ? skills.tools.filter(Boolean) : [],
    softSkills: Array.isArray(skills.softSkills) ? skills.softSkills.filter(Boolean) : [],
    missing: Array.isArray(skills.missing) ? skills.missing.filter(Boolean) : [],
    recommended: Array.isArray(skills.recommended) ? skills.recommended.filter(Boolean) : [],
    trendingSkills: Array.isArray(skills.trendingSkills) ? skills.trendingSkills.filter(Boolean) : [],
    nextToLearn: Array.isArray(skills.nextToLearn) ? skills.nextToLearn.filter(Boolean) : []
  };

  const grammar = ai.grammar || {};
  const cleanGrammar = {
    passiveVoiceLines: Array.isArray(grammar.passiveVoiceLines) ? grammar.passiveVoiceLines.filter(Boolean) : [],
    weakWordings: Array.isArray(grammar.weakWordings) ? grammar.weakWordings.filter(Boolean) : [],
    repetitivePhrases: Array.isArray(grammar.repetitivePhrases) ? grammar.repetitivePhrases.filter(Boolean) : [],
    grammarMistakes: Array.isArray(grammar.grammarMistakes) ? grammar.grammarMistakes.filter(Boolean) : [],
    sentenceImprovements: Array.isArray(grammar.sentenceImprovements) ? grammar.sentenceImprovements.map((s: any) => ({
      original: typeof s.original === 'string' ? s.original : '',
      improved: typeof s.improved === 'string' ? s.improved : '',
      rationale: typeof s.rationale === 'string' ? s.rationale : ''
    })) : []
  };

  const summaryReview = ai.summaryReview || {};
  const cleanSummaryReview = {
    score: typeof summaryReview.score === 'number' ? clamp(summaryReview.score) : 70,
    professionalism: typeof summaryReview.professionalism === 'string' && summaryReview.professionalism.trim() ? summaryReview.professionalism : 'Professional summary layout audit complete.',
    confidence: typeof summaryReview.confidence === 'string' && summaryReview.confidence.trim() ? summaryReview.confidence : 'Medium',
    technicalDepth: typeof summaryReview.technicalDepth === 'string' && summaryReview.technicalDepth.trim() ? summaryReview.technicalDepth : 'Standard depth.',
    readability: typeof summaryReview.readability === 'string' && summaryReview.readability.trim() ? summaryReview.readability : 'Readable formatting.',
    recruiterAppeal: typeof summaryReview.recruiterAppeal === 'string' && summaryReview.recruiterAppeal.trim() ? summaryReview.recruiterAppeal : 'Average recruiter appeal.',
    suggestedRewrite: typeof summaryReview.suggestedRewrite === 'string' && summaryReview.suggestedRewrite.trim() ? summaryReview.suggestedRewrite : 'Include high impact achievements.'
  };

  const coach = ai.coach || {};
  const cleanCoach = {
    recruiterImpression: typeof coach.recruiterImpression === 'string' && coach.recruiterImpression.trim() ? coach.recruiterImpression : 'Resume shows structured path with areas for optimization.',
    interviewReadiness: typeof coach.interviewReadiness === 'string' && coach.interviewReadiness.trim() ? coach.interviewReadiness : 'Medium (60%)',
    strengths: Array.isArray(coach.strengths) ? coach.strengths.filter(Boolean) : ['Resume contains clear format headers.'],
    weaknesses: Array.isArray(coach.weaknesses) ? coach.weaknesses.filter(Boolean) : [],
    growthSuggestions: Array.isArray(coach.growthSuggestions) ? coach.growthSuggestions.filter(Boolean) : [],
    recommendations: {
      learning: Array.isArray(coach.recommendations?.learning) ? coach.recommendations.learning.filter(Boolean) : [],
      portfolio: Array.isArray(coach.recommendations?.portfolio) ? coach.recommendations.portfolio.filter(Boolean) : [],
      github: Array.isArray(coach.recommendations?.github) ? coach.recommendations.github.filter(Boolean) : [],
      linkedin: Array.isArray(coach.recommendations?.linkedin) ? coach.recommendations.linkedin.filter(Boolean) : []
    },
    mostSuitableRoles: Array.isArray(coach.mostSuitableRoles) ? coach.mostSuitableRoles.filter(Boolean) : ['Professional Practitioner'],
    rolesToAvoid: Array.isArray(coach.rolesToAvoid) ? coach.rolesToAvoid.filter(Boolean) : [],
    expectedSalaryRange: typeof coach.expectedSalaryRange === 'string' && coach.expectedSalaryRange.trim() ? coach.expectedSalaryRange : 'Standard market rate',
    maturityLevel: typeof coach.maturityLevel === 'string' && coach.maturityLevel.trim() ? coach.maturityLevel : 'Professional Practitioner'
  };

  const seniority = ai.seniority || {};
  const cleanSeniority = {
    level: (seniority.level === 'Junior' || seniority.level === 'Mid-Level' || seniority.level === 'Senior' || seniority.level === 'Lead' || seniority.level === 'Executive') ? seniority.level : 'Mid-Level',
    title: typeof seniority.title === 'string' && seniority.title.trim() ? seniority.title : 'Professional Candidate',
    reasoning: typeof seniority.reasoning === 'string' && seniority.reasoning.trim() ? seniority.reasoning : 'Benchmark based on layout and experience.',
    readinessScore: typeof seniority.readinessScore === 'number' ? clamp(seniority.readinessScore) : 70,
    marketSalaryEstimate: typeof seniority.marketSalaryEstimate === 'string' && seniority.marketSalaryEstimate.trim() ? seniority.marketSalaryEstimate : 'Estimated market rate',
    growthPath: Array.isArray(seniority.growthPath) ? seniority.growthPath.filter(Boolean) : []
  };

  const roadmap = Array.isArray(ai.roadmap) ? ai.roadmap.map((r: any) => ({
    priority: (r.priority === 'high' || r.priority === 'medium' || r.priority === 'low') ? r.priority : 'medium',
    title: typeof r.title === 'string' && r.title.trim() ? r.title : 'Improvement Step',
    reason: typeof r.reason === 'string' ? r.reason : ''
  })) : [];

  return {
    verdict: cleanVerdict,
    scores: cleanScores,
    projectAnalysis,
    experienceAnalysis,
    keywords: cleanKeywords,
    skills: cleanSkills,
    grammar: cleanGrammar,
    summaryReview: cleanSummaryReview,
    coach: cleanCoach,
    seniority: cleanSeniority,
    roadmap,
    resumeCategory: typeof ai.resumeCategory === 'string' && ai.resumeCategory.trim() ? ai.resumeCategory : 'General Professional'
  };
}

function calibrateCategoryScore(rawScore: number, category: string, det: DeterministicResult): number {
  let score = rawScore;
  
  // Non-linear calibration: compress raw AI scores to realistic bands
  if (score > 90) {
    score = 82 + (score - 90) * 0.4;
  } else if (score > 70) {
    score = 68 + (score - 70) * 0.7;
  } else if (score > 50) {
    score = 52 + (score - 50) * 0.8;
  }

  let penalty = 0;

  const hasExperience = det.sections.find(s => s.name === 'Work Experience')?.found;
  const hasSkills = det.sections.find(s => s.name === 'Skills')?.found;
  const hasEducation = det.sections.find(s => s.name === 'Education')?.found;
  const hasContact = det.hasEmail || det.hasPhone;

  // Severe parser alignment violations deduct category scores
  if (category === 'experience' && !hasExperience) penalty += 35;
  if (category === 'skills' && !hasSkills) penalty += 35;
  if (category === 'education' && !hasEducation) penalty += 35;
  if (category === 'ats' && !hasContact) penalty += 20;

  // Thin content constraints
  if (det.wordCount < 150) {
    penalty += 20;
  } else if (det.wordCount < 300) {
    penalty += 10;
  } else if (det.wordCount > 1500) {
    penalty += 8;
  }

  if (category === 'formatting' && det.bulletScore < 50) {
    penalty += 15;
  }

  score = Math.max(25, score - penalty);
  return clamp(score, 10, 96);
}

function mergeAnalysis(det: DeterministicResult, ai: AIAnalysisRaw): AnalysisReport {
  // 1. Calibrate category scores
  const experienceScore = calibrateCategoryScore(ai.scores?.experience?.score ?? 60, 'experience', det);
  const projectsScore = calibrateCategoryScore(ai.scores?.projects?.score ?? 60, 'projects', det);
  const skillsScore = calibrateCategoryScore(ai.scores?.skills?.score ?? 60, 'skills', det);
  const atsScore = calibrateCategoryScore(ai.scores?.ats?.score ?? 60, 'ats', det);
  const achievementsScore = calibrateCategoryScore(ai.scores?.achievements?.score ?? 50, 'achievements', det);
  const educationScore = calibrateCategoryScore(det.educationScore, 'education', det);
  const formattingScore = calibrateCategoryScore(det.formattingScore, 'formatting', det);
  const grammarScore = calibrateCategoryScore(ai.scores?.grammar?.score ?? 70, 'grammar', det);

  const totalKeywords = (ai.keywords?.matched?.length || 0) + (ai.keywords?.missing?.length || 0);
  const rawKeywordScore = totalKeywords > 0 ? ((ai.keywords?.matched?.length || 0) / totalKeywords) * 100 : 50;
  const keywordScore = calibrateCategoryScore(rawKeywordScore, 'keywords', det);

  // 2. Compute Overall Score strictly using Senior Recruiter Weights:
  // Experience 30%, Projects 25%, Technical Skills 15%, ATS Keywords 10%, Achievements 10%, Education 5%, Formatting 5%
  let overallScore = Math.round(
    experienceScore * 0.30 +
    projectsScore * 0.25 +
    skillsScore * 0.15 +
    keywordScore * 0.10 +
    achievementsScore * 0.10 +
    educationScore * 0.05 +
    formattingScore * 0.05
  );

  // 3. Normalization constraints
  const hasExperience = det.sections.find(s => s.name === 'Work Experience')?.found;
  const hasSkills = det.sections.find(s => s.name === 'Skills')?.found;
  const hasContact = det.hasEmail || det.hasPhone;
  const coreMissingCount = [!hasExperience, !hasSkills, !hasContact].filter(Boolean).length;
  const isExcellentLayout = coreMissingCount === 0 && det.formattingScore >= 80 && det.contactScore >= 80;

  if (overallScore > 96 && !isExcellentLayout) {
    overallScore = 96;
  } else if (overallScore > 98) {
    overallScore = 98;
  }
  overallScore = clamp(overallScore, 10, 100);

  const profileStrength = overallScore;

  // 4. Calculate parser Confidence Score & Explanation
  let confidenceScore = 100;
  const confidenceReasons: string[] = [];

  const coreMissingList = [
    { name: 'Work Experience', found: hasExperience },
    { name: 'Skills', found: hasSkills },
    { name: 'Education', found: det.sections.find(s => s.name === 'Education')?.found }
  ];
  coreMissingList.forEach(s => {
    if (!s.found) {
      confidenceScore -= 15;
      confidenceReasons.push(`Missing core section: ${s.name}`);
    }
  });

  const missingContactCount = [det.hasEmail, det.hasPhone, det.hasLinkedIn, det.hasGitHub].filter(x => !x).length;
  if (missingContactCount > 0) {
    confidenceScore -= missingContactCount * 4;
    confidenceReasons.push(`Missing ${missingContactCount} contact details`);
  }

  if (det.wordCount < 150) {
    confidenceScore -= 30;
    confidenceReasons.push("Text content is too short for extraction");
  } else if (det.wordCount < 300) {
    confidenceScore -= 12;
    confidenceReasons.push("Brief content limits depth analysis");
  } else if (det.wordCount > 1500) {
    confidenceScore -= 10;
    confidenceReasons.push("Large resume length may dilute highlights");
  }

  if (det.bulletScore < 50) {
    confidenceScore -= 10;
    confidenceReasons.push("Low use of formatted bullet points");
  }

  confidenceScore = clamp(confidenceScore, 30, 99);

  let confidenceReason = "";
  if (confidenceScore >= 90) {
    confidenceReason = "The parser successfully extracted nearly all resume sections.";
  } else if (confidenceScore >= 70) {
    confidenceReason = "The uploaded resume contains standard sections, but some contact info or formatting details are missing.";
  } else {
    confidenceReason = "The uploaded resume contained formatting, length, or structural issues that limited analysis quality.";
  }
  if (confidenceReasons.length > 0) {
    confidenceReason += " Key issues: " + confidenceReasons.join(", ") + ".";
  }

  // 5. Construct normalized ScoreDetail blocks
  const normalizedScores: Record<string, ScoreDetail> = {};
  const scoreKeys = ['overall', 'skills', 'ats', 'formatting', 'experience', 'projects', 'education', 'achievements', 'grammar'];
  const localScoresMap: Record<string, number> = {
    overall: overallScore,
    skills: skillsScore,
    ats: atsScore,
    formatting: formattingScore,
    experience: experienceScore,
    projects: projectsScore,
    education: educationScore,
    achievements: achievementsScore,
    grammar: grammarScore,
    keywords: keywordScore
  };

  scoreKeys.forEach(k => {
    const rawDetail = (ai.scores as any)?.[k] || {};
    const localScore = localScoresMap[k];
    
    normalizedScores[k] = {
      score: localScore,
      maxScore: 100,
      reason: typeof rawDetail.reason === 'string' && rawDetail.reason.trim() ? rawDetail.reason : `Evaluated parameter for ${k} check.`,
      evidence: Array.isArray(rawDetail.evidence) ? rawDetail.evidence.filter(Boolean) : [],
      positives: Array.isArray(rawDetail.positives) ? rawDetail.positives.filter(Boolean) : ['Valid formatting.'],
      problems: Array.isArray(rawDetail.problems) ? rawDetail.problems.filter(Boolean) : [],
      recruiterPerspective: typeof rawDetail.recruiterPerspective === 'string' ? rawDetail.recruiterPerspective : 'Recruiter checks this section for depth.',
      atsPerspective: typeof rawDetail.atsPerspective === 'string' ? rawDetail.atsPerspective : 'Standard ATS indexing parsed.',
      improvements: Array.isArray(rawDetail.improvements) ? rawDetail.improvements.filter(Boolean) : ['Optimize descriptions.'],
      expectedScoreAfterFix: Math.min(98, Math.max(localScore + 10, typeof rawDetail.expectedScoreAfterFix === 'number' ? rawDetail.expectedScoreAfterFix : 85)),
      priority: (rawDetail.priority === 'high' || rawDetail.priority === 'medium' || rawDetail.priority === 'low') ? rawDetail.priority : 'medium',
      missingSkills: Array.isArray(rawDetail.missingSkills) ? rawDetail.missingSkills.filter(Boolean) : []
    };
  });

  return {
    overallScore,
    atsScore,
    formattingScore,
    keywordScore,
    skillsScore,
    experienceScore,
    projectsScore,
    educationScore,
    achievementsScore,
    grammarScore,
    profileStrength,
    confidenceScore,
    confidenceReason,
    verdict: ai.verdict,
    scores: normalizedScores,
    projectAnalysis: ai.projectAnalysis || [],
    experienceAnalysis: ai.experienceAnalysis || [],
    keywords: ai.keywords,
    skills: ai.skills,
    seniority: ai.seniority,
    grammar: ai.grammar,
    summaryReview: ai.summaryReview,
    coach: ai.coach,
    roadmap: ai.roadmap,
    sections: det.sections,
    resumeCategory: ai.resumeCategory,
    analyzedAt: new Date().toISOString(),
  };
}

export async function runFullAnalysis(
  resumeText: string,
  aiConfig: AIProviderConfig,
  jobDescription?: string
): Promise<AnalysisReport> {
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error('Resume text is too short for analysis. Please upload a more detailed resume.');
  }

  const deterministic = runDeterministicAnalysis(resumeText);
  const prompt = buildAIPrompt(resumeText, jobDescription);

  let aiResult: AIAnalysisRaw;

  try {
    const rawResponse = await generateAIJson<any>(prompt, aiConfig);
    aiResult = validateAndCleanAIResponse(rawResponse);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown parsing error';
    console.error('[Resume Analyzer] AI Premium analysis failed:', err);
    aiResult = generateDynamicFallback(deterministic, errMsg);
  }

  return mergeAnalysis(deterministic, aiResult);
}
