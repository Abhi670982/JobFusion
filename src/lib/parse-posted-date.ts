const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface ParsedDate {
  timestamp: Date;
  isWithin24Hours: boolean;
}

/**
 * Universal Job Portal Date Parser
 * Handles relative time strings ("Recently listed", "Just Posted", "Today", "Few hours ago", "Yesterday", etc.)
 * NEVER rejects a job simply because the date text string differs.
 * Unparseable/Unknown dates default to current timestamp ("recent") instead of being discarded.
 */
export function parsePostedDate(raw: string | null | undefined): ParsedDate {
  const now = Date.now();
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return { timestamp: new Date(now), isWithin24Hours: true };
  }

  const text = raw.toLowerCase().trim();

  // ── 1. Immediate Recent/Today Patterns ──────────────────────────────
  if (
    text.includes("just posted") ||
    text.includes("just now") ||
    text.includes("today") ||
    text.includes("recently") ||
    text.includes("moments ago") ||
    text.includes("few hours") ||
    text.includes("active today") ||
    text === "new" ||
    text === "recent"
  ) {
    const hoursMatch = text.match(/(\d+)\s*hour/);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1], 10);
      return {
        timestamp: new Date(now - hours * 60 * 60 * 1000),
        isWithin24Hours: hours <= 24,
      };
    }
    return { timestamp: new Date(now), isWithin24Hours: true };
  }

  // ── 2. Yesterday ─────────────────────────────────────────────────
  if (text.includes("yesterday")) {
    return {
      timestamp: new Date(now - 24 * 60 * 60 * 1000),
      isWithin24Hours: false,
    };
  }

  // ── 3. "X minutes ago" / "X mins ago" ────────────────────────────
  const minutesMatch = text.match(/(\d+)\s*(min|minute)/);
  if (minutesMatch) {
    const ms = parseInt(minutesMatch[1], 10) * 60 * 1000;
    return { timestamp: new Date(now - ms), isWithin24Hours: true };
  }

  // ── 4. "X hours ago" ──────────────────────────────────────────────
  const hoursMatch = text.match(/(\d+)\s*(hr|hour)/);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1], 10);
    return {
      timestamp: new Date(now - hours * 60 * 60 * 1000),
      isWithin24Hours: hours <= 24,
    };
  }

  // ── 5. "X days ago" ───────────────────────────────────────────────
  const daysMatch = text.match(/(\d+)\s*(d|day)/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    return {
      timestamp: new Date(now - days * 24 * 60 * 60 * 1000),
      isWithin24Hours: days < 1,
    };
  }

  // ── 6. "X weeks ago" ──────────────────────────────────────────────
  const weeksMatch = text.match(/(\d+)\s*(wk|week)/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1], 10);
    return {
      timestamp: new Date(now - weeks * 7 * 24 * 60 * 60 * 1000),
      isWithin24Hours: false,
    };
  }

  // ── 7. "X months ago" ─────────────────────────────────────────────
  const monthsMatch = text.match(/(\d+)\s*(mo|month)/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1], 10);
    return {
      timestamp: new Date(now - months * 30 * 24 * 60 * 60 * 1000),
      isWithin24Hours: false,
    };
  }

  // ── 8. Standard ISO or Date String ────────────────────────────────
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return {
      timestamp: parsed,
      isWithin24Hours: now - parsed.getTime() <= TWENTY_FOUR_HOURS_MS,
    };
  }

  // ── 9. Fallback Default for Unparseable Strings: Accept as Recent ──
  console.log(`[Date Parser Info] Unrecognized date string "${raw}" defaulted to current timestamp.`);
  return { timestamp: new Date(now), isWithin24Hours: true };
}
