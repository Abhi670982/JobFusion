/**
 * Mathematically Normalized Relevance Scoring & Skill Matching Engine
 * Precision-engineered to eliminate false positives, build bidirectional alias resolution,
 * discriminate Core vs Supporting skills, enforce title safety, and assign quality tiers.
 */

export interface RelevanceInput {
  title?: string | null;
  company?: string | null;
  skills?: string[] | null;
  description?: string | null;
  requirements?: string[] | null;
}

export type RelevanceTier = "HIGH" | "MODERATE" | "LOW" | "NONE";

export interface DetailedMatchResult {
  score: number;
  tier: RelevanceTier;
  matchedSkills: Array<{
    skill: string;
    location: "TITLE" | "EXPLICIT_SKILLS" | "DESCRIPTION";
    isCore: boolean;
  }>;
  eligibilityReason: string;
}

/**
 * Core Technical Skills (Primary Languages, Core Frameworks, Runtimes)
 */
export const CORE_SKILLS = new Set([
  "js", "javascript", "ecmascript",
  "ts", "typescript",
  "python", "py",
  "java",
  "c++", "cpp",
  "c#", "csharp",
  "c",
  "go", "golang",
  "rust",
  "ruby", "rails",
  "php",
  "swift",
  "kotlin",
  "scala",
  "react", "reactjs", "react.js", "react native",
  "angular", "angularjs",
  "vue", "vuejs", "vue.js",
  "node", "nodejs", "node.js",
  "next", "nextjs", "next.js",
  "express", "expressjs", "express.js",
  "spring", "spring boot",
  "django",
  "flask",
  "fastapi",
  ".net", "dotnet",
  "flutter"
]);

/**
 * Supporting Skills & Tools (SCM, Styling, Markup, Databases, Cloud, Utility)
 */
export const SUPPORTING_SKILLS = new Set([
  "git", "github", "gitlab", "jira", "confluence", "bitbucket",
  "tailwind", "tailwindcss", "tailwind css", "bootstrap", "html", "html5", "css", "css3", "sass", "less",
  "mysql", "postgresql", "postgres", "mongodb", "mongo", "sqlite", "redis",
  "docker", "kubernetes", "k8s", "aws", "amazon web services", "azure", "gcp",
  "ci/cd", "cicd", "jenkins", "circleci",
  "rest api", "rest apis", "restful", "graphql", "json", "webpack", "vite", "prisma", "redux"
]);

// Canonical Skill Groups (refined to prevent improper alias collisions like git <-> gitlab)
const SKILL_GROUPS: string[][] = [
  ["js", "javascript", "ecmascript"],
  ["ts", "typescript"],
  ["react", "reactjs", "react.js"],
  ["next", "nextjs", "next.js"],
  ["node", "nodejs", "node.js"],
  ["express.js", "expressjs", "express js", "express"],
  ["mongo", "mongodb"],
  ["c++", "cpp"],
  ["c#", "csharp"],
  ["python", "py"],
  ["java"],
  ["ruby", "rails"],
  ["go", "golang"],
  ["rust"],
  ["sql", "postgres", "postgresql", "mysql"],
  ["aws", "amazon web services"],
  ["docker", "container"],
  ["k8s", "kubernetes"],
  ["tailwind", "tailwindcss", "tailwind css"],
  ["redux"],
  ["prisma"],
  ["rest api", "rest apis", "restful"],
  ["system design"],
  ["ci/cd", "cicd", "continuous integration"],
  ["git"],
  ["github"],
  ["gitlab"],
];

// Build bidirectional alias lookup map
const ALIAS_LOOKUP = new Map<string, string[]>();
for (const group of SKILL_GROUPS) {
  for (const alias of group) {
    ALIAS_LOOKUP.set(alias.toLowerCase(), group);
  }
}

// Generic soft skills that should NOT drive software job relevance scores
const GENERIC_SOFT_SKILLS = new Set([
  "attention to detail", "report writing", "data entry", "public relations",
  "training & development", "ux design", "canva", "figma"
]);

/**
 * Escapes string for safe regex creation
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks whether a normalized skill is classified as a CORE technical skill.
 */
export function isCoreSkill(skill: string): boolean {
  const sLower = skill.toLowerCase().trim();
  const aliases = ALIAS_LOOKUP.get(sLower) || [sLower];
  return aliases.some(a => CORE_SKILLS.has(a));
}

/**
 * Precision boundary-aware technical match check
 */
