import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupE2ETestData, cleanupE2ETestData } from "./helpers";
import { organizationRouter } from "@/server/routers/organization";
import { prisma } from "@/lib/prisma";

describe("E2E: Environment Airflow URL", () => {
  let testData: Awaited<ReturnType<typeof setupE2ETestData>>;

  beforeAll(async () => {
    testData = await setupE2ETestData();
  });

  afterAll(async () => {
    await cleanupE2ETestData(testData.org.id, testData.user.id);
  });

  it("should create environment with airflow URL", async () => {
    const { ctx } = testData;
    const caller = organizationRouter.createCaller(ctx as any);

    // Create a new organization for this test
    const newOrg = await caller.create({ name: "Airflow URL Test Org" });

    // Create environment with airflow URL
    const env = await caller.createEnvironment({
      organizationId: newOrg.id,
      name: "production",
      airflowUrl: "https://airflow.example.com",
    });

    expect(env.name).toBe("production");
    expect(env.airflowUrl).toBe("https://airflow.example.com");

    // Cleanup
    await prisma.environment.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organizationMember.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organization.delete({ where: { id: newOrg.id } });
  });

  it("should create environment without airflow URL", async () => {
    const { ctx } = testData;
    const caller = organizationRouter.createCaller(ctx as any);

    const newOrg = await caller.create({ name: "No Airflow URL Test Org" });

    const env = await caller.createEnvironment({
      organizationId: newOrg.id,
      name: "staging",
    });

    expect(env.name).toBe("staging");
    expect(env.airflowUrl).toBeNull();

    // Cleanup
    await prisma.environment.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organizationMember.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organization.delete({ where: { id: newOrg.id } });
  });

  it("should normalize airflow URL by removing trailing slash", async () => {
    const { ctx } = testData;
    const caller = organizationRouter.createCaller(ctx as any);

    const newOrg = await caller.create({ name: "Trailing Slash Test Org" });

    const env = await caller.createEnvironment({
      organizationId: newOrg.id,
      name: "dev",
      airflowUrl: "https://airflow.example.com/",
    });

    expect(env.airflowUrl).toBe("https://airflow.example.com");

    // Cleanup
    await prisma.environment.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organizationMember.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organization.delete({ where: { id: newOrg.id } });
  });

  it("should list environments with airflow URLs", async () => {
    const { ctx } = testData;
    const caller = organizationRouter.createCaller(ctx as any);

    const newOrg = await caller.create({ name: "List Envs Test Org" });

    // Create multiple environments with different airflow URLs
    await caller.createEnvironment({
      organizationId: newOrg.id,
      name: "production",
      airflowUrl: "https://prod-airflow.example.com",
    });

    await caller.createEnvironment({
      organizationId: newOrg.id,
      name: "staging",
      airflowUrl: "https://staging-airflow.example.com",
    });

    await caller.createEnvironment({
      organizationId: newOrg.id,
      name: "development",
      // No airflow URL
    });

    const envs = await caller.listEnvironments({ organizationId: newOrg.id });

    expect(envs).toHaveLength(3);

    const prodEnv = envs.find((e) => e.name === "production");
    expect(prodEnv?.airflowUrl).toBe("https://prod-airflow.example.com");

    const stagingEnv = envs.find((e) => e.name === "staging");
    expect(stagingEnv?.airflowUrl).toBe("https://staging-airflow.example.com");

    const devEnv = envs.find((e) => e.name === "development");
    expect(devEnv?.airflowUrl).toBeNull();

    // Cleanup
    await prisma.environment.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organizationMember.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organization.delete({ where: { id: newOrg.id } });
  });

  it("should update environment airflow URL", async () => {
    const { ctx } = testData;
    const caller = organizationRouter.createCaller(ctx as any);

    const newOrg = await caller.create({ name: "Update URL Test Org" });

    // Create environment without airflow URL
    const env = await caller.createEnvironment({
      organizationId: newOrg.id,
      name: "production",
    });

    expect(env.airflowUrl).toBeNull();

    // Update the airflow URL
    await caller.updateEnvironmentAirflowUrl({
      organizationId: newOrg.id,
      environmentId: env.id,
      airflowUrl: "https://new-airflow.example.com",
    });

    // Verify the update
    const envs = await caller.listEnvironments({ organizationId: newOrg.id });
    const updatedEnv = envs.find((e) => e.id === env.id);
    expect(updatedEnv?.airflowUrl).toBe("https://new-airflow.example.com");

    // Cleanup
    await prisma.environment.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organizationMember.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organization.delete({ where: { id: newOrg.id } });
  });

  it("should clear environment airflow URL", async () => {
    const { ctx } = testData;
    const caller = organizationRouter.createCaller(ctx as any);

    const newOrg = await caller.create({ name: "Clear URL Test Org" });

    // Create environment with airflow URL
    const env = await caller.createEnvironment({
      organizationId: newOrg.id,
      name: "production",
      airflowUrl: "https://airflow.example.com",
    });

    expect(env.airflowUrl).toBe("https://airflow.example.com");

    // Clear the airflow URL by passing empty string
    await caller.updateEnvironmentAirflowUrl({
      organizationId: newOrg.id,
      environmentId: env.id,
      airflowUrl: "",
    });

    // Verify the URL is cleared
    const envs = await caller.listEnvironments({ organizationId: newOrg.id });
    const updatedEnv = envs.find((e) => e.id === env.id);
    expect(updatedEnv?.airflowUrl).toBeNull();

    // Cleanup
    await prisma.environment.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organizationMember.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organization.delete({ where: { id: newOrg.id } });
  });

  it("should normalize URL when updating", async () => {
    const { ctx } = testData;
    const caller = organizationRouter.createCaller(ctx as any);

    const newOrg = await caller.create({ name: "Normalize Update Test Org" });

    const env = await caller.createEnvironment({
      organizationId: newOrg.id,
      name: "production",
    });

    // Update with URL that has trailing slash
    await caller.updateEnvironmentAirflowUrl({
      organizationId: newOrg.id,
      environmentId: env.id,
      airflowUrl: "https://airflow.example.com/",
    });

    // Verify trailing slash is removed
    const envs = await caller.listEnvironments({ organizationId: newOrg.id });
    const updatedEnv = envs.find((e) => e.id === env.id);
    expect(updatedEnv?.airflowUrl).toBe("https://airflow.example.com");

    // Cleanup
    await prisma.environment.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organizationMember.deleteMany({ where: { organizationId: newOrg.id } });
    await prisma.organization.delete({ where: { id: newOrg.id } });
  });

  it("should not allow updating airflow URL for environment in different org", async () => {
    const { ctx } = testData;
    const caller = organizationRouter.createCaller(ctx as any);

    // Create two organizations
    const org1 = await caller.create({ name: "Org 1" });
    const org2 = await caller.create({ name: "Org 2" });

    // Create environment in org1
    const env = await caller.createEnvironment({
      organizationId: org1.id,
      name: "production",
    });

    // Try to update environment from org1 using org2's ID (should fail)
    await expect(
      caller.updateEnvironmentAirflowUrl({
        organizationId: org2.id,
        environmentId: env.id,
        airflowUrl: "https://hacker.com",
      })
    ).rejects.toThrow();

    // Cleanup
    await prisma.environment.deleteMany({ where: { organizationId: org1.id } });
    await prisma.environment.deleteMany({ where: { organizationId: org2.id } });
    await prisma.organizationMember.deleteMany({ where: { organizationId: org1.id } });
    await prisma.organizationMember.deleteMany({ where: { organizationId: org2.id } });
    await prisma.organization.delete({ where: { id: org1.id } });
    await prisma.organization.delete({ where: { id: org2.id } });
  });
});
