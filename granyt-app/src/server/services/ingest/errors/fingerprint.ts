import { createHash } from "crypto";

export interface StackFrame {
  filename: string;
  function: string;
  lineno: number;
  module?: string;
}

// Patterns to exclude from user code (library/framework code)
const EXCLUDED_PATTERNS = [
  "site-packages",
  "dist-packages",
  "lib/python",
  "python3.",
  "<frozen",
  "anaconda",
  "venv/",
  ".venv/",
  "granyt_sdk",
  "node_modules",
];

/**
 * Check if a filename represents user code (not library code)
 */
function isUserCode(filename: string): boolean {
  if (!filename) return false;
  return !EXCLUDED_PATTERNS.some((pattern) => filename.includes(pattern));
}

/**
 * Get the most relevant user frame from stacktrace.
 * Returns the deepest (most recent) frame that is user code.
 */
function getMostRelevantFrame(stacktrace?: StackFrame[]): StackFrame | null {
  if (!stacktrace || stacktrace.length === 0) return null;
  
  // Filter to user code frames
  const userFrames = stacktrace.filter((frame) => isUserCode(frame.filename));
  
  // Return the last (most recent) user frame
  return userFrames.length > 0 ? userFrames[userFrames.length - 1] : null;
}

/**
 * Normalizes the error message while preserving meaningful values.
 * 
 * Normalizes:
 * - UUIDs → <UUID>
 * - ISO timestamps → <TIMESTAMP>
 * - IP addresses → <IP>
 * - Email addresses → <EMAIL>
 * - Large numbers (IDs, timestamps) → <NUM>
 * 
 * Preserves:
 * - HTTP status codes (100-599)
 * - Exit codes (typically 0-255)
 * - Small contextually meaningful numbers
 * - Port numbers in certain contexts
 */
function normalizeMessage(message: string): string {
  return message
    // UUIDs
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      "<UUID>"
    )
    // ISO timestamps (2024-01-01T12:00:00 or 2024-01-01 12:00:00)
    .replace(/\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?\b/g, "<TIMESTAMP>")
    // IP addresses (IPv4)
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "<IP>")
    // Email addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "<EMAIL>")
    // File paths with user directories (normalize user-specific paths)
    .replace(/\/home\/[^\/\s]+/g, "/home/<USER>")
    .replace(/\/Users\/[^\/\s]+/g, "/Users/<USER>")
    .replace(/C:\\Users\\[^\\]+/gi, "C:\\Users\\<USER>")
    // AWS ARNs
    .replace(/arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d*:[^\s"']+/gi, "<ARN>")
    // S3 paths
    .replace(/s3:\/\/[^\s"']+/gi, "<S3_PATH>")
    // Preserve HTTP status codes but normalize other numbers
    // First, protect HTTP status patterns
    .replace(/\b(HTTP[\/\s]?\d\.\d\s+|status[:\s]+|code[:\s]+|error[:\s]+)(\d{3})\b/gi, "$1__HTTP_STATUS_$2__")
    // Protect port numbers in common patterns
    .replace(/\b(port[:\s]+|:\s*)(\d{2,5})\b/gi, "$1__PORT_$2__")
    // Normalize large numbers (likely IDs, timestamps in ms, etc.) - 6+ digits
    .replace(/\b\d{6,}\b/g, "<NUM>")
    // Normalize numbers that look like IDs (common patterns like user_id_123, id=456, #789)
    .replace(/([_=:#]id[_=:\s]*|[_=:#])(\d+)\b/gi, "$1<NUM>")
    // Restore protected patterns
    .replace(/__HTTP_STATUS_(\d{3})__/g, "$1")
    .replace(/__PORT_(\d+)__/g, "$1")
    // Truncate at a reasonable length
    .substring(0, 200);
}

/**
 * Generates a fingerprint for error grouping.
 * 
 * The fingerprint is based on:
 * 1. Exception type (e.g., "ValueError", "KeyError")
 * 2. Normalized error message (variable parts like IDs, timestamps normalized)
 * 3. Most relevant user code location (filename + line number) from stacktrace
 * 
 * This ensures that:
 * - Same error from same location = same fingerprint
 * - Same error from different locations = different fingerprints
 * - Variable values in messages don't affect grouping
 */
export function generateErrorFingerprint(
  exceptionType: string,
  message: string,
  stacktrace?: StackFrame[]
): string {
  const normalizedMessage = normalizeMessage(message);
  
  // Get the most relevant user frame for location-based grouping
  const relevantFrame = getMostRelevantFrame(stacktrace);
  
  // Build the fingerprint content
  let content = `${exceptionType}:${normalizedMessage}`;
  
  // Add location info if we have a relevant user frame
  if (relevantFrame) {
    // Use filename and line number for location
    // Normalize the filename to remove machine-specific prefixes
    const normalizedFilename = relevantFrame.filename
      .replace(/^.*?(?=\/(?:app|src|dags|plugins|tasks|jobs|scripts|lib)\/)/, "")
      .replace(/^.*?(?=[A-Za-z]:\\(?:app|src|dags|plugins|tasks|jobs|scripts|lib)\\)/, "");
    
    content += `@${normalizedFilename}:${relevantFrame.lineno}`;
  }
  
  return createHash("md5").update(content).digest("hex");
}
