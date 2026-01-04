import { PrismaClient } from "@prisma/client";
import { hashApiKey, generateApiKey } from "./utils";

export interface ApiKeysResult {
  prodEnvironment: Awaited<ReturnType<PrismaClient["environment"]["upsert"]>>;
  devEnvironment: Awaited<ReturnType<PrismaClient["environment"]["upsert"]>>;
  stagingEnvironment: Awaited<ReturnType<PrismaClient["environment"]["upsert"]>>;
  apiKeys: {
    dev: string;
    prod: string;
    staging: string;
  };
}

/**
 * Seeds the environments and API keys
 */
export async function seedApiKeys(
  prisma: PrismaClient,
  organizationId: string
): Promise<ApiKeysResult> {
  console.log("🔑 Seeding environments and API keys...");

  // Create environments for the organization
  // Note: "production" is set as the default environment (the primary/main environment)
  const prodEnvironment = await prisma.environment.upsert({
    where: {
      organizationId_name: {
        organizationId,
        name: "production",
      },
    },
    update: { isDefault: true },
    create: {
      organizationId,
      name: "production",
      isDefault: true,
    },
  });

  const devEnvironment = await prisma.environment.upsert({
    where: {
      organizationId_name: {
        organizationId,
        name: "development",
      },
    },
    update: { isDefault: false },
    create: {
      organizationId,
      name: "development",
      isDefault: false,
    },
  });

  const stagingEnvironment = await prisma.environment.upsert({
    where: {
      organizationId_name: {
        organizationId,
        name: "staging",
      },
    },
    update: { isDefault: false },
    create: {
      organizationId,
      name: "staging",
      isDefault: false,
    },
  });

  // Create API keys (generated randomly for security)
  const devApiKeyValue = generateApiKey("dev");
  const devKeyHash = hashApiKey(devApiKeyValue);
  const devKeyPrefix = devApiKeyValue.substring(0, 14);

  await prisma.apiKey.upsert({
    where: { keyHash: devKeyHash },
    update: {},
    create: {
      organizationId,
      environmentId: devEnvironment.id,
      type: "airflow",
      name: "Airflow Dev API Key",
      keyHash: devKeyHash,
      keyPrefix: devKeyPrefix,
    },
  });

  const prodApiKeyValue = generateApiKey("prod");
  const prodKeyHash = hashApiKey(prodApiKeyValue);
  const prodKeyPrefix = prodApiKeyValue.substring(0, 14);

  await prisma.apiKey.upsert({
    where: { keyHash: prodKeyHash },
    update: {},
    create: {
      organizationId,
      environmentId: prodEnvironment.id,
      type: "airflow",
      name: "Airflow Prod API Key",
      keyHash: prodKeyHash,
      keyPrefix: prodKeyPrefix,
    },
  });

  const stagingApiKeyValue = generateApiKey("stag");
  const stagingKeyHash = hashApiKey(stagingApiKeyValue);
  const stagingKeyPrefix = stagingApiKeyValue.substring(0, 14);

  await prisma.apiKey.upsert({
    where: { keyHash: stagingKeyHash },
    update: {},
    create: {
      organizationId,
      environmentId: stagingEnvironment.id,
      type: "airflow",
      name: "Airflow Staging API Key",
      keyHash: stagingKeyHash,
      keyPrefix: stagingKeyPrefix,
    },
  });

  console.log("✅ Created environments: production (default), development, staging");
  console.log("✅ Created API keys (save these, they won't be shown again!):");
  console.log(`   Dev Key:     ${devApiKeyValue}`);
  console.log(`   Prod Key:    ${prodApiKeyValue}`);
  console.log(`   Staging Key: ${stagingApiKeyValue}`);

  return {
    prodEnvironment,
    devEnvironment,
    stagingEnvironment,
    apiKeys: {
      dev: devApiKeyValue,
      prod: prodApiKeyValue,
      staging: stagingApiKeyValue,
    },
  };
}