export function isTermInText(term: string, text: string, rawTitleText: string = "", rawDescText: string = ""): boolean {
  if (!term || !text) return false;
  const normTerm = term.toLowerCase().trim();
  const normText = text.toLowerCase();

  // Special handling for REACT to prevent false matches against organizational acronyms (e.g., Incident Response Analyst - REACT)
  if (normTerm === "react" || normTerm === "reactjs" || normTerm === "react.js") {
    // Check if REACT is an all-caps acronym in title/text without frontend context
    const hasAllCapsAcronymInTitle = /\bREACT\b/.test(rawTitleText);
    const hasFrontendContext = /\b(javascript|typescript|frontend|front-end|ui|web|component|jsx|tsx|redux|next\.js|node|npm)\b/i.test(rawDescText || text);
    if (hasAllCapsAcronymInTitle && !hasFrontendContext) {
      return false;
    }
  }

  // Special handling for Express.js to eliminate false positives ("Express Your Interest", "Expression")
  if (normTerm === "express.js" || normTerm === "expressjs" || normTerm === "express js" || normTerm === "express") {
    if (/express(?:\.js|js|\s+js)/i.test(normText)) return true;
    if (/\bexpress\b/i.test(normText)) {
      const isTechContext = /\b(node|nodejs|js|javascript|framework|middleware|npm|api|backend|web|app)\b/i.test(normText);
      const isEnglishPhrase = /express\s+(your\s+interest|interest|delivery|shipping|mail|way|opinion)/i.test(normText);
      const isExpression = /expression/i.test(normText);
      if (isTechContext && !isEnglishPhrase && !isExpression) {
        return true;
      }
    }
    return false;
  }

  // Special handling for C to prevent false matches against CSS, C++, C#, CI/CD
  if (normTerm === "c") {
    const pattern = /(?:^|[^a-zA-Z0-9_#+])c(?:$|[^a-zA-Z0-9_#+])/i;
    if (!pattern.test(normText)) return false;
    if (/c\+\+|c#|css/i.test(normText) && !/\bc\b/i.test(normText)) return false;
    return true;
  }

  // Special handling for Java to prevent false matches against JavaScript
  if (normTerm === "java") {
    return /\bjava\b/i.test(normText) && !/\bjavascript\b/i.test(normText);
  }

  const aliases = ALIAS_LOOKUP.get(normTerm) || [normTerm];
  for (const alias of aliases) {
    const escaped = escapeRegex(alias);
    const pattern = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, 'i');
    if (pattern.test(normText)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates a mathematically normalized relevance score (0 - 100)
 */
export function calculateRelevanceScore(input: RelevanceInput, userSkills: string[]): number {
  return calculateDetailedRelevance(input, userSkills).score;
}

/**
 * Assigns a RelevanceTier based on userMatchScore
 */
export function getRelevanceTier(score: number): RelevanceTier {
  if (score >= 70) return "HIGH";
  if (score >= 35) return "MODERATE";
  if (score > 0) return "LOW";
  return "NONE";
}

import { normalizeSkillsList } from "./skills-normalizer";

/**
 * Detailed relevance calculation returning score, tier, and evidence locations
 */
export function calculateDetailedRelevance(input: RelevanceInput, userSkills: string[]): DetailedMatchResult {
  if (!userSkills || userSkills.length === 0) {
    return { score: 0, tier: "NONE", matchedSkills: [], eligibilityReason: "No user skills provided" };
  }

  const normalizedUserSkills = normalizeSkillsList(userSkills);
  const titleText = (input.title || "").toLowerCase();
  const companyText = (input.company || "").toLowerCase();
  const descRaw = (input.description || "") + " " + (input.requirements || []).join(" ");
  const descText = descRaw.toLowerCase();

  // Strip company name from explicit skills tags to prevent company-name skill leakage (e.g. GitLab -> git)
  const explicitSkills = (input.skills || [])
    .map(s => s.toLowerCase().trim())
    .filter(s => {
      if (companyText && (s === companyText || (companyText.includes(s) && (s === "gitlab" || s === "docker" || s === "postman")))) {
        return false; // Exclude company name leakage tags
      }
      return true;
    });

  const matchedSkills: Array<{ skill: string; location: "TITLE" | "EXPLICIT_SKILLS" | "DESCRIPTION"; isCore: boolean }> = [];
  const matchedTechSet = new Set<string>();

  let titleTechMatches = 0;
  let explicitTechMatches = 0;
  let descTechMatches = 0;
  let matchedCoreTechCount = 0;

  for (const rawSkill of normalizedUserSkills) {
    const normSkill = rawSkill.toLowerCase().trim();
    if (!normSkill || GENERIC_SOFT_SKILLS.has(normSkill)) continue;

    const isCore = isCoreSkill(normSkill);
    let matchedInThisSkill = false;

    // 1. Check Title Match
    if (isTermInText(normSkill, titleText, input.title || "", descRaw)) {
      titleTechMatches++;
      matchedTechSet.add(normSkill);
      if (isCore) matchedCoreTechCount++;
      matchedSkills.push({ skill: rawSkill, location: "TITLE", isCore });
      matchedInThisSkill = true;
    }

    // 2. Check Explicit Skills Array
    const aliases = ALIAS_LOOKUP.get(normSkill) || [normSkill];
    const inExplicit = explicitSkills.some(tag => aliases.some(a => isTermInText(a, tag, input.title || "", descRaw)));
    if (inExplicit) {
      explicitTechMatches++;
      matchedTechSet.add(normSkill);
      if (!matchedInThisSkill && isCore) matchedCoreTechCount++;
      matchedSkills.push({ skill: rawSkill, location: "EXPLICIT_SKILLS", isCore });
      matchedInThisSkill = true;
    }

    // 3. Check Description if not matched in Title/Explicit
    if (!matchedInThisSkill && isTermInText(normSkill, descText, input.title || "", descRaw)) {
      descTechMatches++;
      matchedTechSet.add(normSkill);
      if (isCore) matchedCoreTechCount++;
      matchedSkills.push({ skill: rawSkill, location: "DESCRIPTION", isCore });
    }
  }

  // Strict Role Domain Compatibility Check (Section 13 Requirement)
  // Prevent surfacing completely unrelated non-software job titles
  const isUnrelatedRoleDomain = /\b(accountant|auditor|financial analyst|bookkeeper|human resources|hr manager|recruiter|talent acquisition|sales associate|sales executive|sales manager|nursing|nurse|physician|doctor|pharmacist|civil engineer|mechanical engineer|structural engineer|marketing specialist|marketing manager|customer support|telecaller)\b/i.test(titleText);

  // Technical Role Title check (e.g., Software Engineer, Full Stack, Frontend, Backend, Web Developer)
  const isTechnicalTitle = /\b(software engineer|software developer|fullstack|full-stack|full stack|frontend|front-end|backend|back-end|web developer|systems engineer|devops engineer|data engineer|mobile developer|platform engineer|sre|site reliability engineer)\b/i.test(titleText);

  // If title is an explicitly unrelated non-tech domain, reject match immediately
  if (isUnrelatedRoleDomain && !isTechnicalTitle) {
    return {
      score: 0,
      tier: "NONE",
      matchedSkills: [],
      eligibilityReason: "Failed Domain Compatibility: Unrelated non-tech job domain"
    };
  }

  // STEP 1 ELIGIBILITY RULE:
  // Must have at least ONE CORE technical skill match OR (technical title AND at least 1 skill match).
  // Roles matching ONLY supporting skills (e.g. Git, Jira) without a core skill or technical title fail eligibility.
  const isEligible = matchedCoreTechCount > 0 || (isTechnicalTitle && matchedTechSet.size > 0);

  if (!isEligible || matchedTechSet.size === 0) {
    return {
      score: 0,
      tier: "NONE",
      matchedSkills: [],
      eligibilityReason: matchedTechSet.size === 0
        ? "No matching skills"
        : "Failed Step 1 Eligibility: Matched only supporting skills without core tech or technical title",
    };
  }

  let rawScore = 0;

  if (titleTechMatches > 0) {
    rawScore += 35 + (titleTechMatches - 1) * 15;
  } else if (isTechnicalTitle) {
    rawScore += 20;
  }

  rawScore += explicitTechMatches * 15;
  rawScore += descTechMatches * 10;

  if (matchedTechSet.size >= 3) {
    rawScore += 15;
  } else if (matchedTechSet.size >= 2) {
    rawScore += 10;
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  const tier = getRelevanceTier(finalScore);

  return {
    score: finalScore,
    tier,
    matchedSkills,
    eligibilityReason: `Eligible: ${matchedCoreTechCount} core skills matched, isTechTitle=${isTechnicalTitle}`,
  };
}
