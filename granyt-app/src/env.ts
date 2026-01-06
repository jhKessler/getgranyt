import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * T3 Env - Type-safe environment variable validation
 * 
 * This file validates all environment variables at build/runtime.
 * Import `env` from this file instead of using `process.env` directly.
 * 
 * Variables are grouped by:
 * - Core: Required for the app to function
 * - Client: Exposed to the browser (NEXT_PUBLIC_*)
 * - SMTP: Optional email via SMTP
 * - Resend: Optional email via Resend API
 * - Webhook: Optional webhook notifications
 */

export const env = createEnv({
  /**
   * Server-side environment variables schema.
   * These are never exposed to the client.
   */
  server: {
    // ==================== Core ====================
    DATABASE_URL: z.string().url().describe("PostgreSQL connection string").optional(),
    BETTER_AUTH_SECRET: z.string().min(16).describe("Auth secret key (min 16 chars)").optional(), // not needed during build time
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3000").describe("Auth trusted origin URL"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    
    // ==================== Deployment ====================
    PORT: z.coerce.number().default(3000).describe("Application port"),
    VERCEL_URL: z.string().optional().describe("Auto-set by Vercel deployments"),
    LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).optional().describe("Pino log level"),
    
    // ==================== App Mode ====================
    GRANYT_MODE: z.enum(["APP", "DOCS", "DEV", "app", "docs", "dev"]).optional().describe("Server-side fallback for NEXT_PUBLIC_GRANYT_MODE"),
    
    // ==================== SMTP (Optional) ====================
    SMTP_HOST: z.string().optional().describe("SMTP server host"),
    SMTP_PORT: z.coerce.number().optional().describe("SMTP server port"),
    SMTP_USER: z.string().optional().describe("SMTP username"),
    SMTP_PASSWORD: z.string().optional().describe("SMTP password"),
    SMTP_FROM_EMAIL: z.string().email().optional().describe("Sender email address"),
    SMTP_FROM_NAME: z.string().optional().describe("Sender display name"),
    SMTP_SECURE: z.enum(["true", "false"]).optional().describe("Use TLS/SSL"),
    
    // ==================== Resend (Optional) ====================
    GRANYT_RESEND_API_KEY: z.string().optional().describe("Resend API key"),
    RESEND_FROM_EMAIL: z.string().email().optional().describe("Resend sender email"),
    RESEND_FROM_NAME: z.string().optional().describe("Resend sender name"),
    
    // ==================== Webhook (Optional) ====================
    GRANYT_WEBHOOK_URL: z.string().url().optional().describe("Webhook endpoint URL"),
    GRANYT_WEBHOOK_SECRET: z.string().optional().describe("Webhook signing secret"),
    
    // ==================== Development/Seed (Optional) ====================
    SEED_ADMIN_PASSWORD: z.string().optional().describe("Admin password for db:seed"),
  },

  /**
   * Client-side environment variables schema.
   * Must be prefixed with NEXT_PUBLIC_ and are exposed to the browser.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional().describe("Public app URL for dashboard links"),
    NEXT_PUBLIC_GRANYT_MODE: z.enum(["APP", "DOCS", "DEV", "app", "docs", "dev"]).optional().describe("App mode: APP, DOCS, or DEV"),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional().describe("PostHog analytics API key"),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional().describe("PostHog host URL"),
    NEXT_PUBLIC_GITHUB_URL: z.string().url().optional().describe("GitHub repository URL"),
    NEXT_PUBLIC_DOCS_URL: z.string().default("/docs").describe("Base URL for documentation links (e.g. '/docs' or 'https://docs.granyt.dev')"),
  },

  /**
   * Runtime environment variables.
   * Destructure from `process.env` to include in the validation.
   */
  runtimeEnv: {
    // Core
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
    
    // Deployment
    PORT: process.env.PORT,
    VERCEL_URL: process.env.VERCEL_URL,
    LOG_LEVEL: process.env.LOG_LEVEL,
    
    // App Mode
    GRANYT_MODE: process.env.GRANYT_MODE,
    
    // SMTP
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
    SMTP_SECURE: process.env.SMTP_SECURE,
    
    // Resend
    GRANYT_RESEND_API_KEY: process.env.GRANYT_RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
    
    // Webhook
    GRANYT_WEBHOOK_URL: process.env.GRANYT_WEBHOOK_URL,
    GRANYT_WEBHOOK_SECRET: process.env.GRANYT_WEBHOOK_SECRET,
    
    // Development
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
    
    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GRANYT_MODE: process.env.NEXT_PUBLIC_GRANYT_MODE,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_GITHUB_URL: process.env.NEXT_PUBLIC_GITHUB_URL,
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
  },

  /**
   * Skip validation in certain environments.
   * Set SKIP_ENV_VALIDATION=1 to skip validation (useful for Docker builds).
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined.
   * Useful for optional variables that might be set to "" in .env files.
   */
  emptyStringAsUndefined: true,
});
