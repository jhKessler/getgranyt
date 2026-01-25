/**
 * Centralized environment color utilities
 *
 * This module provides consistent color styling for environment indicators
 * throughout the application. Each environment name maps to a fixed color.
 */

export type EnvironmentColorVariant = "default" | "muted" | "error"

interface EnvironmentColors {
  badge: string
  dot: string
}

// =============================================================================
// Pre-defined Environment Colors
// =============================================================================

const KNOWN_ENVIRONMENT_COLORS: Record<string, EnvironmentColors> = {
  production: {
    badge: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    dot: "bg-orange-500",
  },
  staging: {
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    dot: "bg-blue-500",
  },
  development: {
    badge: "bg-green-500/10 text-green-500 border-green-500/20",
    dot: "bg-green-500",
  },
  qa: {
    badge: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    dot: "bg-purple-500",
  },
  test: {
    badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    dot: "bg-yellow-500",
  },
  testing: {
    badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    dot: "bg-yellow-500",
  },
  sandbox: {
    badge: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    dot: "bg-cyan-500",
  },
  preview: {
    badge: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    dot: "bg-pink-500",
  },
}

// Aliases for common environment name variations
const ENVIRONMENT_ALIASES: Record<string, string> = {
  dev: "development",
  prod: "production",
}

// =============================================================================
// Dynamic Color Palette (for custom/unknown environments)
// =============================================================================

const DYNAMIC_COLOR_PALETTE: EnvironmentColors[] = [
  { badge: "bg-slate-500/10 text-slate-500 border-slate-500/20", dot: "bg-slate-500" },
  { badge: "bg-rose-500/10 text-rose-500 border-rose-500/20", dot: "bg-rose-500" },
  { badge: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", dot: "bg-indigo-500" },
  { badge: "bg-teal-500/10 text-teal-500 border-teal-500/20", dot: "bg-teal-500" },
  { badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", dot: "bg-emerald-500" },
  { badge: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20", dot: "bg-fuchsia-500" },
  { badge: "bg-violet-500/10 text-violet-500 border-violet-500/20", dot: "bg-violet-500" },
  { badge: "bg-sky-500/10 text-sky-500 border-sky-500/20", dot: "bg-sky-500" },
  { badge: "bg-lime-500/10 text-lime-500 border-lime-500/20", dot: "bg-lime-500" },
  { badge: "bg-amber-500/10 text-amber-500 border-amber-500/20", dot: "bg-amber-500" },
]

const DEFAULT_COLORS: EnvironmentColors = {
  badge: "bg-muted text-muted-foreground border-muted-foreground/20",
  dot: "bg-muted-foreground",
}

// =============================================================================
// Variant Overrides
// =============================================================================

const MUTED_STYLE = "bg-muted text-muted-foreground border-muted-foreground/20"

const ERROR_VARIANT_COLORS: Record<string, string> = {
  production: "bg-red-500/10 text-red-500 border-red-500/20",
  _default: "bg-orange-500/10 text-orange-500 border-orange-500/20",
}

// =============================================================================
// Helper Functions
// =============================================================================

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

function normalizeEnvironment(env: string): string {
  const lowered = env.toLowerCase().trim()
  return ENVIRONMENT_ALIASES[lowered] ?? lowered
}

function getColors(environment: string | null | undefined): EnvironmentColors {
  if (!environment) return DEFAULT_COLORS

  const normalized = normalizeEnvironment(environment)

  // Check known environments
  if (normalized in KNOWN_ENVIRONMENT_COLORS) {
    return KNOWN_ENVIRONMENT_COLORS[normalized]
  }

  // Generate consistent color from hash for custom environments
  const index = hashString(normalized) % DYNAMIC_COLOR_PALETTE.length
  return DYNAMIC_COLOR_PALETTE[index]
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Get badge classes for an environment
 */
export function getEnvironmentBadgeStyle(
  environment: string | null | undefined,
  variant: EnvironmentColorVariant = "default"
): string {
  // Muted variant ignores environment-specific colors
  if (variant === "muted") {
    return MUTED_STYLE
  }

  // Error variant has special handling
  if (variant === "error") {
    const normalized = environment ? normalizeEnvironment(environment) : ""
    if (normalized === "production") {
      return ERROR_VARIANT_COLORS.production
    }
    return ERROR_VARIANT_COLORS._default
  }

  // Default variant uses environment-specific colors
  return getColors(environment).badge
}

/**
 * Get dot/indicator color for an environment
 */
export function getEnvironmentDotColor(environment: string | null | undefined): string {
  return getColors(environment).dot
}

/**
 * Check if environment is a production environment
 */
export function isProductionEnvironment(environment: string | null | undefined): boolean {
  if (!environment) return false
  return normalizeEnvironment(environment) === "production"
}
