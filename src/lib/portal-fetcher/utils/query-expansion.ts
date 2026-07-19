/**
 * Semantic Query Expansion Algorithm
 * Expands a set of user resume skills into search terms for job boards.
 * Restricts output to maximum 3 target queries to control latency.
 */
export function expandSkillsToQueries(skills: string[]): string[] {
  if (!skills || skills.length === 0) {
    return ["software engineer"];
  }

  const normalized = skills.map((s) => s.toLowerCase().trim());
  const queries: string[] = [];

  const frontendSkills = new Set(["react", "react.js", "next.js", "vue", "angular", "javascript", "typescript", "frontend", "html", "css", "tailwind"]);
  const backendSkills = new Set(["node.js", "nodejs", "express", "nestjs", "django", "flask", "fastapi", "spring boot", "backend", "mongodb", "postgresql", "mysql", "sql", "python", "java"]);
  const devopsSkills = new Set(["docker", "kubernetes", "aws", "azure", "gcp", "devops", "ci/cd", "terraform", "linux"]);
  const mobileSkills = new Set(["flutter", "react native", "swift", "kotlin", "android", "ios", "mobile"]);

  let hasFrontend = false;
  let hasBackend = false;
  let hasDevops = false;
  let hasMobile = false;

  for (const skill of normalized) {
    if (frontendSkills.has(skill)) hasFrontend = true;
    if (backendSkills.has(skill)) hasBackend = true;
    if (devopsSkills.has(skill)) hasDevops = true;
    if (mobileSkills.has(skill)) hasMobile = true;
  }

  // 1. Core strong skill queries
  if (normalized.includes("react") || normalized.includes("react.js")) {
    queries.push("React Developer");
  } else if (normalized.includes("next.js") || normalized.includes("nextjs")) {
    queries.push("Next.js Developer");
  }

  if (normalized.includes("node.js") || normalized.includes("nodejs")) {
    queries.push("Node.js Developer");
  }

  if (normalized.includes("flutter")) {
    queries.push("Flutter Developer");
  }

  if (normalized.includes("python")) {
    queries.push("Python Developer");
  }

  // 2. Generic domain queries based on skills matching
  if (hasFrontend && hasBackend) {
    queries.push("Full Stack Developer");
  } else {
    if (hasFrontend) queries.push("Frontend Developer");
    if (hasBackend) queries.push("Backend Developer");
  }

  if (hasDevops) {
    queries.push("DevOps Engineer");
  }

  if (hasMobile && !queries.includes("Flutter Developer")) {
    queries.push("Mobile Developer");
  }

  // Deduplicate and fallback
  const uniqueQueries = Array.from(new Set(queries));
  
  if (uniqueQueries.length === 0) {
    // If no mappings matched, use the top 2 skills as search terms directly
    return skills.slice(0, 2).map(s => `${s} Developer`);
  }

  // Return max 3 queries to balance execution latency and depth
  return uniqueQueries.slice(0, 3);
}
