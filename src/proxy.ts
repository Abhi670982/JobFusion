import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/company",
  "/privacy-policy",
  "/terms-of-service",
  "/refund-policy",
  "/cookie-policy",
  "/gdpr-compliance",
  "/gdpr-compliance(.*)",
  "/contact",
  "/api/contact(.*)",
  "/jobs",
  "/jobs/(.*)",
  "/about-us(.*)",
  "/privacy-policy(.*)",
  "/terms-of-service(.*)",
  "/cookie-policy(.*)",
  "/refund-policy(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/auth/signin(.*)",
  "/auth/signup(.*)",
  "/auth/forgot-password(.*)",
  "/sso-callback(.*)",
  "/api/webhooks(.*)",
  "/api/jobs(.*)",
  "/api/portal-jobs(.*)",
  "/pricing(.*)",
]);

const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
].filter(Boolean) as string[];

export default clerkMiddleware(async (auth, request) => {
  const origin = request.headers.get("origin");

  // Handle CORS preflight & origin check
  if (request.method === "OPTIONS") {
    const isAllowed = !origin || allowedOrigins.some((ao) => origin.startsWith(ao));
    const response = new NextResponse(null, { status: 204 });
    if (isAllowed && origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
    );
    return response;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const response = NextResponse.next();

  if (origin) {
    const isAllowed = allowedOrigins.some((ao) => origin.startsWith(ao));
    if (isAllowed) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};


