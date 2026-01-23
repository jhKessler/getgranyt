import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MetricsPayload } from '@/lib/validators';
import { ingestMetrics } from '../ingest';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dag: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
    },
    dagRun: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    taskRun: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    metric: {
      create: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    dagComputedMetrics: {
      upsert: vi.fn(),
    },
    dagRunMetricSnapshot: {
      upsert: vi.fn(),
    },
    errorOccurrence: {
      count: vi.fn(),
    },
    userNotificationSettings: {
      findMany: vi.fn(),
    },
    organizationChannelConfig: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    organizationMember: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Edge Cases: Organization Boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should isolate data between organizations', async () => {
    vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
    vi.mocked(prisma.dagRun.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({ id: 'dagrun-1', organizationId: 'org-1', taskRuns: [{ id: 'taskrun-1', status: 'success' }] } as any);
    vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'dagrun-1' } as any);
    vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);
    vi.mocked(prisma.taskRun.findUnique).mockResolvedValue({
      dagRun: { dag: { organizationId: 'org-1', dagId: 'shared_dag_name', environment: 'production' } }
    } as any);
    vi.mocked(prisma.metric.create).mockResolvedValue({} as any);
    vi.mocked(prisma.metric.aggregate).mockResolvedValue({ _sum: { rowCount: 100 }, _count: 1 } as any);
    vi.mocked(prisma.metric.findMany).mockResolvedValue([]);
    vi.mocked(prisma.dagComputedMetrics.upsert).mockResolvedValue({} as any);
    vi.mocked(prisma.dagRunMetricSnapshot.upsert).mockResolvedValue({} as any);
    vi.mocked(prisma.errorOccurrence.count).mockResolvedValue(0);

    const metrics: MetricsPayload = {
      captured_at: '2025-01-01T12:00:00.000Z',
      dag_id: 'shared_dag_name', // Same dag_id
      task_id: 'task_1',
      run_id: 'manual__2025-01-01',
      metrics: {
        row_count: 100,
        column_count: 5,
        memory_bytes: null,
        dataframe_type: 'pandas',
        columns: [],
      },
    };

    // Org 1
    await ingestMetrics({
      organizationId: 'org-1',
      payload: metrics,
    });

    // Org 2 (same DAG name)
    vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'dagrun-2' } as any);
    vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-2' } as any);

    await ingestMetrics({
      organizationId: 'org-2',
      payload: { ...metrics },
    });

    // Verify each org gets its own records
    const dagUpsertCalls = vi.mocked(prisma.dag.upsert).mock.calls;
    expect(dagUpsertCalls[0][0].where.organizationId_srcDagId_namespace?.organizationId).toBe('org-1');
    expect(dagUpsertCalls[1][0].where.organizationId_srcDagId_namespace?.organizationId).toBe('org-2');
  });
});
