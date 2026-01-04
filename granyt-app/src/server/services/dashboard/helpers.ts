import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { subDays, subHours } from "date-fns";
import type { Timeframe } from "./types";

export function getStartDate(timeframe: Timeframe): Date | null {
  const now = new Date();

  if (timeframe === "24h") {
    return subHours(now, 24);
  }

  if (timeframe === "7d") {
    return subDays(now, 7);
  }

  if (timeframe === "28d") {
    return subDays(now, 28);
  }

  // "all" timeframe - return null to indicate no date filter
  return null;
}

export async function getUserOrganization(
  prisma: PrismaClient,
  userId: string,
  organizationId?: string
) {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      ...(organizationId ? { organizationId } : {}),
    },
    include: { organization: true },
  });

  if (!membership) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: organizationId
        ? "Organization not found or you are not a member"
        : "No organization found",
    });
  }

  return membership.organization;
}

/**
 * Returns the environment filter value for use in Prisma where clauses.
 * If environment is null (all environments), returns undefined to not filter.
 */
export function getEnvironmentFilter(environment: string | null): string | undefined {
  return environment ?? undefined;
}

export async function getDefaultEnvironment(
  prisma: PrismaClient,
  orgId: string
): Promise<string | null> {
  const defaultEnv = await prisma.environment.findFirst({
    where: { organizationId: orgId, isDefault: true },
    select: { name: true },
  });

  return defaultEnv?.name ?? null;
}
