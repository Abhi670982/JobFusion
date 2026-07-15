/**
 * Shared input validation utility for API routes.
 * Prevents parameter injection, ReDoS, and invalid pagination.
 */

const ALLOWED_SORT_FIELDS = ["postedAt", "salaryMin", "fetchedAt"] as const;
type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

export interface ValidatedJobsQuery {
  page: number;
  limit: number;
  q: string;
  location: string;
  skills: string;
  sortBy: SortField;
  order: "asc" | "desc";
}

export function validateJobsQuery(
  searchParams: URLSearchParams
): ValidatedJobsQuery {
  // Pagination — clamp to safe ranges
  const page = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1
  );
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
  );

  // String params — truncate to prevent oversized inputs
  const q = (searchParams.get("q") || "").slice(0, 200).trim();
  const location = (searchParams.get("location") || "").slice(0, 100).trim();
  const skills = (searchParams.get("skills") || "").slice(0, 500).trim();

  // Sort field — allowlist to prevent injection
  const rawSortBy = searchParams.get("sortBy") || "";
  const sortBy: SortField = (ALLOWED_SORT_FIELDS as readonly string[]).includes(
    rawSortBy
  )
    ? (rawSortBy as SortField)
    : "postedAt";

  // Sort order — binary choice only
  const order: "asc" | "desc" =
    searchParams.get("order") === "asc" ? "asc" : "desc";

  return { page, limit, q, location, skills, sortBy, order };
}

/**
 * Escape a string for safe use as a MongoDB regex pattern.
 * Prevents ReDoS via catastrophic backtracking.
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
