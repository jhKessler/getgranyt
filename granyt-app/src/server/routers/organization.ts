import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  checkMembership,
  listUserOrganizations,
  createOrganization,
  createApiKey,
  listApiKeys,
  listEnvironments,
  createEnvironment,
  setDefaultEnvironment,
  deleteEnvironment,
  deleteApiKey,
} from "../services/organization";

export const organizationRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return listUserOrganizations(ctx.prisma, ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(100) }))
    .mutation(({ ctx, input }) => {
      return createOrganization(ctx.prisma, ctx.user.id, input.name);
    }),

  generateApiKey: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
      name: z.string().min(1).max(100),
      type: z.enum(["airflow", "dagster"]),
      environmentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id);
      return createApiKey(
        ctx.prisma, 
        input.organizationId, 
        input.name, 
        input.type,
        input.environmentId
      );
    }),

  listApiKeys: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id);
      return listApiKeys(ctx.prisma, input.organizationId);
    }),

  listEnvironments: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id);
      return listEnvironments(ctx.prisma, input.organizationId);
    }),

  createEnvironment: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
      name: z.string().min(1).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id);
      return createEnvironment(ctx.prisma, input.organizationId, input.name);
    }),

  setDefaultEnvironment: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
      environmentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id, ["owner", "admin"]);
      await setDefaultEnvironment(ctx.prisma, input.organizationId, input.environmentId);
      return { success: true };
    }),

  deleteEnvironment: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
      environmentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkMembership(ctx.prisma, input.organizationId, ctx.user.id, ["owner", "admin"]);
      await deleteEnvironment(ctx.prisma, input.environmentId, input.organizationId);
      return { success: true };
    }),

  deleteApiKey: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await deleteApiKey(ctx.prisma, input.id, ctx.user.id);
      return { success: true };
    }),
});
