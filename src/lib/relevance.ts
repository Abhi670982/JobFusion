/**
 * Mathematically Normalized Relevance Scoring & Skill Matching Engine
 * Precision-engineered to eliminate false positives, build bidirectional alias resolution,
 * and discriminate score strength cleanly across multi-skill vs single-skill roles.
 */

export interface RelevanceInput {
  title?: string | null;
  skills?: string[] | null;
  description?: string | null;
  requirements?: string[] | null;
}

export interface DetailedMatchResult {
  score: number;
  matchedSkills: Array<{
    skill: string;
    location: "TITLE" | "EXPLICIT_SKILLS" | "DESCRIPTION";
  }>;
}

// Canonical Skill Groups
const SKILL_GROUPS: string[][] = [
  ["js", "javascript", "ecmascript"],
  ["ts", "typescript"],
  ["react", "reactjs", "react.js", "react native"],
  ["next", "nextjs", "next.js"],
  ["node", "nodejs", "node.js"],
  ["express.js", "expressjs", "express js"],
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
  ["git", "github", "gitlab"],
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
 * Precision boundary-aware technical match check
 */
export function isTermInText(term: string, text: string): boolean {
  if (!term || !text) return false;
  const normTerm = term.toLowerCase().trim();
  const normText = text.toLowerCase();

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
 * Detailed relevance calculation returning score and evidence locations
 */
export function calculateDetailedRelevance(input: RelevanceInput, userSkills: string[]): DetailedMatchResult {
  if (!userSkills || userSkills.length === 0) {
    return { score: 0, matchedSkills: [] };
  }

  const titleText = (input.title || "").toLowerCase();
  const explicitSkills = (input.skills || []).map(s => s.toLowerCase());
  const descText = ((input.description || "") + " " + (input.requirements || []).join(" ")).toLowerCase();

  const matchedSkills: Array<{ skill: string; location: "TITLE" | "EXPLICIT_SKILLS" | "DESCRIPTION" }> = [];
  const matchedTechSet = new Set<string>();

  let titleTechMatches = 0;
  let explicitTechMatches = 0;
  let descTechMatches = 0;

  for (const rawSkill of userSkills) {
    const normSkill = rawSkill.toLowerCase().trim();
    if (!normSkill || GENERIC_SOFT_SKILLS.has(normSkill)) continue; // Skip generic soft skills for technical scoring

    let matchedInThisSkill = false;

    // 1. Check Title Match
    if (isTermInText(normSkill, titleText)) {
      titleTechMatches++;
      matchedTechSet.add(normSkill);
      matchedSkills.push({ skill: rawSkill, location: "TITLE" });
      matchedInThisSkill = true;
    }

    // 2. Check Explicit Skills Array
    const aliases = ALIAS_LOOKUP.get(normSkill) || [normSkill];
    const inExplicit = explicitSkills.some(tag => aliases.some(a => isTermInText(a, tag)));
    if (inExplicit) {
      explicitTechMatches++;
      matchedTechSet.add(normSkill);
      matchedSkills.push({ skill: rawSkill, location: "EXPLICIT_SKILLS" });
      matchedInThisSkill = true;
    }

    // 3. Check Description if not matched in Title/Explicit or for additional evidence
    if (!matchedInThisSkill && isTermInText(normSkill, descText)) {
      descTechMatches++;
      matchedTechSet.add(normSkill);
      matchedSkills.push({ skill: rawSkill, location: "DESCRIPTION" });
    }
  }

  // Broad Tech Title check (e.g., Software Engineer, Full Stack, Frontend, Backend)
  const isBroadTechTitle = /\b(software engineer|full stack|frontend|backend|web developer|systems engineer|devops engineer|data engineer|mobile developer)\b/i.test(titleText);

  // If no core technical skills matched at all, score is 0
  if (matchedTechSet.size === 0) {
    return { score: 0, matchedSkills: [] };
  }

  let rawScore = 0;

  if (titleTechMatches > 0) {
    rawScore += 35 + (titleTechMatches - 1) * 15;
  } else if (isBroadTechTitle) {
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

  return {
    score: finalScore,
    matchedSkills
  };
}
