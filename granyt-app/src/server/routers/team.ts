import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { checkMembership } from "../services/organization";
import {
  listOrganizationMembers,
  updateMemberRole,
  toggleMemberStatus,
} from "../services/organization";
import {
  createInvitation,
  listPendingInvitations,
  revokeInvitation,
  resendInvitation,
} from "../services/invitations";
import { smtpChannel, resendChannel } from "../services/notifications/channels";

export const teamRouter = router({
  // ===== MEMBER MANAGEMENT =====

  listMembers: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Only admins and owners can view team management
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id, [
        "owner",
        "admin",
      ]);
      return listOrganizationMembers(ctx.prisma, input.organizationId);
    }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        memberId: z.string(),
        role: z.enum(["admin", "member"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id, [
        "owner",
        "admin",
      ]);
      return updateMemberRole(
        ctx.prisma,
        input.organizationId,
        input.memberId,
        input.role,
        ctx.user.id
      );
    }),

  toggleMemberStatus: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id, [
        "owner",
        "admin",
      ]);
      return toggleMemberStatus(
        ctx.prisma,
        input.organizationId,
        input.userId,
        input.isActive,
        ctx.user.id
      );
    }),

  // ===== INVITATIONS =====

  createInvitation: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().email().max(255),
        role: z.enum(["admin", "member"]),
        sendEmail: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id, [
        "owner",
        "admin",
      ]);
      return createInvitation(ctx.prisma, {
        organizationId: input.organizationId,
        email: input.email,
        role: input.role,
        invitedBy: ctx.user.id,
        sendEmail: input.sendEmail,
      });
    }),

  listInvitations: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id, [
        "owner",
        "admin",
      ]);
      return listPendingInvitations(ctx.prisma, input.organizationId);
    }),

  checkEmailConfigured: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id, [
        "owner",
        "admin",
      ]);

      const [smtpConfigured, smtpEnabled, resendConfigured, resendEnabled] =
        await Promise.all([
          smtpChannel.isConfigured(input.organizationId),
          smtpChannel.isEnabled(input.organizationId),
          resendChannel.isConfigured(input.organizationId),
          resendChannel.isEnabled(input.organizationId),
        ]);

      const isEmailAvailable =
        (smtpConfigured && smtpEnabled) || (resendConfigured && resendEnabled);

      return { isEmailAvailable };
    }),

  revokeInvitation: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        invitationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id, [
        "owner",
        "admin",
      ]);
      await revokeInvitation(
        ctx.prisma,
        input.invitationId,
        input.organizationId
      );
      return { success: true };
    }),

  resendInvitation: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        invitationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id, [
        "owner",
        "admin",
      ]);
      return resendInvitation(
        ctx.prisma,
        input.invitationId,
        input.organizationId
      );
    }),
});
