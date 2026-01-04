import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GRANYT_MODE controls which parts of the app are accessible:
 * - APP (default): Only app functionality (dashboard, auth), blocks landing/docs/demo
 * - DOCS: Only landing page, docs, and demo - blocks app functionality
 * - DEV: Everything enabled
 */
type GranytMode = "APP" | "DOCS" | "DEV";

const DOCS_ROUTES = [
  "/", // Landing page (marketing)
  "/docs", // Documentation
  "/demo", // Demo page
  "/sitemap.xml"
];

const APP_ROUTES = [
  "/dashboard", // Main app functionality
  "/login", // Auth
  "/register", // Auth
  "/onboarding", // Onboarding flow
  "/api", // API routes
];

/**
 * Paths that should always be allowed (static assets, etc.)
 */
const ALWAYS_ALLOWED_PREFIXES = [
  "/_next", // Next.js internals
  "/favicon", // Favicon
  "/images", // Public images
];

function getGranytMode(): GranytMode {
  // Check both env vars for compatibility - prefer NEXT_PUBLIC for client/server consistency
  const mode = (process.env.NEXT_PUBLIC_GRANYT_MODE || process.env.GRANYT_MODE)?.toUpperCase();
  if (mode === "DOCS" || mode === "DEV") {
    return mode;
  }
  return "APP"; // Default
}

function matchesRoutes(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAlwaysAllowed(pathname: string): boolean {
  return ALWAYS_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const mode = getGranytMode();
  const { pathname } = request.nextUrl;

  // Always allow static assets
  if (isAlwaysAllowed(pathname)) {
    return NextResponse.next();
  }

  // DEV mode: allow everything
  if (mode === "DEV") {
    return NextResponse.next();
  }

  // APP mode: only app routes allowed
  if (mode === "APP") {
    if (matchesRoutes(pathname, APP_ROUTES)) {
      return NextResponse.next();
    }
    // Redirect docs/landing to dashboard
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // DOCS mode: only docs/landing/demo routes allowed
  if (mode === "DOCS") {
    if (matchesRoutes(pathname, DOCS_ROUTES)) {
      return NextResponse.next();
    }
    // Redirect app routes to landing page
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
