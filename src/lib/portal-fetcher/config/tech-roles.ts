export interface TechRoleConfig {
  role: string;
  enabled: boolean;
  priority: number; // Lower number = higher priority
  maxLimit?: number;
}

/**
 * Extensible configuration list of Technology Roles for Job Portals crawl.
 * Supports per-role priority, per-role crawl limit, and individual enable/disable toggle.
 */
export const SUPPORTED_TECH_ROLES: TechRoleConfig[] = [
  { role: "Software Engineer", enabled: true, priority: 1, maxLimit: 20 },
  { role: "Frontend Developer", enabled: true, priority: 2, maxLimit: 20 },
  { role: "Backend Developer", enabled: true, priority: 3, maxLimit: 20 },
  { role: "Full Stack Developer", enabled: true, priority: 4, maxLimit: 20 },
  { role: "Mobile Developer", enabled: true, priority: 5, maxLimit: 15 },
  { role: "DevOps Engineer", enabled: true, priority: 6, maxLimit: 15 },
  { role: "Cloud Engineer", enabled: true, priority: 7, maxLimit: 15 },
  { role: "Data Engineer", enabled: true, priority: 8, maxLimit: 15 },
  { role: "Data Scientist", enabled: true, priority: 9, maxLimit: 15 },
  { role: "Machine Learning Engineer", enabled: true, priority: 10, maxLimit: 15 },
  { role: "AI Engineer", enabled: true, priority: 11, maxLimit: 15 },
  { role: "QA Engineer", enabled: true, priority: 12, maxLimit: 15 },
  { role: "SDET", enabled: true, priority: 13, maxLimit: 15 },
  { role: "Cybersecurity", enabled: true, priority: 14, maxLimit: 15 },
  { role: "UI Engineer", enabled: true, priority: 15, maxLimit: 10 },
  { role: "UX Engineer", enabled: true, priority: 16, maxLimit: 10 },
  { role: "Platform Engineer", enabled: true, priority: 17, maxLimit: 15 },
  { role: "Site Reliability Engineer", enabled: true, priority: 18, maxLimit: 15 },
  { role: "Engineering Intern", enabled: true, priority: 19, maxLimit: 15 },
  { role: "Software Intern", enabled: true, priority: 20, maxLimit: 15 },
  { role: "Technology internships", enabled: true, priority: 21, maxLimit: 15 },
];

/**
 * Returns enabled technology roles sorted by priority
 */
export function getTechnologyRolesToCrawl(): TechRoleConfig[] {
  return SUPPORTED_TECH_ROLES.filter((r) => r.enabled).sort((a, b) => a.priority - b.priority);
}

const SPECIFIC_TECH_REGEX = new RegExp(
  "\\b(" +
    [
      "software",
      "frontend",
      "backend",
      "full\\s*stack",
      "mobile",
      "android",
      "ios",
      "devops",
      "cloud",
      "data\\s*engineer",
      "data\\s*scientist",
      "machine\\s*learning",
      "ai",
      "artificial\\s*intelligence",
      "qa",
      "sdet",
      "quality\\s*assurance",
      "cybersecurity",
      "ui",
      "ux",
      "platform",
      "sre",
      "site\\s*reliability",
      "web\\s*developer",
      "coder",
      "programmer",
      "tech\\s*intern",
      "software\\s*intern",
    ].join("|") +
    ")\\b",
  "i"
);

const NON_TECH_EXCLUSION_REGEX = new RegExp(
  "\\b(" +
    [
      "sales",
      "business\\s*development",
      "marketing",
      "digital\\s*marketing",
      "hr",
      "human\\s*resources",
      "recruiter",
      "talent\\s*acquisition",
      "accounting",
      "finance",
      "legal",
      "operations",
      "office\\s*admin",
      "administrator",
      "customer\\s*support",
      "customer\\s*service",
      "telecaller",
      "receptionist",
      "civil",
      "mechanical",
      "nurse",
      "doctor",
    ].join("|") +
    ")\\b",
  "i"
);

/**
 * Validates if a job title or description belongs to technology domain
 */
export function isTechnologyRole(title: string, description?: string | null): boolean {
  if (!title) return false;
  const titleLower = title.toLowerCase().trim();

  // If title explicitly matches non-tech domains like Civil, Mechanical, Sales, HR, etc., reject
  if (NON_TECH_EXCLUSION_REGEX.test(titleLower) && !SPECIFIC_TECH_REGEX.test(titleLower)) {
    return false;
  }

  // Check if title or description matches specific technology keywords
  if (SPECIFIC_TECH_REGEX.test(titleLower)) {
    return true;
  }

  if (description && SPECIFIC_TECH_REGEX.test(description.toLowerCase())) {
    return true;
  }

  // Generic titles containing developer/engineer with no non-tech exclusions
  if (/\b(developer|programmer|coder|sdet|architect)\b/i.test(titleLower)) {
    return true;
  }

  return false;
}
