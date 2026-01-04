import { publicProcedure, router } from "../trpc";
import { prisma } from "@/lib/prisma";

export const authRouter = router({
  isSignUpEnabled: publicProcedure.query(async () => {
    const userCount = await prisma.user.count();
    return userCount === 0;
  }),
});
