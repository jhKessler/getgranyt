import { prisma } from "@/lib/prisma";
import { hashApiKey } from "./hash-api-key";
import type { AuthResult } from "./types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("AuthService");

/**
 * Validates an API key and returns the associated organization.
 * Updates the last used timestamp on successful validation.
 */
export async function validateApiKey(apiKey: string | null): Promise<AuthResult> {
  if (!apiKey) {
    return { success: false, error: "API key required", status: 401 };
  }

  const keyHash = hashApiKey(apiKey);
  const apiKeyRecord = await findApiKeyByHash(keyHash);

  if (!apiKeyRecord) {
    logger.warn("Invalid API key attempt");
    return { success: false, error: "Invalid API key", status: 401 };
  }

  updateApiKeyUsage(apiKeyRecord.id);

  logger.debug(
    {
      organizationId: apiKeyRecord.organizationId,
      environment: apiKeyRecord.environment?.name,
    },
    "API key validated"
  );

  return {
    success: true,
    organization: apiKeyRecord.organization,
    apiKeyId: apiKeyRecord.id,
    environmentId: apiKeyRecord.environmentId,
    environmentName: apiKeyRecord.environment?.name ?? null,
  };
}

async function findApiKeyByHash(keyHash: string) {
  return prisma.apiKey.findUnique({
    where: { keyHash },
    include: { 
      organization: true,
      environment: { select: { id: true, name: true } },
    },
  });
}

function updateApiKeyUsage(apiKeyId: string): void {
  prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { lastUsedAt: new Date() },
  }).catch((error) => {
    logger.warn({ error: error instanceof Error ? error.message : "Unknown error", apiKeyId }, "Failed to update API key usage tracking");
  });
}
