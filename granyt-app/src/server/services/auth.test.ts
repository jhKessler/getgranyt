import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateApiKey, extractApiKey } from './auth';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import the mock after setting it up
import { prisma } from '@/lib/prisma';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractApiKey', () => {
    it('should extract API key from Bearer token', () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer test-api-key-123');

      const result = extractApiKey(headers);
      expect(result).toBe('test-api-key-123');
    });

    it('should extract API key from x-api-key header', () => {
      const headers = new Headers();
      headers.set('x-api-key', 'test-api-key-456');

      const result = extractApiKey(headers);
      expect(result).toBe('test-api-key-456');
    });

    it('should prefer Bearer token over x-api-key', () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer bearer-key');
      headers.set('x-api-key', 'header-key');

      const result = extractApiKey(headers);
      expect(result).toBe('bearer-key');
    });

    it('should return null when no API key present', () => {
      const headers = new Headers();

      const result = extractApiKey(headers);
      expect(result).toBeNull();
    });
  });

  describe('validateApiKey', () => {
    it('should return error when no API key provided', async () => {
      const result = await validateApiKey(null);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('API key required');
        expect(result.status).toBe(401);
      }
    });

    it('should return error when API key not found', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);

      const result = await validateApiKey('invalid-key');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid API key');
        expect(result.status).toBe(401);
      }
    });

    it('should return organization when API key is valid', async () => {
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Org',
        slug: 'test-org',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
        id: 'key-123',
        keyHash: 'hash',
        keyPrefix: 'gdn_',
        name: 'Test Key',
        organizationId: 'org-123',
        organization: mockOrganization,
        createdAt: new Date(),
        lastUsedAt: null,
        expiresAt: null,
      } as any);

      vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

      const result = await validateApiKey('valid-key');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.organization.id).toBe('org-123');
        expect(result.organization.name).toBe('Test Org');
      }
    });
  });
});
