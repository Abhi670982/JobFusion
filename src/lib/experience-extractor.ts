export interface ExperienceExtractionResult {
  minYears?: number;
  maxYears?: number;
  confidence: "high" | "medium" | "low" | "none";
  rawMatch?: string;
  isFresherExplicit: boolean;
  isSeniorExplicit: boolean;
  isLeadershipExplicit: boolean;
}

/**
 * Extracts minimum and maximum required experience years from title and text.
 * Leaves minYears/maxYears undefined if experience cannot be confidently determined.
 */
export function extractExperienceRequirements(
  title: string,
  description?: string,
  requirements?: string[]
): ExperienceExtractionResult {
  const fullText = `${title || ""} ${description || ""} ${(requirements || []).join(" ")}`;
  const lowerTitle = (title || "").toLowerCase();
  const lowerText = fullText.toLowerCase();

  let isFresherExplicit = false;
  let isSeniorExplicit = false;
  let isLeadershipExplicit = false;

  // Title keyword flags
  if (
    lowerTitle.includes("fresher") ||
    lowerTitle.includes("entry level") ||
    lowerTitle.includes("entry-level") ||
    lowerTitle.includes("graduate") ||
    lowerTitle.includes("campus") ||
    lowerTitle.includes("intern")
  ) {
    isFresherExplicit = true;
  }

  if (
    lowerTitle.includes("senior") ||
    lowerTitle.includes("sr.") ||
    lowerTitle.includes("sr ")
  ) {
    isSeniorExplicit = true;
  }

  if (
    lowerTitle.includes("staff") ||
    lowerTitle.includes("lead") ||
    lowerTitle.includes("principal") ||
    lowerTitle.includes("manager") ||
    lowerTitle.includes("head") ||
    lowerTitle.includes("director") ||
    lowerTitle.includes("vp")
  ) {
    isLeadershipExplicit = true;
  }

  // Range pattern matching: e.g. "0-2 years", "1 to 3 yrs", "3 - 5+ years"
  const rangeMatch = lowerText.match(/(\d+)\s*(?:-|to|\+)?\s*(\d+)?\s*(?:years?|yrs?)\b/);
  if (rangeMatch) {
    const val1 = parseInt(rangeMatch[1], 10);
    const val2 = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : undefined;

    const minYears = val2 !== undefined ? Math.min(val1, val2) : val1;
    const maxYears = val2 !== undefined ? Math.max(val1, val2) : undefined;

    return {
      minYears,
      maxYears,
      confidence: "high",
      rawMatch: rangeMatch[0],
      isFresherExplicit: isFresherExplicit || minYears === 0,
      isSeniorExplicit: isSeniorExplicit || (minYears >= 5 && minYears < 8),
      isLeadershipExplicit: isLeadershipExplicit || minYears >= 8,
    };
  }

  // Explicit "0 years" or "freshers allowed" match
  if (
    lowerText.includes("0 years") ||
    lowerText.includes("0-1 year") ||
    lowerText.includes("freshers can apply") ||
    lowerText.includes("freshers welcome")
  ) {
    return {
      minYears: 0,
      maxYears: 1,
      confidence: "high",
      rawMatch: "freshers welcome",
      isFresherExplicit: true,
      isSeniorExplicit,
      isLeadershipExplicit,
    };
  }

  // Fallback to title keywords if no numeric range matched
  if (isFresherExplicit) {
    return {
      minYears: 0,
      maxYears: 2,
      confidence: "medium",
      rawMatch: "fresher title keyword",
      isFresherExplicit: true,
      isSeniorExplicit: false,
      isLeadershipExplicit: false,
    };
  }

  if (isSeniorExplicit) {
    return {
      minYears: 5,
      maxYears: 8,
      confidence: "medium",
      rawMatch: "senior title keyword",
      isFresherExplicit: false,
      isSeniorExplicit: true,
      isLeadershipExplicit: false,
    };
  }

  if (isLeadershipExplicit) {
    return {
      minYears: 8,
      confidence: "medium",
      rawMatch: "leadership title keyword",
      isFresherExplicit: false,
      isSeniorExplicit: false,
      isLeadershipExplicit: true,
    };
  }

  return {
    minYears: undefined,
    maxYears: undefined,
    confidence: "none",
    isFresherExplicit: false,
    isSeniorExplicit: false,
    isLeadershipExplicit: false,
  };
}
