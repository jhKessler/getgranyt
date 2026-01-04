import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserOrganization } from './helpers';
import { TRPCError } from '@trpc/server';

const mockPrisma = {
  organizationMember: {
    findFirst: vi.fn(),
  },
};

describe('getUserOrganization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the first organization if no organizationId is provided', async () => {
    const mockOrg = { id: 'org-1', name: 'Org 1' };
    mockPrisma.organizationMember.findFirst.mockResolvedValue({
      organization: mockOrg,
    });

    const result = await getUserOrganization(mockPrisma as any, 'user-1');

    expect(result).toEqual(mockOrg);
    expect(mockPrisma.organizationMember.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: { organization: true },
    });
  });

  it('should return the specific organization if organizationId is provided', async () => {
    const mockOrg = { id: 'org-2', name: 'Org 2' };
    mockPrisma.organizationMember.findFirst.mockResolvedValue({
      organization: mockOrg,
    });

    const result = await getUserOrganization(mockPrisma as any, 'user-1', 'org-2');

    expect(result).toEqual(mockOrg);
    expect(mockPrisma.organizationMember.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1', organizationId: 'org-2' },
      include: { organization: true },
    });
  });

  it('should throw NOT_FOUND if no organization is found', async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);

    await expect(getUserOrganization(mockPrisma as any, 'user-1'))
      .rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: 'No organization found' }));
  });

  it('should throw NOT_FOUND with specific message if organizationId is provided but not found', async () => {
    mockPrisma.organizationMember.findFirst.mockResolvedValue(null);

    await expect(getUserOrganization(mockPrisma as any, 'user-1', 'org-999'))
      .rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found or you are not a member' }));
  });
});
