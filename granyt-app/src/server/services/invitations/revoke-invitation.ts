import type { PrismaClient, Invitation } from "@prisma/client";

/**
 * Revokes a pending invitation.
 * Throws an error if the invitation is not found, already accepted, or already revoked.
 */
export async function revokeInvitation(
  prisma: PrismaClient,
  invitationId: string,
  organizationId: string
): Promise<Invitation> {
  // Find the invitation
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      organizationId, // Ensure it belongs to the correct org
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.acceptedAt) {
    throw new Error("Cannot revoke an accepted invitation");
  }

  if (invitation.revokedAt) {
    throw new Error("Invitation is already revoked");
  }

  // Revoke the invitation
  return prisma.invitation.update({
    where: { id: invitationId },
    data: { revokedAt: new Date() },
  });
}

/**
 * Resends an invitation email by updating the expiration and sending a new email.
 */
export async function resendInvitation(
  prisma: PrismaClient,
  invitationId: string,
  organizationId: string
): Promise<{ invitation: Invitation; inviteUrl: string }> {
  const { env } = await import("@/env");

  // Find the invitation
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      organizationId,
    },
    include: {
      organization: {
        select: { name: true },
      },
      inviter: {
        select: { name: true },
      },
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.acceptedAt) {
    throw new Error("Cannot resend an accepted invitation");
  }

  if (invitation.revokedAt) {
    throw new Error("Cannot resend a revoked invitation");
  }

  // Extend expiration by 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Update the invitation
  const updatedInvitation = await prisma.invitation.update({
    where: { id: invitationId },
    data: { expiresAt },
  });

  const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`;

  // Send the email
  const { sendInvitationEmail } = await import("./send-invitation-email");
  await sendInvitationEmail({
    recipientEmail: invitation.email,
    inviterName: invitation.inviter.name,
    organizationName: invitation.organization.name,
    role: invitation.role,
    inviteUrl,
    expiresInDays: 7,
  });

  return {
    invitation: updatedInvitation,
    inviteUrl,
  };
}
