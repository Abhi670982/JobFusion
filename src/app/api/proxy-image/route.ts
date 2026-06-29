import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");
  const company = searchParams.get("company") || "Job";
  const color = searchParams.get("color") || "#6366f1";
  const firstLetter = company.charAt(0).toUpperCase() || "J";

  // Helper to return a beautiful fallback SVG as status 200
  const getFallbackSvgResponse = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="44" fill="#ffffff" dominant-baseline="middle" text-anchor="middle">${firstLetter}</text>
    </svg>`;

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Access-Control-Allow-Origin": "*",
      },
    });
  };

  if (!imageUrl) {
    return getFallbackSvgResponse();
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return getFallbackSvgResponse();
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return getFallbackSvgResponse();
  }

  try {
    // Fetch image server-side — no CORP restriction on server-to-server requests
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      // 5-second timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`[Image Proxy] Upstream returned status ${res.status} for ${imageUrl}. Serving SVG fallback.`);
      return getFallbackSvgResponse();
    }

    const contentType = res.headers.get("content-type") || "image/png";
    // Only proxy image content types
    if (!contentType.startsWith("image/")) {
      return getFallbackSvgResponse();
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 1 hour on client, 24h on CDN
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        // Allow cross-origin embedding
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[Image Proxy] Error fetching image, serving SVG fallback:", err?.message || err);
    return getFallbackSvgResponse();
  }
}

