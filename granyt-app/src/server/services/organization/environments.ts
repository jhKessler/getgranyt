import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { EnvironmentInfo } from "./types";
import { normalizeEnvironment } from "./helpers";

export async function listEnvironments(
  prisma: PrismaClient,
  organizationId: string
): Promise<EnvironmentInfo[]> {
  const environments = await prisma.environment.findMany({
    where: { organizationId },
    include: {
      _count: { select: { apiKeys: true } },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return environments.map((env) => ({
    id: env.id,
    name: env.name,
    isDefault: env.isDefault,
    apiKeyCount: env._count.apiKeys,
  }));
}

export async function createEnvironment(
  prisma: PrismaClient,
  organizationId: string,
  name: string
): Promise<{ id: string; name: string; isDefault: boolean }> {
  const normalizedName = normalizeEnvironment(name);
  const isDefault = await shouldEnvironmentBeDefault(prisma, organizationId);

  const environment = await prisma.environment.create({
    data: {
      organizationId,
      name: normalizedName,
      isDefault,
    },
    select: { id: true, name: true, isDefault: true },
  });

  return environment;
}

export async function shouldEnvironmentBeDefault(
  prisma: PrismaClient,
  organizationId: string
): Promise<boolean> {
  const existingEnvs = await prisma.environment.count({ where: { organizationId } });
  return existingEnvs === 0;
}

export async function setDefaultEnvironment(
  prisma: PrismaClient,
  organizationId: string,
  environmentId: string
): Promise<void> {
  await validateEnvironmentOwnership(prisma, environmentId, organizationId);

  await prisma.$transaction([
    prisma.environment.updateMany({
      where: { organizationId },
      data: { isDefault: false },
    }),
    prisma.environment.update({
      where: { id: environmentId },
      data: { isDefault: true },
    }),
  ]);
}

export async function deleteEnvironment(
  prisma: PrismaClient,
  environmentId: string,
  organizationId: string
): Promise<void> {
  const environment = await prisma.environment.findFirst({
    where: { id: environmentId, organizationId },
    include: { _count: { select: { apiKeys: true } } },
  });

  if (!environment) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Environment not found" });
  }

  if (environment._count.apiKeys > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot delete environment with existing API keys",
    });
  }

  await prisma.environment.delete({ where: { id: environmentId } });
}

export async function validateEnvironmentOwnership(
  prisma: PrismaClient,
  environmentId: string,
  organizationId: string
): Promise<void> {
  const environment = await prisma.environment.findUnique({
    where: { id: environmentId },
  });

  if (!environment || environment.organizationId !== organizationId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Environment not found" });
  }
}
