import { createHash, randomBytes } from "crypto";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `granyt_${randomBytes(32).toString("hex")}`;
  const hash = createHash("sha256").update(key).digest("hex");
  const prefix = key.substring(0, 14);
  return { key, hash, prefix };
}

export function normalizeEnvironment(env: string): string {
  const normalized = env.toLowerCase().trim();
  if (normalized === "prod") return "production";
  if (normalized === "dev") return "development";
  return normalized;
}
