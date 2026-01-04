import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export async function checkMembership(
  prisma: PrismaClient,
  organizationId: string,
  userId: string,
  requiredRoles?: string[]
) {
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this organization",
    });
  }

  if (requiredRoles && !requiredRoles.includes(membership.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have permission for this action",
    });
  }

  return membership;
}
