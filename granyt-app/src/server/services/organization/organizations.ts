import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { generateSlug } from "./helpers";
import type { OrganizationWithRole } from "./types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("OrganizationService");

export async function listUserOrganizations(
  prisma: PrismaClient,
  userId: string
): Promise<OrganizationWithRole[]> {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: { _count: { select: { members: true } } },
      },
    },
  });

  return memberships.map((m) => ({
    ...m.organization,
    role: m.role,
    memberCount: m.organization._count.members,
  }));
}

export async function createOrganization(
  prisma: PrismaClient,
  userId: string,
  name: string,
  airflowUrl?: string
) {
  const slug = await resolveUniqueSlug(prisma, name);
  
  // Normalize airflow URL - remove trailing slash if present
  const normalizedAirflowUrl = airflowUrl?.trim().replace(/\/$/, "") || null;

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      airflowUrl: normalizedAirflowUrl,
      createdBy: userId,
      members: { create: { userId, role: "owner" } },
    },
  });

  logger.info({ organizationId: org.id, userId, slug }, "Organization created");

  return org;
}

async function resolveUniqueSlug(
  prisma: PrismaClient,
  name: string
): Promise<string> {
  const baseSlug = generateSlug(name);
  const existing = await prisma.organization.findUnique({
    where: { slug: baseSlug },
  });

  if (existing) {
    return `${baseSlug}-${randomBytes(4).toString("hex")}`;
  }

  return baseSlug;
}
