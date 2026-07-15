const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface ParsedDate {
  timestamp: Date;
  isWithin24Hours: boolean;
}

export function parsePostedDate(raw: string | null | undefined): ParsedDate | null {
  if (!raw) return null;

  const text = raw.toLowerCase().trim();
  const now  = Date.now();

  // ── Patterns that are ALWAYS within 24 hours ──────────────────────
  if (
    text.includes("just posted") ||
    text.includes("just now") ||
    text.includes("today") ||
    text.includes("moments ago") ||
    text === "new" ||
    text.includes("1 hour") ||
    text.includes("hours ago") ||
    text.includes("minute") ||
    text.includes("second")
  ) {
    // Check if it lists a number of hours older than 24
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

  if (text.includes("yesterday")) {
    return {
      timestamp: new Date(now - 24 * 60 * 60 * 1000),
      isWithin24Hours: false,
    };
  }

  // ── "X minutes ago" ───────────────────────────────────────────────
  const minutesMatch = text.match(/(\d+)\s*min/);
  if (minutesMatch) {
    const ms = parseInt(minutesMatch[1], 10) * 60 * 1000;
    return { timestamp: new Date(now - ms), isWithin24Hours: true };
  }

  // ── "X weeks ago" ─────────────────────────────────────────────────
  const weeksMatch = text.match(/(\d+)\s*week/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1], 10);
    return {
      timestamp: new Date(now - weeks * 7 * 24 * 60 * 60 * 1000),
      isWithin24Hours: false,
    };
  }

  // ── "X months ago" ────────────────────────────────────────────────
  const monthsMatch = text.match(/(\d+)\s*month/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1], 10);
    return {
      timestamp: new Date(now - months * 30 * 24 * 60 * 60 * 1000),
      isWithin24Hours: false,
    };
  }

  // ── "X days ago" ─────────────────────────────────────────────────
  const daysMatch = text.match(/(\d+)\s*day/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    return {
      timestamp:       new Date(now - days * 24 * 60 * 60 * 1000),
      isWithin24Hours: days < 1, // "1 day ago" = potentially 24-48h, reject it
    };
  }

  // ── ISO / standard date strings ──────────────────────────────────
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return {
      timestamp:       parsed,
      isWithin24Hours: now - parsed.getTime() <= TWENTY_FOUR_HOURS_MS,
    };
  }

  // ── RULE 1 ENFORCEMENT: unparseable date = reject the job ────────
  console.warn(`STRICT DATE FILTER: Could not parse date "${raw}" — job rejected`);
  return null;
}
