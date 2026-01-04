import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupE2ETestData, cleanupE2ETestData } from "./helpers";
import { organizationRouter } from "@/server/routers/organization";
import { prisma } from "@/lib/prisma";

describe("E2E: Onboarding Flow", () => {
  let testData: Awaited<ReturnType<typeof setupE2ETestData>>;

  beforeAll(async () => {
    testData = await setupE2ETestData();
  });

  afterAll(async () => {
    await cleanupE2ETestData(testData.org.id, testData.user.id);
  });

  it("should complete the full onboarding flow", async () => {
    const { ctx } = testData;
    const orgCaller = organizationRouter.createCaller(ctx as any);

    // Step 1: Create Organization
    const orgName = "Onboarding Test Org";
    const org = await orgCaller.create({ name: orgName });
    expect(org.name).toBe(orgName);
    expect(org.id).toBeDefined();

    // Step 2: Generate API Key with type
    const apiKey = await orgCaller.generateApiKey({
      organizationId: org.id,
      name: "airflow-api-key",
      type: "airflow",
    });
    expect(apiKey.key).toBeDefined();
    expect(apiKey.id).toBeDefined();

    // Verify the setup in DB
    const dbOrg = await prisma.organization.findUnique({ where: { id: org.id } });
    expect(dbOrg).toBeDefined();

    const dbApiKey = await prisma.apiKey.findUnique({ where: { id: apiKey.id } });
    expect(dbApiKey).toBeDefined();
    expect(dbApiKey?.name).toBe("airflow-api-key");
    expect(dbApiKey?.type).toBe("airflow");

    // Cleanup
    await prisma.apiKey.deleteMany({ where: { organizationId: org.id } });
    await prisma.environment.deleteMany({ where: { organizationId: org.id } });
    await prisma.organizationMember.deleteMany({ where: { organizationId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
  });
});
