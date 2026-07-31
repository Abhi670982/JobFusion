/**
 * Resume & Job Skill Normalization Module
 * Maps skill synonyms and abbreviations to canonical skill names.
 */

const CANONICAL_SKILL_MAP = new Map<string, string>([
  // JavaScript variations
  ["js", "JavaScript"],
  ["javascript", "JavaScript"],
  ["ecmascript", "JavaScript"],

  // TypeScript variations
  ["ts", "TypeScript"],
  ["typescript", "TypeScript"],

  // Python variations
  ["py", "Python"],
  ["python", "Python"],

  // React variations
  ["react", "React"],
  ["reactjs", "React"],
  ["react.js", "React"],
  ["react js", "React"],

  // Next.js variations
  ["next", "Next.js"],
  ["nextjs", "Next.js"],
  ["next.js", "Next.js"],

  // Node.js variations
  ["node", "Node.js"],
  ["nodejs", "Node.js"],
  ["node.js", "Node.js"],
  ["node js", "Node.js"],

  // Express.js variations
  ["express", "Express.js"],
  ["expressjs", "Express.js"],
  ["express.js", "Express.js"],
  ["express js", "Express.js"],

  // Vue.js variations
  ["vue", "Vue.js"],
  ["vuejs", "Vue.js"],
  ["vue.js", "Vue.js"],

  // Angular variations
  ["angular", "Angular"],
  ["angularjs", "Angular"],

  // C++ variations
  ["cpp", "C++"],
  ["c++", "C++"],

  // C# variations
  ["c#", "C#"],
  ["csharp", "C#"],

  // Go variations
  ["golang", "Go"],
  ["go", "Go"],

  // Rust variations
  ["rust", "Rust"],
  ["rustlang", "Rust"],

  // Database variations
  ["mongo", "MongoDB"],
  ["mongodb", "MongoDB"],
  ["postgres", "PostgreSQL"],
  ["postgresql", "PostgreSQL"],
  ["psql", "PostgreSQL"],

  // Cloud & DevOps
  ["aws", "AWS"],
  ["amazon web services", "AWS"],
  ["k8s", "Kubernetes"],
  ["kubernetes", "Kubernetes"],

  // CSS variations
  ["tailwind", "Tailwind CSS"],
  ["tailwindcss", "Tailwind CSS"],
  ["tailwind css", "Tailwind CSS"],
]);

/**
 * Normalizes a single skill token into its canonical form.
 */
export function normalizeSkillName(skill: string): string {
  if (!skill) return "";
  const cleaned = skill.trim();
  const lower = cleaned.toLowerCase();

  if (CANONICAL_SKILL_MAP.has(lower)) {
    return CANONICAL_SKILL_MAP.get(lower)!;
  }

  // Capitalize first letter of unknown skill for clean display
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Normalizes a list of skill tokens into a deduplicated canonical skill array.
 */
export function normalizeSkillsList(skills: string[]): string[] {
  if (!Array.isArray(skills)) return [];
  const normalizedSet = new Set<string>();

  for (const s of skills) {
    const norm = normalizeSkillName(s);
    if (norm) {
      normalizedSet.add(norm);
    }
  }

  return Array.from(normalizedSet);
}
