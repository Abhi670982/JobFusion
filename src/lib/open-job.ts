/**
 * Safe utility for opening job application URLs in a new tab.
 * - Validates URL starts with http/https before opening (prevents blank tab on null/undefined)
 * - Always passes noopener,noreferrer to prevent tab-napping attacks
 */
export function openJob(url: string | null | undefined): void {
  if (!url) return;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return;
  window.open(url, "_blank", "noopener,noreferrer");
}
