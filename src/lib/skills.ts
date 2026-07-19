import { prisma } from "./prisma";

/**
 * Reads distinct profile skills from PostgreSQL (Prisma).
 * Returns a deduplicated, prioritized list for crawling (Rule 2).
 */
export async function extractSkillsFromDB(): Promise<string[]> {
  try {
    const grouped = await prisma.profileSkill.groupBy({
      by: ["name"],
      _count: { name: true },
      orderBy: { _count: { name: "desc" } },
      take: 20,
    });

    const skills = grouped
      .map((row) => row.name.trim().toLowerCase())
      .filter(Boolean);

    if (skills.length === 0) {
      console.warn(
        "SKILL EXTRACTION: No skills found in DB. Falling back to default generic terms."
      );
      return ["software engineer", "frontend developer", "backend developer"];
    }

    // Strip noise keywords that produce irrelevant job results
    const BLOCKED_KEYWORDS = new Set([
      "git",
      "html",
      "css",
      "agile",
      "jira",
      "confluence",
      "ms office",
      "excel",
      "word",
      "powerpoint",
      "slack",
    ]);

    const filtered = skills.filter((skill) => !BLOCKED_KEYWORDS.has(skill));

    if (filtered.length === 0) {
      return ["software engineer", "frontend developer", "backend developer"];
    }

    return filtered.slice(0, 10);
  } catch (err: any) {
    console.warn("[Skills Extraction] Failed:", err?.message || err);
    return ["software engineer", "frontend developer", "backend developer"];
  }
}
