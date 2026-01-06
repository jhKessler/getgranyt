import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSetupStatus } from './setup-status';

// Create mock prisma client
const mockPrisma = {
  dagRun: {
    count: vi.fn(),
  },
  organizationChannelConfig: {
    count: vi.fn(),
  },
  errorOccurrence: {
    count: vi.fn(),
  },
};

describe('getSetupStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all false when no data exists', async () => {
    mockPrisma.dagRun.count.mockResolvedValue(0);
    mockPrisma.organizationChannelConfig.count.mockResolvedValue(0);
    mockPrisma.errorOccurrence.count.mockResolvedValue(0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getSetupStatus(mockPrisma as any, 'org-123');

    expect(result).toEqual({
      hasDagRuns: false,
      hasNotificationChannel: false,
      hasErrors: false,
    });
  });

  it('should return hasDagRuns true when DAG runs exist', async () => {
    mockPrisma.dagRun.count.mockResolvedValue(1);
    mockPrisma.organizationChannelConfig.count.mockResolvedValue(0);
    mockPrisma.errorOccurrence.count.mockResolvedValue(0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getSetupStatus(mockPrisma as any, 'org-123');

    expect(result).toEqual({
      hasDagRuns: true,
      hasNotificationChannel: false,
      hasErrors: false,
    });
  });

  it('should return hasNotificationChannel true when channel config exists', async () => {
    mockPrisma.dagRun.count.mockResolvedValue(0);
    mockPrisma.organizationChannelConfig.count.mockResolvedValue(1);
    mockPrisma.errorOccurrence.count.mockResolvedValue(0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getSetupStatus(mockPrisma as any, 'org-123');

    expect(result).toEqual({
      hasDagRuns: false,
      hasNotificationChannel: true,
      hasErrors: false,
    });
  });

  it('should return hasErrors true when error occurrences exist', async () => {
    mockPrisma.dagRun.count.mockResolvedValue(0);
    mockPrisma.organizationChannelConfig.count.mockResolvedValue(0);
    mockPrisma.errorOccurrence.count.mockResolvedValue(1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getSetupStatus(mockPrisma as any, 'org-123');

    expect(result).toEqual({
      hasDagRuns: false,
      hasNotificationChannel: false,
      hasErrors: true,
    });
  });

  it('should return all true when all data exists', async () => {
    mockPrisma.dagRun.count.mockResolvedValue(5);
    mockPrisma.organizationChannelConfig.count.mockResolvedValue(2);
    mockPrisma.errorOccurrence.count.mockResolvedValue(3);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getSetupStatus(mockPrisma as any, 'org-123');

    expect(result).toEqual({
      hasDagRuns: true,
      hasNotificationChannel: true,
      hasErrors: true,
    });
  });

  it('should query with correct organizationId filter', async () => {
    mockPrisma.dagRun.count.mockResolvedValue(0);
    mockPrisma.organizationChannelConfig.count.mockResolvedValue(0);
    mockPrisma.errorOccurrence.count.mockResolvedValue(0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getSetupStatus(mockPrisma as any, 'test-org-id');

    expect(mockPrisma.dagRun.count).toHaveBeenCalledWith({
      where: { organizationId: 'test-org-id' },
      take: 1,
    });

    expect(mockPrisma.organizationChannelConfig.count).toHaveBeenCalledWith({
      where: { organizationId: 'test-org-id', enabled: true },
      take: 1,
    });

    expect(mockPrisma.errorOccurrence.count).toHaveBeenCalledWith({
      where: { organizationId: 'test-org-id' },
      take: 1,
    });
  });
});
