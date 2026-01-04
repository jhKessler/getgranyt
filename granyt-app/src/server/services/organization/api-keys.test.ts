import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listEnvironments } from './environments';
import { normalizeEnvironment } from './helpers';
import { deleteApiKey } from './api-keys';
import { TRPCError } from '@trpc/server';

// Create mock prisma client
const mockPrisma = {
  environment: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  organizationMember: {
    findUnique: vi.fn(),
  },
  apiKey: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe('API Keys Environment Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeEnvironment', () => {
    it('should lowercase and trim environment name', () => {
      expect(normalizeEnvironment('  Production  ')).toBe('production');
    });

    it('should handle already lowercase names', () => {
      expect(normalizeEnvironment('development')).toBe('development');
    });

    it('should handle mixed case', () => {
      expect(normalizeEnvironment('StAgInG')).toBe('staging');
    });

    it('should convert prod to production', () => {
      expect(normalizeEnvironment('prod')).toBe('production');
    });

    it('should convert dev to development', () => {
      expect(normalizeEnvironment('dev')).toBe('development');
    });
  });

  describe('listEnvironments', () => {
    it('should return list of environments with counts from Environment table', async () => {
      mockPrisma.environment.findMany.mockResolvedValue([
        {
          id: 'env-1',
          name: 'production',
          isDefault: true,
          _count: { apiKeys: 2 },
        },
        {
          id: 'env-2',
          name: 'development',
          isDefault: false,
          _count: { apiKeys: 1 },
        },
      ]);

      const result = await listEnvironments(mockPrisma as any, 'org-123');

      expect(result).toEqual([
        {
          id: 'env-1',
          name: 'production',
          apiKeyCount: 2,
          isDefault: true,
        },
        {
          id: 'env-2',
          name: 'development',
          apiKeyCount: 1,
          isDefault: false,
        },
      ]);
    });

    it('should return empty array when no environments exist', async () => {
      mockPrisma.environment.findMany.mockResolvedValue([]);

      const result = await listEnvironments(mockPrisma as any, 'org-123');

      expect(result).toEqual([]);
    });
  });

  describe('deleteApiKey', () => {
    it('should delete API key if user is owner/admin of the organization', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        organizationId: 'org-1',
      });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'owner',
      });

      await deleteApiKey(mockPrisma as any, 'key-1', 'user-1');

      expect(mockPrisma.apiKey.delete).toHaveBeenCalledWith({
        where: { id: 'key-1' },
      });
    });

    it('should throw NOT_FOUND if API key does not exist', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);

      await expect(deleteApiKey(mockPrisma as any, 'key-1', 'user-1'))
        .rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: 'API key not found' }));
    });

    it('should throw NOT_FOUND if user is not a member of the organization', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        organizationId: 'org-1',
      });
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      await expect(deleteApiKey(mockPrisma as any, 'key-1', 'user-1'))
        .rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: 'API key not found' }));
    });

    it('should throw NOT_FOUND if user is only a member (not admin/owner)', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        organizationId: 'org-1',
      });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        role: 'member',
      });

      await expect(deleteApiKey(mockPrisma as any, 'key-1', 'user-1'))
        .rejects.toThrow(new TRPCError({ code: 'NOT_FOUND', message: 'API key not found' }));
    });
  });
});
