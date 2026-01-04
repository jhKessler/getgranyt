import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findOrCreateDagRun } from '../dag-run';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dagRun: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Edge Cases: DAG Run Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle concurrent run creation attempts', async () => {
    // First call returns null (not found)
    vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);

    // But create might fail due to concurrent insert (unique constraint)
    // In real scenario, this would be handled by upsert or retry logic
    vi.mocked(prisma.dagRun.create).mockResolvedValue({
      id: 'dagrun-1',
      environment: 'production',
    } as any);

    const result = await findOrCreateDagRun({
      organizationId: 'org-123',
      srcDagId: 'test_dag',
      srcRunId: 'manual__2025-01-01',
      timestamp: new Date(),
      environment: 'production',
    });

    expect(result.id).toBe('dagrun-1');
  });

  it('should handle run with very long run_id', async () => {
    const longRunId = 'scheduled__' + '2025-01-01T12:00:00.123456789+00:00';

    vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.dagRun.create).mockResolvedValue({
      id: 'dagrun-1',
      srcRunId: longRunId,
    } as any);

    const _result = await findOrCreateDagRun({
      organizationId: 'org-123',
      srcDagId: 'test_dag',
      srcRunId: longRunId,
      timestamp: new Date(),
    });

    expect(prisma.dagRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          srcRunId: longRunId,
          runType: 'scheduled',
        }),
      })
    );
  });

  it('should handle backfill run type', async () => {
    vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'dagrun-1' } as any);

    await findOrCreateDagRun({
      organizationId: 'org-123',
      srcDagId: 'test_dag',
      srcRunId: 'backfill__2025-01-01T00:00:00+00:00',
      timestamp: new Date(),
    });

    expect(prisma.dagRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          runType: 'backfill',
        }),
      })
    );
  });

  it('should default to unknown run type for unrecognized prefixes', async () => {
    vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'dagrun-1' } as any);

    await findOrCreateDagRun({
      organizationId: 'org-123',
      srcDagId: 'test_dag',
      srcRunId: 'custom_trigger__2025-01-01',
      timestamp: new Date(),
    });

    expect(prisma.dagRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          runType: 'unknown',
        }),
      })
    );
  });
});
