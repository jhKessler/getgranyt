import type { PrismaClient } from "@prisma/client";
import type { PendingInvitation } from "./types";

/**
 * Lists all pending (not accepted, not revoked, not expired) invitations for an organization.
 */
export async function listPendingInvitations(
  prisma: PrismaClient,
  organizationId: string
): Promise<PendingInvitation[]> {
  const invitations = await prisma.invitation.findMany({
    where: {
      organizationId,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
    inviter: inv.inviter,
  }));
}
