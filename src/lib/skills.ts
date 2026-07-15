import mongoose from "mongoose";

// Reads all distinct skills stored across all user profiles in the DB
// Returns a deduplicated, prioritized list for crawling
export async function extractSkillsFromDB(): Promise<string[]> {
  const db = mongoose.connection.db;
  if (!db) {
    console.warn("[Skills Extraction] DB connection is not ready.");
    return [];
  }

  const result = await db
    .collection("profiles")
    .aggregate([
      { $unwind: "$skills" },
      { $group: { _id: { $toLower: "$skills.name" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },   // most common skills first
      { $limit: 10 },             // top 10 skills max — prevents crawl overload
    ])
    .toArray();

  const skills = result.map((r: any) => r._id as string).filter(Boolean);

  if (skills.length === 0) {
    // RULE 2: Generic fallback terms are forbidden unless zero skills exist in the database
    console.warn(
      "SKILL EXTRACTION: No skills found in DB. Falling back to default generic terms."
    );
    return ["software engineer", "frontend developer", "backend developer"];
  }

  // Strip noise keywords that produce irrelevant job results
  const BLOCKED_KEYWORDS = [
    "git", "html", "css", "agile", "jira", "confluence",
    "ms office", "excel", "word", "powerpoint", "slack",
  ];

  const filtered = skills.filter(skill => !BLOCKED_KEYWORDS.includes(skill));
  
  if (filtered.length === 0) {
    return ["software engineer", "frontend developer", "backend developer"];
  }
  
  return filtered;
}
