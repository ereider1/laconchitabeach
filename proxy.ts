import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Everything under /portal (the resident intranet) and its API routes
// requires a signed-in resident. Marketing pages stay public.
const isProtectedRoute = createRouteMatcher([
  "/portal(.*)",
  "/api/announcements(.*)",
  "/api/maintenance(.*)",
  "/api/directory(.*)",
  "/api/events(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
