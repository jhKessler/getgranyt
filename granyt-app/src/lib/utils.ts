import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * GRANYT_MODE controls URL behavior for docs:
 * - APP: Points to external https://granyt.dev/docs with tracking param
 * - DOCS/DEV: Points to relative /docs paths
 */
type GranytMode = "APP" | "DOCS" | "DEV";

const EXTERNAL_DOCS_BASE_URL = "https://granyt.dev";

function getGranytMode(): GranytMode {
  const mode = process.env.NEXT_PUBLIC_GRANYT_MODE?.toUpperCase();
  if (mode === "DOCS" || mode === "DEV") {
    return mode;
  }
  return "APP"; // Default
}

/**
 * Returns the appropriate docs URL based on GRANYT_MODE.
 * In APP mode: returns external URL (https://granyt.dev/docs/...) with utm_source tracking
 * In DOCS/DEV mode: returns relative path (/docs/...)
 * 
 * @param path - The docs path (e.g., "/docs/webhooks" or "webhooks")
 * @param source - Optional custom source identifier for tracking (defaults to "app")
 * @returns The full URL or relative path
 * 
 * @example
 * getDocsLink("/docs/webhooks") // APP mode: "https://granyt.dev/docs/webhooks?utm_source=app"
 * getDocsLink("webhooks") // APP mode: "https://granyt.dev/docs/webhooks?utm_source=app"
 * getDocsLink("/docs/webhooks", "dashboard") // APP mode: "https://granyt.dev/docs/webhooks?utm_source=dashboard"
 */
export function getDocsLink(path: string = "", source: string = "app"): string {
  const mode = getGranytMode();
  
  // Normalize path - ensure it starts with /docs
  let normalizedPath = path.startsWith("/docs") 
    ? path 
    : path.startsWith("/") 
      ? `/docs${path}` 
      : `/docs/${path}`;
  
  // Remove trailing slash for consistency
  normalizedPath = normalizedPath.replace(/\/$/, "");
  
  // Handle empty path case
  if (normalizedPath === "/docs/") {
    normalizedPath = "/docs";
  }

  // In DOCS or DEV mode, return relative path
  if (mode === "DOCS" || mode === "DEV") {
    return normalizedPath;
  }

  // In APP mode, return external URL with tracking
  const url = new URL(normalizedPath, EXTERNAL_DOCS_BASE_URL);
  url.searchParams.set("utm_source", source);
  return url.toString();
}
