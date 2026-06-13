import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/jobs",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/auth/signin(.*)",
  "/auth/signup(.*)",
  "/auth/forgot-password(.*)",
  "/api/jobs(.*)",
  "/api/parse-resume(.*)",
  "/api/upload-resume(.*)",
  "/api/cron(.*)",
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
