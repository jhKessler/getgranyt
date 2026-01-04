import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function setupE2ETestData() {
  const orgId = `test-org-${uuidv4()}`;
  const userId = `test-user-${uuidv4()}`;

  // Create user first
  const user = await prisma.user.create({
    data: {
      id: userId,
      name: "E2E Test User",
      email: `${userId}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create organization
  const org = await prisma.organization.create({
    data: {
      id: orgId,
      name: "E2E Test Org",
      slug: orgId,
      createdBy: userId,
    },
  });

  // Add user to organization
  await prisma.organizationMember.create({
    data: {
      organizationId: orgId,
      userId: userId,
      role: "admin",
    },
  });

  return {
    org,
    user,
    ctx: {
      prisma,
      session: {
        user: {
          id: userId,
          email: `${userId}@example.com`,
          name: "E2E Test User",
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: uuidv4(),
          userId: userId,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          token: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: "127.0.0.1",
          userAgent: "test",
        },
      },
      user: {
        id: userId,
        email: `${userId}@example.com`,
        name: "E2E Test User",
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  };
}

export async function cleanupE2ETestData(orgId: string, userId: string) {
  // Delete all organizations created by this user to avoid FK violations
  await prisma.organizationMember.deleteMany({ where: { userId } });
  
  const userOrgs = await prisma.organization.findMany({
    where: { createdBy: userId }
  });

  for (const org of userOrgs) {
    await prisma.alert.deleteMany({ where: { organizationId: org.id } });
    await prisma.metric.deleteMany({ where: { organizationId: org.id } });
    await prisma.errorOccurrence.deleteMany({ where: { organizationId: org.id } });
    await prisma.generalError.deleteMany({ where: { organizationId: org.id } });
    await prisma.taskRun.deleteMany({ where: { organizationId: org.id } });
    await prisma.dagRun.deleteMany({ where: { organizationId: org.id } });
    await prisma.dag.deleteMany({ where: { organizationId: org.id } });
    await prisma.apiKey.deleteMany({ where: { organizationId: org.id } });
    await prisma.environment.deleteMany({ where: { organizationId: org.id } });
    await prisma.organizationChannelConfig.deleteMany({ where: { organizationId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
  }

  await prisma.userNotificationSettings.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}
