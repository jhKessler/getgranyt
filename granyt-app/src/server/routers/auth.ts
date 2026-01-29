import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { prisma } from "@/lib/prisma";
import {
  validateInvitationToken,
  acceptInvitation,
} from "../services/invitations";

export const authRouter = router({
  isSignUpEnabled: publicProcedure.query(async () => {
    const userCount = await prisma.user.count();
    return userCount === 0;
  }),

  // Public invitation endpoints (no auth required)

  validateInvitation: publicProcedure
    .input(z.object({ token: z.string().length(64) }))
    .query(async ({ input }) => {
      const invitation = await validateInvitationToken(prisma, input.token);

      if (!invitation) {
        return { valid: false, invitation: null };
      }

      return { valid: true, invitation };
    }),

  acceptInvitation: publicProcedure
    .input(
      z.object({
        token: z.string().length(64),
        name: z.string().min(2).max(100).trim(),
        password: z.string().min(8).max(128),
      })
    )
    .mutation(async ({ input }) => {
      const result = await acceptInvitation(prisma, input);

      return {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
        },
      };
    }),
});
