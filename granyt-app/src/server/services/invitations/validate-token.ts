import type { PrismaClient } from "@prisma/client";
import { timingSafeEqual } from "crypto";
import type { ValidatedInvitation } from "./types";

/**
 * Validates an invitation token and returns invitation details if valid.
 * Uses constant-time comparison to prevent timing attacks.
 * Returns null for invalid, expired, revoked, or already-accepted invitations.
 */
export async function validateInvitationToken(
  prisma: PrismaClient,
  token: string
): Promise<ValidatedInvitation | null> {
  // Validate token format (should be 64 hex chars = 32 bytes)
  if (!token || token.length !== 64 || !/^[a-f0-9]+$/i.test(token)) {
    return null;
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invitation) {
    return null;
  }

  // Check if already accepted
  if (invitation.acceptedAt) {
    return null;
  }

  // Check if revoked
  if (invitation.revokedAt) {
    return null;
  }

  // Check if expired
  if (invitation.expiresAt < new Date()) {
    return null;
  }

  // Use constant-time comparison for the final token check
  const tokenBuffer = Buffer.from(token, "utf8");
  const storedTokenBuffer = Buffer.from(invitation.token, "utf8");

  if (tokenBuffer.length !== storedTokenBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(tokenBuffer, storedTokenBuffer)) {
    return null;
  }

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    organization: invitation.organization,
    inviter: invitation.inviter,
  };
}
