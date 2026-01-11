import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { env } from "@/env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * GRANYT_MODE controls URL behavior for docs:
 * - APP: Points to external https://granyt.dev/docs with tracking param
 * - DOCS/DEV: Points to relative /docs paths
 */
type GranytMode = "APP" | "DOCS" | "DEV";

export function getGranytMode(): GranytMode {
  // In test environment with skipped validation, read directly from process.env
  // Otherwise use the validated env object
  const mode = (process.env.SKIP_ENV_VALIDATION 
    ? process.env.NEXT_PUBLIC_GRANYT_MODE 
    : env.NEXT_PUBLIC_GRANYT_MODE)?.toUpperCase();
  if (mode === "DOCS" || mode === "DEV") {
    return mode;
  }
  return "APP"; // Default
}

/**
 * Returns the appropriate docs URL based on GRANYT_MODE.
 * In APP mode: returns external URL (using NEXT_PUBLIC_DOCS_URL if absolute, else granyt.dev) with utm_source tracking
 * In DOCS/DEV mode: returns relative path (/docs/...)
 * 
 * @param path - The docs path (e.g., "/docs/webhooks" or "webhooks")
 * @param source - Optional custom source identifier for tracking (defaults to "app")
 * @returns The full URL or relative path
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
  // If NEXT_PUBLIC_DOCS_URL is an absolute URL, use it as base.
  // Otherwise default to https://granyt.dev
  const docsUrl = env.NEXT_PUBLIC_DOCS_URL || "/docs";
  const isExternal = docsUrl.startsWith("http");
  
  // If external, extract origin and ensure we don't have double /docs
  const baseUrl = isExternal ? docsUrl : "https://granyt.dev/docs";
  const baseObj = new URL(baseUrl);
  const origin = baseObj.origin;
  
  // If the docsUrl itself has a path (like /docs), URL constructor handles it
  const url = new URL(normalizedPath, origin);
  url.searchParams.set("utm_source", source);
  return url.toString();
}
