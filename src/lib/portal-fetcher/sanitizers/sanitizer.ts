import sanitizeHtml from "sanitize-html";

/**
 * Sanitizes untrusted HTML content by stripping script tags, iframes, inline styles, and event handlers.
 */
export function sanitizeJobDescription(htmlText: string | null | undefined): string {
  if (!htmlText) return "";
  
  const clean = sanitizeHtml(htmlText, {
    allowedTags: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "code", "span"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https"],
  });

  return clean.replace(/\s+/g, " ").trim();
}

/**
 * Validates external URLs to ensure they use valid http/https protocols.
 */
export function validateExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Normalizes search input strings (keyword/location) before querying adapters.
 */
export function normalizeSearchInput(raw: string | null | undefined, maxLength = 200): string {
  if (!raw) return "";
  
  // Unicode NFKC normalization, strip control chars (\x00-\x1F, \x7F-\x9F), collapse whitespace
  const normalized = raw
    .normalize("NFKC")
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.substring(0, maxLength);
}
