/**
 * Extracts API key from request headers.
 * Supports both Bearer token and x-api-key header formats.
 */
export function extractApiKey(headers: Headers): string | null {
  const authHeader = headers.get("authorization");
  const bearerToken = authHeader?.replace("Bearer ", "");
  return bearerToken || headers.get("x-api-key");
}
