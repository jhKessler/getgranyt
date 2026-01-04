import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEnvironmentFilter } from './helpers';
import { getErrorsByEnvironmentType } from './errors';

// Create mock prisma client
const mockPrisma = {
  environment: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  dag: {
    findFirst: vi.fn(),
  },
  dagRun: {
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
  generalError: {
    findMany: vi.fn(),
  },
};

describe('Dashboard Environment Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEnvironmentFilter', () => {
    it('should return undefined when environment is null', () => {
      const result = getEnvironmentFilter(null);
      expect(result).toBeUndefined();
    });

    it('should return the environment string when provided', () => {
      const result = getEnvironmentFilter('production');
      expect(result).toBe('production');
    });

    it('should return the environment string for development', () => {
      const result = getEnvironmentFilter('development');
      expect(result).toBe('development');
    });

    it('should return the environment string for custom environments', () => {
      const result = getEnvironmentFilter('staging');
      expect(result).toBe('staging');
    });
  });
});

describe('getErrorsByEnvironmentType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch default environment errors', async () => {
    mockPrisma.generalError.findMany.mockResolvedValue([
      {
        id: 'error-1',
        exceptionType: 'ValueError',
        message: 'Test error',
        status: 'open',
        occurrenceCount: 5,
        lastSeenAt: new Date(),
        firstSeenAt: new Date(),
        occurrences: [],
      },
    ]);

    const result = await getErrorsByEnvironmentType(
      mockPrisma as any,
      'org-123',
      'default',
      10,
      'production' // defaultEnvironmentName
    );

    expect(result).toBeInstanceOf(Array);
    expect(mockPrisma.generalError.findMany).toHaveBeenCalled();
  });

  it('should fetch non-default environment errors', async () => {
    mockPrisma.generalError.findMany.mockResolvedValue([]);

    const result = await getErrorsByEnvironmentType(
      mockPrisma as any,
      'org-123',
      'non-default',
      10,
      'production', // defaultEnvironmentName
      ['development', 'staging'] // nonDefaultEnvironmentNames
    );

    expect(result).toBeInstanceOf(Array);
    expect(result).toEqual([]);
  });

  it('should return empty array when no default environment for default type', async () => {
    const result = await getErrorsByEnvironmentType(
      mockPrisma as any,
      'org-123',
      'default',
      10,
      undefined // no defaultEnvironmentName
    );

    expect(result).toEqual([]);
    expect(mockPrisma.generalError.findMany).not.toHaveBeenCalled();
  });
});
