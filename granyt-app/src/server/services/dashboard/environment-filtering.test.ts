import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEnvironmentFilter, getDefaultEnvironment } from '../dashboard';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    environment: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Edge Cases: Environment Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEnvironmentFilter edge cases', () => {
    it('should return undefined for empty string', () => {
      // Empty string should be treated as "all environments"
      const result = getEnvironmentFilter('');
      expect(result).toBe('');
    });

    it('should handle whitespace-only environment', () => {
      const result = getEnvironmentFilter('   ');
      expect(result).toBe('   ');
    });

    it('should preserve case sensitivity', () => {
      // Environments are case-sensitive
      const result = getEnvironmentFilter('Production');
      expect(result).toBe('Production');
    });
  });

  describe('getDefaultEnvironment edge cases', () => {
    it('should return null when no environments exist', async () => {
      vi.mocked(prisma.environment.findFirst).mockResolvedValue(null);

      const result = await getDefaultEnvironment(prisma as any, 'org-123');
      expect(result).toBeNull();
    });

    it('should return null when no default environment is set', async () => {
      vi.mocked(prisma.environment.findFirst).mockResolvedValue(null);

      const result = await getDefaultEnvironment(prisma as any, 'org-123');
      expect(result).toBeNull();
    });

    it('should return environment name from default environment', async () => {
      vi.mocked(prisma.environment.findFirst).mockResolvedValue({
        name: 'production',
      } as any);

      const result = await getDefaultEnvironment(prisma as any, 'org-123');
      expect(result).toBe('production');
    });
  });
});
