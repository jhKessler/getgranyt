import { createHash } from "crypto";

/**
 * Hashes an API key using SHA-256.
 */
export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}
