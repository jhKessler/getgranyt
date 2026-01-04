import { PrismaClient } from "@prisma/client";
import { seedUserAndOrganization } from "./user-organization";
import { seedApiKeys } from "./api-keys";
import { cleanupExistingData } from "./cleanup";
import {
  seedUserAnalyticsDAG,
  seedSalesEtlDAG,
  seedSchemaEvolutionDAG,
  seedMlTrainingDAG,
  seedSharedErrorDAGs,
  seedInventorySyncDAG,
  seedDailyReportDAG,
  seedPaymentProcessingDAG,
  seedExternalApiSyncDAG,
  seedDataWarehouseLoadDAG,
} from "./dags";
import { computeDAGMetrics } from "./dag-metrics";
import { seedAlerts } from "./alerts";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // Step 1: Create user and organization
  const { organization } = await seedUserAndOrganization(prisma);

  // Step 2: Create environments and API keys
  await seedApiKeys(prisma, organization.id);

  // Step 3: Clean up existing data metrics data for re-seeding
  await cleanupExistingData(prisma, organization.id);

  // Step 4: Seed all DAGs
  console.log("\n📈 Seeding DAGs...\n");
  
  await seedUserAnalyticsDAG(prisma, organization.id);
  await seedSalesEtlDAG(prisma, organization.id);
  await seedSchemaEvolutionDAG(prisma, organization.id);
  await seedMlTrainingDAG(prisma, organization.id);
  await seedSharedErrorDAGs(prisma, organization.id);
  await seedInventorySyncDAG(prisma, organization.id);
  await seedDailyReportDAG(prisma, organization.id);
  await seedPaymentProcessingDAG(prisma, organization.id);
  await seedExternalApiSyncDAG(prisma, organization.id);
  await seedDataWarehouseLoadDAG(prisma, organization.id);

  // Step 5: Compute DAG metrics
  await computeDAGMetrics(prisma, organization.id);

  // Step 6: Seed sample alerts
  await seedAlerts(prisma, organization.id);

  console.log("\n🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
