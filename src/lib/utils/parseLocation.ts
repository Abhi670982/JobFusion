import { JobLocation } from "../types/normalizedJob";

export interface ParsedIndiaLocationResult {
  location: JobLocation;
  isIndiaMatch: boolean;
}

const INDIA_KEYWORDS = [
  "india", "bengaluru", "bangalore", "hyderabad", "gurgaon", "gurugram",
  "noida", "mumbai", "pune", "chennai", "delhi", "ncr", "kolkata", "ahmedabad"
];

function extractCity(locLower: string): string | undefined {
  if (locLower.includes("bengaluru") || locLower.includes("bangalore")) return "Bengaluru";
  if (locLower.includes("hyderabad")) return "Hyderabad";
  if (locLower.includes("gurgaon") || locLower.includes("gurugram")) return "Gurugram";
  if (locLower.includes("noida")) return "Noida";
  if (locLower.includes("mumbai")) return "Mumbai";
  if (locLower.includes("pune")) return "Pune";
  if (locLower.includes("chennai")) return "Chennai";
  if (locLower.includes("delhi")) return "Delhi";
  if (locLower.includes("kolkata")) return "Kolkata";
  if (locLower.includes("ahmedabad")) return "Ahmedabad";
  return undefined;
}

function determineRemoteType(locLower: string): "remote" | "hybrid" | "onsite" {
  if (locLower.includes("hybrid")) return "hybrid";
  if (locLower.includes("remote") || locLower.includes("anywhere") || locLower.includes("work from home") || locLower.includes("wfh")) {
    return "remote";
  }
  return "onsite";
}

/**
 * Provider-agnostic location parser.
 * Retains rawLocation and maps city, country, state, and remoteType.
 */
export function parseJobLocation(rawLocation: string, atsCountry?: string): ParsedIndiaLocationResult {
  const loc = (rawLocation || "").trim();
  const locLower = loc.toLowerCase();
  const remoteType = determineRemoteType(locLower);

  // 1. Structured country code check
  if (atsCountry) {
    const cLower = String(atsCountry).toLowerCase().trim();
    if (cLower === "in" || cLower === "ind" || cLower.includes("india")) {
      return {
        location: {
          city: extractCity(locLower) || loc.split(",")[0]?.trim(),
          country: "India",
          remoteType,
          rawLocation: loc,
        },
        isIndiaMatch: true,
      };
    }
  }

  // 2. Text keyword matching
  const hasIndiaKeyword = INDIA_KEYWORDS.some((k) => locLower.includes(k));
  if (hasIndiaKeyword) {
    return {
      location: {
        city: extractCity(locLower) || loc.split(",")[0]?.trim(),
        country: "India",
        remoteType,
        rawLocation: loc,
      },
      isIndiaMatch: true,
    };
  }

  // 3. Global remote roles matching India eligibility
  const isGlobalRemote = remoteType === "remote" && (
    locLower.includes("global") ||
    locLower.includes("worldwide") ||
    locLower.includes("anywhere") ||
    locLower.includes("asia")
  );

  if (isGlobalRemote) {
    return {
      location: {
        city: "Remote",
        country: "India",
        remoteType: "remote",
        rawLocation: loc,
      },
      isIndiaMatch: true,
    };
  }

  // Fallback for non-India location
  const parts = loc.split(",");
  const countryCandidate = parts.length > 1 ? parts[parts.length - 1].trim() : undefined;
  const cityCandidate = parts.length > 0 && parts[0].trim() !== "" ? parts[0].trim() : undefined;

  return {
    location: {
      city: cityCandidate,
      country: countryCandidate,
      remoteType,
      rawLocation: loc,
    },
    isIndiaMatch: false,
  };
}
