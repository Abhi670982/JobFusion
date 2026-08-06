import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protected UI pages that require authentication and redirect guests to Sign In
const isProtectedUIRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/saved-jobs(.*)",
  "/jobs/saved(.*)",
  "/settings(.*)",
  "/profile(.*)",
  "/resume(.*)",
  "/applications(.*)",
  "/onboarding(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedUIRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};


