# =====================================================
# Granyt App Production Dockerfile
# =====================================================
# Multi-stage build for optimized Next.js production image
# Using Node.js 22 LTS (Jod) with Alpine for minimal size
# =====================================================

# =========================
# Stage 1: Dependencies
# =========================
FROM node:22-alpine AS deps

# Install libc6-compat and OpenSSL for Alpine compatibility (required by Prisma)
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with clean cache
RUN  npm ci

# =========================
# Stage 2: Builder
# =========================
FROM node:22-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy prisma schema first (for generate)
COPY prisma ./prisma

# Copy package.json for prisma commands
COPY package.json ./

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# =========================
# Stage 3: Migrations
# =========================
FROM node:22-alpine AS migrations

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy dependencies and prisma files
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY migrations ./prisma/migrations
COPY package.json ./

# Default command for migrations
CMD ["npx", "prisma", "migrate", "deploy", "--schema=./prisma/schema.prisma"]

# =========================
# Stage 4: Runner (Production)
# =========================
FROM node:22-alpine AS runner

# Install OpenSSL for Prisma runtime and curl for healthchecks
RUN apk add --no-cache openssl curl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname to listen on all interfaces
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]
