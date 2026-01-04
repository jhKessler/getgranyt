/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "-"
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}
