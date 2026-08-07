/**
 * Semantic Query Expansion Algorithm
 * Expands a set of user resume skills into search terms for job boards.
 * Generates both specific technology queries and broader domain role titles
 * to maximize relevant job discovery across portals.
 */
export function expandSkillsToQueries(skills: string[]): string[] {
  if (!skills || skills.length === 0) {
    return ["software engineer", "full stack developer", "software developer"];
  }

  const normalized = skills.map((s) => s.toLowerCase().trim());
  const queries: string[] = [];

  const frontendSkills = new Set(["react", "react.js", "next.js", "vue", "angular", "javascript", "typescript", "frontend", "html", "css", "tailwind"]);
  const backendSkills = new Set(["node.js", "nodejs", "express", "nestjs", "django", "flask", "fastapi", "spring boot", "backend", "mongodb", "postgresql", "mysql", "sql", "python", "java", "golang"]);
  const devopsSkills = new Set(["docker", "kubernetes", "aws", "azure", "gcp", "devops", "ci/cd", "terraform", "linux"]);
  const mobileSkills = new Set(["flutter", "react native", "swift", "kotlin", "android", "ios", "mobile"]);
  const dataSkills = new Set(["python", "pandas", "numpy", "machine learning", "data science", "sql", "pyspark", "tensorflow", "pytorch"]);

  let hasFrontend = false;
  let hasBackend = false;
  let hasDevops = false;
  let hasMobile = false;
  let hasData = false;

  for (const skill of normalized) {
    if (frontendSkills.has(skill)) hasFrontend = true;
    if (backendSkills.has(skill)) hasBackend = true;
    if (devopsSkills.has(skill)) hasDevops = true;
    if (mobileSkills.has(skill)) hasMobile = true;
    if (dataSkills.has(skill)) hasData = true;
  }

  // 1. Direct Skill-based Queries
  if (normalized.includes("react") || normalized.includes("react.js")) {
    queries.push("React Developer");
  }
  if (normalized.includes("next.js") || normalized.includes("nextjs")) {
    queries.push("Next.js Developer");
  }
  if (normalized.includes("node.js") || normalized.includes("nodejs")) {
    queries.push("Node.js Developer");
  }
  if (normalized.includes("python")) {
    queries.push("Python Developer");
  }
  if (normalized.includes("java")) {
    queries.push("Java Developer");
  }
  if (normalized.includes("flutter")) {
    queries.push("Flutter Developer");
  }

  // 2. Domain & Broad Technical Role Queries (for high job coverage)
  if (hasFrontend && hasBackend) {
    queries.push("Full Stack Developer");
    queries.push("Software Engineer");
    queries.push("Web Developer");
  } else {
    if (hasFrontend) {
      queries.push("Frontend Developer");
      queries.push("Software Engineer");
    }
    if (hasBackend) {
      queries.push("Backend Developer");
      queries.push("Software Engineer");
    }
  }

  if (hasDevops) {
    queries.push("DevOps Engineer");
    queries.push("Cloud Engineer");
  }

  if (hasMobile) {
    queries.push("Mobile Developer");
  }

  if (hasData) {
    queries.push("Data Engineer");
  }

  // Always include broad role fallbacks if queries are sparse
  queries.push("Software Engineer");
  queries.push("Software Developer");

  // Deduplicate
  const uniqueQueries = Array.from(new Set(queries));
  
  if (uniqueQueries.length === 0) {
    return skills.map(s => `${s} Developer`);
  }

  // Allow up to 8 expanded queries to maximize job coverage
  return uniqueQueries.slice(0, 8);
}
