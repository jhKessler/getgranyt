import type { PrismaClient } from "@prisma/client";

export interface OrganizationMemberWithUser {
  id: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    image: string | null;
  };
}

/**
 * Lists all members of an organization with their user details.
 * Ordered by role priority (owner first) then by creation date.
 */
export async function listOrganizationMembers(
  prisma: PrismaClient,
  organizationId: string
): Promise<OrganizationMemberWithUser[]> {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          image: true,
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  // Sort by role priority: owner > admin > member
  const rolePriority: Record<string, number> = {
    owner: 0,
    admin: 1,
    member: 2,
  };

  return members.sort((a, b) => {
    const priorityA = rolePriority[a.role] ?? 3;
    const priorityB = rolePriority[b.role] ?? 3;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}
