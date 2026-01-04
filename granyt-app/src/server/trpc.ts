import { initTRPC, TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createLogger } from "@/lib/logger";

const logger = createLogger("tRPC");

export const createTRPCContext = async () => {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  return {
    prisma,
    session,
    user: session?.user ?? null,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create();

/**
 * Middleware that logs the duration and status of each tRPC call
 */
const loggerMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  const meta = {
    path,
    type,
    durationMs,
    userId: ctx.user?.id,
  };

  if (result.ok) {
    logger.info(meta, "tRPC request success");
  } else {
    logger.error(
      { ...meta, error: result.error.message, code: result.error.code },
      "tRPC request failed"
    );
  }

  return result;
});

export const router = t.router;
export const publicProcedure = t.procedure.use(loggerMiddleware);

export const protectedProcedure = t.procedure.use(loggerMiddleware).use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});
