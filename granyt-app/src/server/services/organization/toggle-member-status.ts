import type { PrismaClient, User } from "@prisma/client";

/**
 * Activates or deactivates a user.
 * When deactivating, deletes all user sessions.
 * Cannot deactivate self or the only owner.
 */
export async function toggleMemberStatus(
  prisma: PrismaClient,
  organizationId: string,
  userId: string,
  isActive: boolean,
  actorUserId: string
): Promise<User> {
  // Cannot deactivate self
  if (userId === actorUserId && !isActive) {
    throw new Error("Cannot deactivate yourself");
  }

  // Check if user is a member of the organization
  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
    },
  });

  if (!membership) {
    throw new Error("User is not a member of this organization");
  }

  // Cannot deactivate an owner
  if (membership.role === "owner" && !isActive) {
    throw new Error("Cannot deactivate an owner");
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Use transaction to update user and delete sessions atomically
  return prisma.$transaction(async (tx) => {
    // Update user status
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        isActive,
        deactivatedAt: isActive ? null : new Date(),
      },
    });

    // If deactivating, delete all sessions
    if (!isActive) {
      await tx.session.deleteMany({
        where: { userId },
      });
    }

    return updatedUser;
  });
}
