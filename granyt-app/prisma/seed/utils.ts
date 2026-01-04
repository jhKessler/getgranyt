import { scrypt, randomBytes, createHash } from "crypto";
import { promisify } from "util";
import { DagRunStatus, PrismaClient } from "@prisma/client";

const scryptAsync = promisify(scrypt);

/**
 * Replicate better-auth's default password hashing
 * Uses scrypt with default Node.js params: N=16384, r=8, p=1
 */
export async function hashPasswordBetterAuth(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Hash API key using SHA-256 (same as the app's API key generation)
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Generate a random API key with the given prefix
 */
export function generateApiKey(prefix: string): string {
  const randomPart = randomBytes(32).toString("hex");
  return `granyt_${prefix}_${randomPart}`;
}

/**
 * Generate a random secure password
 */
export function generateRandomPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  const bytes = randomBytes(16);
  for (let i = 0; i < 16; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

/**
 * Generate MD5 fingerprint for error grouping
 */
export function generateFingerprint(content: string): string {
  return createHash("md5").update(content).digest("hex");
}

/**
 * Generate random error ID
 */
export function generateErrorId(): string {
  return `err_${randomBytes(16).toString("hex")}`;
}

/**
 * Create a date that is N hours ago from now
 */
export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

/**
 * Create a date that is N minutes ago from now
 */
export function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

/**
 * Update DagRun status and endTime
 */
export async function updateDagRunStatus(
  prisma: PrismaClient,
  dagRunId: string,
  status: DagRunStatus,
  endTime?: Date
): Promise<void> {
  await prisma.dagRun.update({
    where: { id: dagRunId },
    data: {
      status,
      endTime: endTime ?? new Date(),
    },
  });
}
