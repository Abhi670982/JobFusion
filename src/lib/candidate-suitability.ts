import { calculateDetailedRelevance, RelevanceInput } from "./relevance";
import { normalizeSkillsList } from "./skills-normalizer";
import { extractExperienceRequirements } from "./experience-extractor";
import { classifyCareerStage, CareerStage } from "./career-stage";
import { toRelativeTimeString } from "./pipeline";

export const RANKING_CONFIG = {
  weights: {
    baseRelevance: 0.50,
    experienceCompatibility: 0.30,
    freshness: 0.20,
  },
  fresherBoosts: {
    Internship: 1.40,
    Fresher: 1.35,
    "Early Career": 1.20,
    "Mid Level": 0.90,
    Senior: 0.50,
    Leadership: 0.30,
    Unknown: 1.00,
  } as Record<CareerStage, number>,
  experiencedBoosts: {
    Internship: 0.50,
    Fresher: 0.60,
    "Early Career": 0.80,
    "Mid Level": 1.00,
    Senior: 1.30,
    Leadership: 1.35,
    Unknown: 1.00,
  } as Record<CareerStage, number>,
  decayHalfLifeDays: 3.5,
};

export interface CandidateProfile {
  userSkills: string[];
  userExperienceYears?: number;
  preferredLocations?: string[];
  preferredJobTypes?: string[];
  preferredWorkMode?: "remote" | "hybrid" | "onsite";
}

export interface RankingMetadata {
  suitabilityScore: number;
  baseRelevanceScore: number;
  matchPercentage: number;
  careerStage: CareerStage;
  experienceRequiredLabel: string;
  freshnessLabel: string;
  matchReasons: string[];
}

export interface CandidateSuitabilityResult {
  suitabilityScore: number;
  baseRelevanceScore: number;
  careerStage: CareerStage;
  metadata: RankingMetadata;
}

/**
 * Calculates candidate suitability by extending the existing relevance scoring foundation
 * with experience compatibility, career stage boosts/penalties, and freshness decay.
 */
export function calculateCandidateSuitability(
  jobInput: RelevanceInput & { postedAtDate?: Date | null },
  profile: CandidateProfile
): CandidateSuitabilityResult {
  const normalizedUserSkills = normalizeSkillsList(profile.userSkills || []);
  const baseRelevance = calculateDetailedRelevance(jobInput, normalizedUserSkills);
  const baseScore = baseRelevance.score;

  const expExtracted = extractExperienceRequirements(
    jobInput.title || "",
    jobInput.description || "",
    jobInput.requirements || []
  );

  const careerStage = classifyCareerStage(
    jobInput.title || "",
    expExtracted,
    jobInput.description || ""
  );

  // Experience Compatibility calculation
  const candidateExp = profile.userExperienceYears ?? 0; // Default to fresher if unspecified
  let expCompatScore = 70; // Baseline fallback

  if (expExtracted.minYears !== undefined) {
    const min = expExtracted.minYears;
    const diff = candidateExp - min;

    if (diff >= 0 && diff <= 3) {
      expCompatScore = 100; // Perfect experience alignment
    } else if (diff < 0) { // Candidate under-experienced for role
      expCompatScore = Math.max(20, 100 - Math.abs(diff) * 25);
    } else { // Candidate over-experienced for role
      expCompatScore = Math.max(50, 100 - (diff - 3) * 15);
    }
  }

  // Apply Career Stage Multipliers (Fresher Boost vs Experienced Boost)
  let stageMultiplier = 1.0;
  if (candidateExp === 0 || candidateExp <= 1) {
    stageMultiplier = RANKING_CONFIG.fresherBoosts[careerStage] || 1.0;
  } else if (candidateExp >= 5) {
    stageMultiplier = RANKING_CONFIG.experiencedBoosts[careerStage] || 1.0;
  }

  // Freshness Decay calculation
  let freshnessScore = 50;
  const now = Date.now();
  if (jobInput.postedAtDate) {
    const ageDays = (now - jobInput.postedAtDate.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays >= 0) {
      freshnessScore = Math.round(100 * Math.pow(0.5, ageDays / RANKING_CONFIG.decayHalfLifeDays));
    }
  }

  // Composite Candidate Suitability Score calculation
  const weightedBase = baseScore * RANKING_CONFIG.weights.baseRelevance;
  const weightedExp = expCompatScore * RANKING_CONFIG.weights.experienceCompatibility;
  const weightedFresh = freshnessScore * RANKING_CONFIG.weights.freshness;

  const rawSuitability = (weightedBase + weightedExp + weightedFresh) * stageMultiplier;
  const finalSuitabilityScore = Math.min(100, Math.max(0, Math.round(rawSuitability)));

  // Format experience required label for explainability
  let expLabel = "Not Specified";
  if (expExtracted.minYears !== undefined && expExtracted.maxYears !== undefined) {
    expLabel = `${expExtracted.minYears}–${expExtracted.maxYears} Years`;
  } else if (expExtracted.minYears !== undefined) {
    expLabel = expExtracted.minYears === 0 ? "0–1 Years (Fresher)" : `${expExtracted.minYears}+ Years`;
  } else if (careerStage === "Fresher" || careerStage === "Internship") {
    expLabel = "0–2 Years";
  }

  const freshnessLabel = toRelativeTimeString(jobInput.postedAtDate);

  const matchReasons: string[] = [
    `${baseScore}% Skill Match`,
    `${careerStage}`,
    expLabel,
    freshnessLabel,
  ];

  const metadata: RankingMetadata = {
    suitabilityScore: finalSuitabilityScore,
    baseRelevanceScore: baseScore,
    matchPercentage: baseScore,
    careerStage,
    experienceRequiredLabel: expLabel,
    freshnessLabel,
    matchReasons,
  };

  return {
    suitabilityScore: finalSuitabilityScore,
    baseRelevanceScore: baseScore,
    careerStage,
    metadata,
  };
}
