/**
 * Bright Data Proxy Layer
 * Used strictly for proxy rotation, rate-limit bypassing, and automatic retries.
 * Implements detailed HTTP response inspection, CAPTCHA/anti-bot detection, and explicit diagnostic logging.
 */

export interface FetchWithProxyOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  initialBackoffMs?: number;
}

export interface ProxyDiagnosticResult {
  response: Response;
  html: string;
  htmlSize: number;
  isBlocked: boolean;
  blockReason?: string;
}

export async function fetchWithBrightDataProxy(
  url: string,
  options: FetchWithProxyOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 15000,
    maxRetries = 3,
    initialBackoffMs = 1000,
    headers = {},
    ...restOptions
  } = options;

  const apiKey = process.env.BRIGHTDATA_API_KEY || "";
  let attempt = 0;

  while (true) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const mergedHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      ...(headers as Record<string, string>),
    };

    if (apiKey) {
      mergedHeaders["X-BrightData-Key"] = apiKey;
      mergedHeaders["X-BrightData-Zone"] = "serp";
    }

    try {
      console.log(`[BrightData Proxy Attempt ${attempt}/${maxRetries}] Fetching ${url}`);

      const response = await fetch(url, {
        ...restOptions,
        headers: mergedHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check HTTP Status
      if ((response.status === 429 || response.status >= 500) && attempt <= maxRetries) {
        const backoff = initialBackoffMs * Math.pow(2, attempt - 1);
        console.warn(`[BrightData Proxy Warning] ${url} returned HTTP ${response.status}. Retrying in ${backoff}ms (attempt ${attempt}/${maxRetries})...`);
        await new Promise((res) => setTimeout(res, backoff));
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);

      const isTimeout = err.name === "AbortError";
      const errorReason = isTimeout ? `NETWORK_TIMEOUT (${timeoutMs}ms)` : err.message;

      if (attempt <= maxRetries) {
        const backoff = initialBackoffMs * Math.pow(2, attempt - 1);
        console.warn(`[BrightData Proxy Retry] ${url} failed (${errorReason}). Retrying in ${backoff}ms (attempt ${attempt}/${maxRetries})...`);
        await new Promise((res) => setTimeout(res, backoff));
        continue;
      }

      console.error(`[BrightData Proxy Failure] Request to ${url} failed after ${maxRetries} attempts: ${errorReason}`);
      throw new Error(`PROXY_FETCH_FAILED: ${errorReason}`);
    }
  }
}

/**
 * Inspects HTML content to detect CAPTCHAs, Cloudflare challenges, or login walls.
 */
export function inspectHtmlForAntiBot(html: string): { isBlocked: boolean; reason?: string } {
  if (!html || html.length < 200) {
    return { isBlocked: true, reason: "EMPTY_OR_TRUNCATED_RESPONSE" };
  }

  const lower = html.toLowerCase();
  if (lower.includes("cf-browser-verification") || lower.includes("cloudflare") || lower.includes("challenge-platform")) {
    return { isBlocked: true, reason: "CLOUDFLARE_CHALLENGE_BLOCKED" };
  }

  if (lower.includes("recaptcha") || lower.includes("g-recaptcha") || lower.includes("hcaptcha") || lower.includes("captcha-delivery")) {
    return { isBlocked: true, reason: "CAPTCHA_BLOCKED" };
  }

  if (lower.includes("access denied") || lower.includes("permission denied") || lower.includes("403 forbidden")) {
    return { isBlocked: true, reason: "ACCESS_DENIED_BLOCKED" };
  }

  return { isBlocked: false };
}
