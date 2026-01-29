import type { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { env } from "@/env";
import type { CreateInvitationInput, CreateInvitationResult } from "./types";

const INVITATION_EXPIRY_DAYS = 7;

/**
 * Creates a new invitation for a user to join an organization.
 * Generates a secure 256-bit token and optionally sends an email.
 */
export async function createInvitation(
  prisma: PrismaClient,
  input: CreateInvitationInput
): Promise<CreateInvitationResult> {
  const { organizationId, email, role, invitedBy, sendEmail } = input;

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists in organization
  const existingMember = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      user: {
        email: normalizedEmail,
      },
    },
  });

  if (existingMember) {
    throw new Error("User is already a member of this organization");
  }

  // Check for existing pending invitation
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      organizationId,
      email: normalizedEmail,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvitation) {
    throw new Error("An active invitation already exists for this email");
  }

  // Generate secure token (256-bit = 32 bytes = 64 hex chars)
  const token = randomBytes(32).toString("hex");

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  // Check for stale invitation to reuse (expired or revoked)
  const staleInvitation = await prisma.invitation.findFirst({
    where: {
      organizationId,
      email: normalizedEmail,
    },
  });

  const includeOptions = {
    organization: { select: { name: true } },
    inviter: { select: { name: true } },
  };

  // Reuse existing invitation or create new one
  const invitation = staleInvitation
    ? await prisma.invitation.update({
        where: { id: staleInvitation.id },
        data: {
          token,
          role,
          expiresAt,
          invitedBy,
          revokedAt: null,
          acceptedAt: null,
        },
        include: includeOptions,
      })
    : await prisma.invitation.create({
        data: {
          organizationId,
          email: normalizedEmail,
          role,
          token,
          expiresAt,
          invitedBy,
        },
        include: includeOptions,
      });

  // Build invite URL
  const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

  // Send email if requested
  if (sendEmail) {
    // Import dynamically to avoid circular dependencies
    const { sendInvitationEmail } = await import("./send-invitation-email");
    await sendInvitationEmail({
      recipientEmail: normalizedEmail,
      inviterName: invitation.inviter.name,
      organizationName: invitation.organization.name,
      role,
      inviteUrl,
      expiresInDays: INVITATION_EXPIRY_DAYS,
    });
  }

  return {
    invitation,
    inviteUrl,
  };
}
