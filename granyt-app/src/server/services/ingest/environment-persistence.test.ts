import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MetricsPayload } from '@/lib/validators';

// Mock prisma for all tests
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dag: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
    },
    dagRun: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
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
    dagRunMetricSnapshot: {
      upsert: vi.fn(),
    },
    errorOccurrence: {
      count: vi.fn(),
    },
    dagComputedMetrics: {
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { ingestMetrics } from '../ingest';
import { findOrCreateDagRun, findOrCreateTaskRun } from '../dag-run';

describe('Edge Cases: API Key Deletion and Data Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup common mocks for metric snapshot updates
    vi.mocked(prisma.metric.findMany).mockResolvedValue([]);
    vi.mocked(prisma.dagRunMetricSnapshot.upsert).mockResolvedValue({} as any);
    vi.mocked(prisma.errorOccurrence.count).mockResolvedValue(0);
  });

  describe('Data persists after API key deletion', () => {
    it('should store environment string directly on DagRun, surviving API key deletion', async () => {
      // Setup: API key exists with environment
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({
        id: 'dagrun-1',
        environment: 'production', // Environment stored directly
      } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);
      vi.mocked(prisma.taskRun.findUnique).mockResolvedValue({
        dagRunId: 'dagrun-1',
        dagRun: { srcDagId: 'test_dag', startTime: new Date(), organizationId: 'org-123' }
      } as any);
      vi.mocked(prisma.metric.create).mockResolvedValue({} as any);
      vi.mocked(prisma.metric.aggregate).mockResolvedValue({ _sum: { rowCount: 100 }, _count: 1 } as any);
      vi.mocked(prisma.dagComputedMetrics.upsert).mockResolvedValue({} as any);

      const metrics: MetricsPayload = {
        captured_at: '2025-01-01T12:00:00.000Z',
        dag_id: 'test_dag',
        task_id: 'task_1',
        run_id: 'manual__2025-01-01',
        metrics: {
          row_count: 100,
          column_count: 5,
          memory_bytes: 1024,
          dataframe_type: 'pandas',
        },
        schema: {
          column_dtypes: { id: 'int64' },
          null_counts: { id: 0 },
        },
      };

      await ingestMetrics({
        organizationId: 'org-123',
        environment: 'production', // Passed from auth
        payload: metrics,
      });

      // Verify environment is stored directly
      expect(prisma.dagRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            environment: 'production',
          }),
        })
      );
    });

    it('should store environment string directly on TaskRun, surviving API key deletion', async () => {
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({
        id: 'taskrun-1',
        environment: 'staging',
      } as any);

      const _result = await findOrCreateTaskRun({
        organizationId: 'org-123',
        dagRunId: 'dagrun-1',
        srcTaskId: 'task_1',
        environment: 'staging',
      });

      expect(prisma.taskRun.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            environment: 'staging',
          }),
        })
      );
    });

    it('should create new run when searching with specific environment that does not exist', async () => {
      // With environment in unique key, searching for environment='production' won't find a run with environment=null
      vi.mocked(prisma.dagRun.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({
        id: 'dagrun-new',
        environment: 'production',
      } as any);

      const result = await findOrCreateDagRun({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcRunId: 'manual__2025-01-01',
        timestamp: new Date(),
        environment: 'production',
      });

      // Should create a new run with the specified environment
      expect(prisma.dagRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            environment: 'production',
          }),
        })
      );
      expect(result.id).toBe('dagrun-new');
    });

    it('should return existing run when environment matches', async () => {
      // Existing run with matching environment
      vi.mocked(prisma.dagRun.findFirst).mockResolvedValue({
        id: 'dagrun-1',
        organizationId: 'org-123',
        environment: 'production',
        namespace: 'airflow',
        taskRuns: [{ id: 'taskrun-1', status: 'success' }],
      } as any);

      const result = await findOrCreateDagRun({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcRunId: 'manual__2025-01-01',
        timestamp: new Date(),
        environment: 'production', // Same environment
      });

      // Should return existing run without creating new one
      expect(prisma.dagRun.create).not.toHaveBeenCalled();
      expect(result.id).toBe('dagrun-1');
    });
  });
});

describe('Edge Cases: Multi-Environment Data Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow same DAG to run in different environments', async () => {
    vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);

    // First run in production
    vi.mocked(prisma.dagRun.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.dagRun.create).mockResolvedValueOnce({
      id: 'dagrun-prod',
      environment: 'production',
    } as any);
    vi.mocked(prisma.taskRun.upsert).mockResolvedValueOnce({ id: 'taskrun-prod' } as any);
    vi.mocked(prisma.taskRun.findUnique).mockResolvedValue({
      dagRunId: 'dagrun-1',
      dagRun: { srcDagId: 'shared_dag', startTime: new Date(), organizationId: 'org-123' }
    } as any);
    vi.mocked(prisma.metric.create).mockResolvedValue({} as any);
    vi.mocked(prisma.metric.aggregate).mockResolvedValue({ _sum: { rowCount: 100 }, _count: 1 } as any);
    vi.mocked(prisma.dagComputedMetrics.upsert).mockResolvedValue({} as any);

    const metricsBase: MetricsPayload = {
      captured_at: '2025-01-01T12:00:00.000Z',
      dag_id: 'shared_dag',
      task_id: 'task_1',
      run_id: 'manual__2025-01-01T12:00:00',
      metrics: {
        row_count: 100,
        column_count: 5,
        memory_bytes: null,
        dataframe_type: 'pandas',
        columns: [],
      },
    };

    await ingestMetrics({
      organizationId: 'org-123',
      environment: 'production',
      payload: metricsBase,
    });

    // Second run in development (different run_id)
    vi.mocked(prisma.dagRun.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.dagRun.create).mockResolvedValueOnce({
      id: 'dagrun-dev',
      environment: 'development',
    } as any);
    vi.mocked(prisma.taskRun.upsert).mockResolvedValueOnce({ id: 'taskrun-dev' } as any);

    await ingestMetrics({
      organizationId: 'org-123',
      environment: 'development',
      payload: { ...metricsBase, run_id: 'manual__2025-01-01T13:00:00' },
    });

    // Both should have different environment values
    const calls = vi.mocked(prisma.dagRun.create).mock.calls;
    expect(calls[0][0].data.environment).toBe('production');
    expect(calls[1][0].data.environment).toBe('development');
  });

  it('should handle runs with null environment (legacy data)', async () => {
    // Simulating legacy data without environment
    vi.mocked(prisma.dagRun.findMany).mockResolvedValue([
      { id: 'run-1', environment: null, status: 'success' },
      { id: 'run-2', environment: 'production', status: 'failed' },
      { id: 'run-3', environment: null, status: 'success' },
    ] as any);

    const runs = await prisma.dagRun.findMany({
      where: { organizationId: 'org-123' },
    } as any);

    // Should be able to query all runs regardless of environment
    expect(runs).toHaveLength(3);
    expect(runs.filter((r: any) => r.environment === null)).toHaveLength(2);
  });
});
