import type { PrismaClient, OrganizationMember } from "@prisma/client";

export type MemberRole = "admin" | "member";

/**
 * Updates a member's role within an organization.
 * Cannot change owner role or demote the only owner.
 */
export async function updateMemberRole(
  prisma: PrismaClient,
  organizationId: string,
  memberId: string,
  newRole: MemberRole
): Promise<OrganizationMember> {
  // Find the member to update
  const member = await prisma.organizationMember.findFirst({
    where: {
      id: memberId,
      organizationId,
    },
  });

  if (!member) {
    throw new Error("Member not found");
  }

  // Cannot change owner role via API
  if (member.role === "owner") {
    throw new Error("Cannot change the role of an owner");
  }

  // If demoting to member, check if this would leave no admins
  // (this is a safeguard but owners still exist)
  if (newRole === "member" && member.role === "admin") {
    const adminCount = await prisma.organizationMember.count({
      where: {
        organizationId,
        role: { in: ["owner", "admin"] },
      },
    });

    // If this is the only admin/owner, prevent demotion
    if (adminCount <= 1) {
      throw new Error("Cannot demote the only admin. Promote another member first.");
    }
  }

  // Update the role
  return prisma.organizationMember.update({
    where: { id: memberId },
    data: { role: newRole },
  });
}
