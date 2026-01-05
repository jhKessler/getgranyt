import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { APIError } from "better-auth/api";
import { env } from "@/env";

const scryptAsync = promisify(scrypt);

// Custom password hashing that matches our seed file format
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  const [salt, key] = hash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(keyBuffer, derivedKey);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          const userCount = await prisma.user.count();
          if (userCount > 0) {
            throw new APIError("BAD_REQUEST", {
              message: "Registration is disabled. Only one user is allowed.",
            });
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  trustedOrigins: [
    env.BETTER_AUTH_URL,
  ],
});
