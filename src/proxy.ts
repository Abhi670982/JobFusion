import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
  "/api/parse-resume(.*)",
  "/api/upload-resume(.*)",
  "/api/cron(.*)",
  "/api/admin/track-visit(.*)",
  "/api/users(.*)",
  "/api/profile(.*)",
  "/api/dashboard(.*)",
  "/api/applications(.*)",
  "/api/saved-jobs(.*)",
  "/api/suggestions(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
