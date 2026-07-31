export type StandardEmploymentType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship"
  | "freelance";

/**
 * Generic provider-agnostic employment type normalizer.
 */
export function normalizeEmploymentType(rawType?: string | null, title?: string): StandardEmploymentType | undefined {
  const typeStr = String(rawType || "").toLowerCase();
  const titleStr = String(title || "").toLowerCase();

  if (typeStr.includes("intern") || titleStr.includes("intern") || typeStr.includes("trainee")) {
    return "internship";
  }
  if (typeStr.includes("contract") || typeStr.includes("temporary") || typeStr.includes("temp") || titleStr.includes("contract")) {
    return "contract";
  }
  if (typeStr.includes("part") || titleStr.includes("part-time") || titleStr.includes("part time")) {
    return "part-time";
  }
  if (typeStr.includes("freelance") || titleStr.includes("freelance")) {
    return "freelance";
  }
  if (typeStr.includes("full") || typeStr.includes("regular") || typeStr.includes("permanent")) {
    return "full-time";
  }

  // Default to full-time if title or type suggests technical role, otherwise undefined
  if (titleStr.length > 0) {
    return "full-time";
  }

  return undefined;
}
