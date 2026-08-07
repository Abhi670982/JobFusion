import { JobSourceCategory } from "@prisma/client";

/**
 * Defensive Source Provider & Category Classifier
 * Enforces strict boundary between official COMPANY_CAREER systems and JOB_PORTAL aggregators.
 * UNKNOWN sources are never guessed to prevent silent category leakage.
 */

export const KNOWN_JOB_PORTAL_PROVIDERS = new Set([
  "linkedin",
  "indeed",
  "internshala",
  "wellfound",
  "naukri",
  "foundit",
  "glassdoor",
  "ziprecruiter",
  "aggregator",
]);

export const KNOWN_COMPANY_CAREER_PROVIDERS = new Set([
  "greenhouse",
  "lever",
  "ashby",
  "smartrecruiters",
  "recruitee",
  "phenom",
  "workday",
  "successfactors",
  "taleo",
  "icims",
  "oracle_recruiting",
  "oracle",
  "careers",
  "company_career",
  "official_website",
]);

export interface ClassifiedSource {
  category: JobSourceCategory;
  provider: string;
  isVerified: boolean;
}

/**
 * Classifies a raw source/provider string defensively into JobSourceCategory.
 */
export function classifySourceCategory(
  rawSource: string | null | undefined,
  rawProvider?: string | null | undefined
): ClassifiedSource {
  const sourceStr = (rawSource || "").toLowerCase().trim();
  const providerStr = (rawProvider || "").toLowerCase().trim();

  // Combine lookup tokens
  const tokens = [providerStr, sourceStr].filter(Boolean);

  for (const token of tokens) {
    if (KNOWN_JOB_PORTAL_PROVIDERS.has(token)) {
      return {
        category: JobSourceCategory.JOB_PORTAL,
        provider: token.toUpperCase(),
        isVerified: true,
      };
    }
    if (KNOWN_COMPANY_CAREER_PROVIDERS.has(token)) {
      return {
        category: JobSourceCategory.COMPANY_CAREER,
        provider: token.toUpperCase(),
        isVerified: true,
      };
    }
  }

  // Handle substring checks for unambiguous known formats
  if (sourceStr.includes("linkedin")) {
    return { category: JobSourceCategory.JOB_PORTAL, provider: "LINKEDIN", isVerified: true };
  }
  if (sourceStr.includes("indeed")) {
    return { category: JobSourceCategory.JOB_PORTAL, provider: "INDEED", isVerified: true };
  }
  if (sourceStr.includes("internshala")) {
    return { category: JobSourceCategory.JOB_PORTAL, provider: "INTERNSHALA", isVerified: true };
  }
  if (sourceStr.includes("wellfound") || sourceStr.includes("angel")) {
    return { category: JobSourceCategory.JOB_PORTAL, provider: "WELLFOUND", isVerified: true };
  }
  if (sourceStr.includes("naukri")) {
    return { category: JobSourceCategory.JOB_PORTAL, provider: "NAUKRI", isVerified: true };
  }
  if (sourceStr.includes("foundit") || sourceStr.includes("monster")) {
    return { category: JobSourceCategory.JOB_PORTAL, provider: "FOUNDIT", isVerified: true };
  }
  if (sourceStr.includes("greenhouse")) {
    return { category: JobSourceCategory.COMPANY_CAREER, provider: "GREENHOUSE", isVerified: true };
  }
  if (sourceStr.includes("lever")) {
    return { category: JobSourceCategory.COMPANY_CAREER, provider: "LEVER", isVerified: true };
  }
  if (sourceStr.includes("ashby")) {
    return { category: JobSourceCategory.COMPANY_CAREER, provider: "ASHBY", isVerified: true };
  }
  if (sourceStr.includes("smartrecruiters")) {
    return { category: JobSourceCategory.COMPANY_CAREER, provider: "SMARTRECRUITERS", isVerified: true };
  }
  if (sourceStr.includes("workday")) {
    return { category: JobSourceCategory.COMPANY_CAREER, provider: "WORKDAY", isVerified: true };
  }
  if (sourceStr.includes("careers")) {
    return { category: JobSourceCategory.COMPANY_CAREER, provider: "CAREERS", isVerified: true };
  }

  // UNKNOWN SOURCE: DO NOT GUESS!
  console.warn(`[SourceClassifier] Warning: Unrecognized source "${rawSource}" / provider "${rawProvider}". Quarantining as UNKNOWN.`);
  return {
    category: JobSourceCategory.UNKNOWN,
    provider: (providerStr || sourceStr || "UNKNOWN").toUpperCase(),
    isVerified: false,
  };
}

/**
 * Asserts that a classified source strictly matches an expected category.
 * Prevents cross-category leakage even if bugs occur upstream.
 */
export function assertCategoryMatch(
  expectedCategory: JobSourceCategory,
  rawSource: string | null | undefined,
  rawProvider?: string | null | undefined
): boolean {
  const classified = classifySourceCategory(rawSource, rawProvider);
  return classified.category === expectedCategory;
}
