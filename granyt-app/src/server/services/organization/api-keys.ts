import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { generateApiKey } from "./helpers";
import type { ApiKeyGenerated, ApiKeyInfo } from "./types";
import { createLogger } from "@/lib/logger";
import { validateEnvironmentOwnership } from "./environments";

const logger = createLogger("ApiKeyService");

export async function createApiKey(
  prisma: PrismaClient,
  organizationId: string,
  name: string,
  type: string,
  environmentId: string | undefined
): Promise<ApiKeyGenerated> {
  let finalEnvironmentId = environmentId;

  // If no environment provided, find or create a default one
  if (!finalEnvironmentId) {
    const existingEnv = await prisma.environment.findFirst({
      where: { organizationId },
      orderBy: { isDefault: "desc" },
    });

    if (existingEnv) {
      finalEnvironmentId = existingEnv.id;
    } else {
      const newEnv = await prisma.environment.create({
        data: {
          organizationId,
          name: "production",
          isDefault: true,
        },
      });
      finalEnvironmentId = newEnv.id;
    }
  }

  await validateEnvironmentOwnership(prisma, finalEnvironmentId, organizationId);

  const { key, hash, prefix } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      organizationId,
      environmentId: finalEnvironmentId,
      type,
      name,
      keyHash: hash,
      keyPrefix: prefix,
    },
  });

  logger.info(
    { organizationId, type, environmentId: finalEnvironmentId, name, prefix },
    "API key created"
  );

  return { id: apiKey.id, key, prefix };
}

export async function listApiKeys(
  prisma: PrismaClient,
  organizationId: string
): Promise<ApiKeyInfo[]> {
  return prisma.apiKey.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      type: true,
      environmentId: true,
      lastUsedAt: true,
      createdAt: true,
      environment: { select: { id: true, name: true, isDefault: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteApiKey(
  prisma: PrismaClient,
  apiKeyId: string,
  userId: string
): Promise<void> {
  const apiKey = await prisma.apiKey.findUnique({ 
    where: { id: apiKeyId },
    select: { 
      id: true, 
      organizationId: true,
    }
  });

  if (!apiKey) {
    throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" });
  }

  // Verify membership and role before proceeding
  const membership = await prisma.organizationMember.findUnique({
    where: { 
      organizationId_userId: { 
        organizationId: apiKey.organizationId, 
        userId 
      } 
    },
  });

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    // Throw NOT_FOUND to avoid leaking existence of API keys in other orgs
    throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" });
  }

  await prisma.apiKey.delete({ where: { id: apiKeyId } });
}

export async function getApiKeyWithOrg(prisma: PrismaClient, apiKeyId: string) {
  const apiKey = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });

  if (!apiKey) {
    throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" });
  }

  return apiKey;
}
