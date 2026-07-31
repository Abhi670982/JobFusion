export interface DateParseResult {
  date?: Date;
  confidence: "exact" | "estimated" | "unknown";
}

/**
 * Generic provider-agnostic date parser.
 * Safely handles ISO strings, UNIX timestamps, relative date text without fabricating dates.
 */
export function parsePostedDate(rawDate?: string | number | Date | null): DateParseResult {
  if (rawDate === null || rawDate === undefined || rawDate === "") {
    return { date: undefined, confidence: "unknown" };
  }

  if (rawDate instanceof Date) {
    if (!isNaN(rawDate.getTime())) {
      return { date: rawDate, confidence: "exact" };
    }
    return { date: undefined, confidence: "unknown" };
  }

  if (typeof rawDate === "number") {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return { date: d, confidence: "exact" };
    }
    return { date: undefined, confidence: "unknown" };
  }

  const str = String(rawDate).trim();
  if (str === "") {
    return { date: undefined, confidence: "unknown" };
  }

  // ISO / Standard parseable date check first
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return { date: parsed, confidence: "exact" };
  }

  // Relative text parsing (e.g., Workday "Posted Today", "Posted 2 Days Ago", "30+ Days Ago")
  const lower = str.toLowerCase();
  const now = new Date();

  if (lower.includes("today") || lower.includes("24h") || lower.includes("1 day") || lower.includes("just posted")) {
    return { date: now, confidence: "estimated" };
  }
  if (lower.includes("yesterday")) {
    return { date: new Date(now.getTime() - 24 * 60 * 60 * 1000), confidence: "estimated" };
  }

  const daysMatch = lower.match(/(\d+)\s+days?\s+ago/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    return { date: new Date(now.getTime() - days * 24 * 60 * 60 * 1000), confidence: "estimated" };
  }

  if (lower.includes("30+ days ago")) {
    return { date: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), confidence: "estimated" };
  }

  return { date: undefined, confidence: "unknown" };
}
