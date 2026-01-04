import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupE2ETestData, cleanupE2ETestData } from "./helpers";
import { organizationRouter } from "@/server/routers/organization";
import { prisma } from "@/lib/prisma";

describe("E2E: Organization Flow", () => {
  let testData: Awaited<ReturnType<typeof setupE2ETestData>>;

  beforeAll(async () => {
    testData = await setupE2ETestData();
  });

  afterAll(async () => {
    await cleanupE2ETestData(testData.org.id, testData.user.id);
  });

  it("should manage organizations, environments and API keys", async () => {
    const { ctx, user } = testData;
    const caller = organizationRouter.createCaller(ctx as any);

    // 1. List organizations - should include the one from setup
    const orgs = await caller.list();
    expect(orgs.some(o => o.id === testData.org.id)).toBe(true);

    // 2. Create a new organization
    const newOrgName = "Secondary Test Org";
    const newOrg = await caller.create({ name: newOrgName });
    expect(newOrg.name).toBe(newOrgName);

    // 3. Create an environment in the new org
    const env = await caller.createEnvironment({
      organizationId: newOrg.id,
      name: "staging",
    });
    expect(env.name).toBe("staging");

    // 4. List environments
    const envs = await caller.listEnvironments({ organizationId: newOrg.id });
    expect(envs.some(e => e.id === env.id)).toBe(true);

    // 5. Generate an API key for the environment with type
    const apiKey = await caller.generateApiKey({
      organizationId: newOrg.id,
      name: "Staging Key",
      type: "airflow",
      environmentId: env.id,
    });
    expect(apiKey.key).toBeDefined();

    // 6. List API keys
    const keys = await caller.listApiKeys({ organizationId: newOrg.id });
    const foundKey = keys.find(k => k.id === apiKey.id);
    expect(foundKey).toBeDefined();
    expect(foundKey?.name).toBe("Staging Key");
    expect(foundKey?.type).toBe("airflow");

    // 7. Delete API key
    await caller.deleteApiKey({ id: apiKey.id });
    const keysAfterDelete = await caller.listApiKeys({ organizationId: newOrg.id });
    expect(keysAfterDelete.some(k => k.id === apiKey.id)).toBe(false);

    // Cleanup the secondary org
    await prisma.apiKey.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.environment.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organizationMember.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organization.delete({ where: { id: newOrg.id } });
  });
});
