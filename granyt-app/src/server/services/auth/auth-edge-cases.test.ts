import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateApiKey, extractApiKey } from './index';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const createMockOrganization = (overrides = {}) => ({
  id: 'org-123',
  name: 'Test Org',
  slug: 'test-org',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-1',
  ...overrides,
});

const createMockApiKey = (overrides = {}) => ({
  id: 'key-123',
  keyHash: 'hash',
  keyPrefix: 'gdn_',
  name: 'Test Key',
  organizationId: 'org-123',
  environmentId: 'env-1',
  environment: { id: 'env-1', name: 'production' },
  organization: createMockOrganization(),
  createdAt: new Date(),
  lastUsedAt: null,
  expiresAt: null,
  ...overrides,
});

describe('Edge Cases: Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateApiKey', () => {
    it('should return environment from API key', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(createMockApiKey() as any);
      vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

      const result = await validateApiKey('gdn_test-key');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.environmentName).toBe('production');
      }
    });

    it('should return custom environment from API key', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(
        createMockApiKey({
          environmentId: 'env-2',
          environment: { id: 'env-2', name: 'staging-eu-west' },
        }) as any
      );
      vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

      const result = await validateApiKey('gdn_staging-key');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.environmentName).toBe('staging-eu-west');
      }
    });

    it('should handle expired API key gracefully', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);

      const result = await validateApiKey('gdn_expired-key');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid API key');
      }
    });

    // NEW: Malformed API key format tests
    it('should reject null API key', async () => {
      const result = await validateApiKey(null);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('API key required');
        expect(result.status).toBe(401);
      }
    });

    it('should reject empty string API key', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);

      const result = await validateApiKey('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('API key required');
      }
    });

    it('should reject whitespace-only API key', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);

      const result = await validateApiKey('   ');

      expect(result.success).toBe(false);
    });

    it('should handle API key with only prefix (gdn_)', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);

      const result = await validateApiKey('gdn_');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid API key');
      }
    });

    it('should handle API key with special characters', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);

      const result = await validateApiKey('gdn_!@#$%^&*()');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid API key');
      }
    });

    it('should handle very long API key', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);

      const longKey = 'gdn_' + 'a'.repeat(10000);
      const result = await validateApiKey(longKey);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid API key');
      }
    });

    it('should handle API key without environment association', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(
        createMockApiKey({
          environmentId: null,
          environment: null,
        }) as any
      );
      vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

      const result = await validateApiKey('gdn_no-env-key');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.environmentName).toBeNull();
        expect(result.environmentId).toBeNull();
      }
    });

    // NEW: Database error handling tests
    it('should handle database connection errors gracefully', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockRejectedValue(
        new Error('Connection refused')
      );

      await expect(validateApiKey('gdn_test-key')).rejects.toThrow('Connection refused');
    });

    it('should handle database timeout errors', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockRejectedValue(
        new Error('Query timeout exceeded')
      );

      await expect(validateApiKey('gdn_test-key')).rejects.toThrow('Query timeout exceeded');
    });

    // NEW: Unicode and encoding tests
    it('should handle API key with unicode characters', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);

      const result = await validateApiKey('gdn_测试密钥🔑');

      expect(result.success).toBe(false);
    });

    it('should handle API key with null bytes', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);

      const result = await validateApiKey('gdn_test\x00key');

      expect(result.success).toBe(false);
    });

    // NEW: Update failure handling
    it('should still return success when lastUsedAt update fails', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(createMockApiKey() as any);
      vi.mocked(prisma.apiKey.update).mockRejectedValue(new Error('Update failed'));

      const result = await validateApiKey('gdn_test-key');

      // Should still succeed because update is fire-and-forget
      expect(result.success).toBe(true);
    });
  });

  describe('extractApiKey', () => {
    it('should extract API key from Bearer token', () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer gdn_test-key-123');

      const result = extractApiKey(headers);

      expect(result).toBe('gdn_test-key-123');
    });

    it('should extract API key from x-api-key header', () => {
      const headers = new Headers();
      headers.set('x-api-key', 'gdn_test-key-456');

      const result = extractApiKey(headers);

      expect(result).toBe('gdn_test-key-456');
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

    // NEW: Edge cases for extractApiKey
    it('should handle Bearer with extra spaces', () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer  gdn_test-key'); // Double space

      const result = extractApiKey(headers);

      // Should include the extra space in the key
      expect(result).toBe(' gdn_test-key');
    });

    it('should handle lowercase bearer', () => {
      const headers = new Headers();
      headers.set('authorization', 'bearer gdn_test-key');

      const result = extractApiKey(headers);

      // 'bearer ' is not removed, only 'Bearer '
      expect(result).toBe('bearer gdn_test-key');
    });

    it('should handle empty authorization header', () => {
      const headers = new Headers();
      headers.set('authorization', '');

      const result = extractApiKey(headers);

      // Empty string after replace, which is falsy -> returns null from x-api-key fallback
      expect(result).toBeNull();
    });

    it('should handle Bearer without key', () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer ');

      const result = extractApiKey(headers);

      // Note: Headers API trims values, so 'Bearer ' becomes 'Bearer'
      // 'Bearer'.replace('Bearer ', '') = 'Bearer' (no match)
      expect(result).toBe('Bearer');
    });

    it('should handle authorization header with only Bearer', () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer');

      const result = extractApiKey(headers);

      // 'Bearer'.replace('Bearer ', '') = 'Bearer' (no space to match)
      expect(result).toBe('Bearer');
    });

    it('should prefer Bearer token over x-api-key even when Bearer has no actual key', () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer ');  // Trimmed to 'Bearer'
      headers.set('x-api-key', 'gdn_fallback-key');

      const result = extractApiKey(headers);

      // Headers trims 'Bearer ' to 'Bearer', which doesn't match 'Bearer '
      // So bearerToken = 'Bearer' which is truthy
      expect(result).toBe('Bearer');
    });
  });
});
