import { ExperienceExtractionResult } from "./experience-extractor";

export type CareerStage =
  | "Internship"
  | "Fresher"
  | "Early Career"
  | "Mid Level"
  | "Senior"
  | "Leadership"
  | "Unknown";

/**
 * Classifies a job posting into a canonical career stage based on title, extracted experience, and description.
 */
export function classifyCareerStage(
  title: string,
  experience: ExperienceExtractionResult,
  description?: string
): CareerStage {
  const lowerTitle = (title || "").toLowerCase();
  const lowerDesc = (description || "").toLowerCase();

  // 1. Internship check (Highest precedence for explicit intern titles)
  if (
    lowerTitle.includes("intern") ||
    lowerDesc.includes("internship program")
  ) {
    return "Internship";
  }

  // 2. Leadership check
  if (
    experience.isLeadershipExplicit ||
    (experience.minYears !== undefined && experience.minYears >= 8) ||
    lowerTitle.includes("principal") ||
    lowerTitle.includes("staff engineer") ||
    lowerTitle.includes("engineering manager") ||
    lowerTitle.includes("director") ||
    lowerTitle.includes("head of")
  ) {
    return "Leadership";
  }

  // 3. Senior check
  if (
    experience.isSeniorExplicit ||
    (experience.minYears !== undefined && experience.minYears >= 5) ||
    lowerTitle.includes("senior") ||
    lowerTitle.includes("sr.") ||
    lowerTitle.includes("sr ")
  ) {
    return "Senior";
  }

  // 4. Fresher check
  if (
    experience.isFresherExplicit ||
    (experience.minYears !== undefined && experience.minYears === 0 && (experience.maxYears === undefined || experience.maxYears <= 2)) ||
    lowerTitle.includes("fresher") ||
    lowerTitle.includes("entry level") ||
    lowerTitle.includes("entry-level") ||
    lowerTitle.includes("graduate engineer") ||
    lowerTitle.includes("campus recruit") ||
    lowerTitle.includes("trainee")
  ) {
    return "Fresher";
  }

  // 5. Early Career check (1 - 3 years)
  if (
    (experience.minYears !== undefined && experience.minYears >= 1 && experience.minYears <= 3) ||
    lowerTitle.includes("junior") ||
    lowerTitle.includes("associate")
  ) {
    return "Early Career";
  }

  // 6. Mid Level check (3 - 5 years)
  if (
    (experience.minYears !== undefined && experience.minYears > 3 && experience.minYears < 5) ||
    lowerTitle.includes("software engineer") ||
    lowerTitle.includes("developer")
  ) {
    return "Mid Level";
  }

  return "Unknown";
}
