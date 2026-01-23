import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ingestLineage } from './ingest';
import type { OpenLineageEvent } from '@/lib/validators';

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
    dagRunMetricSnapshot: {
      upsert: vi.fn(),
    },
    taskRun: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    lineageEvent: {
      create: vi.fn(),
    },
    alertEvaluationJob: {
      upsert: vi.fn(),
    },
    metric: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
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

describe('Ingest Lineage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup common mocks for metric snapshot updates
    vi.mocked(prisma.metric.findMany).mockResolvedValue([]);
    vi.mocked(prisma.metric.aggregate).mockResolvedValue({ _sum: { rowCount: 0 } } as any);
    vi.mocked(prisma.dagRunMetricSnapshot.upsert).mockResolvedValue({} as any);
    vi.mocked(prisma.errorOccurrence.count).mockResolvedValue(0);
  });

  const createDagLevelEvent = (overrides?: Partial<OpenLineageEvent>): OpenLineageEvent => ({
    eventType: 'START',
    eventTime: '2025-01-01T12:00:00.000Z',
    producer: 'https://airflow.apache.org',
    schemaURL: 'https://openlineage.io/spec/1-0-5/OpenLineage.json',
    job: {
      namespace: 'airflow',
      name: 'test_dag',
    },
    run: {
      runId: 'manual__2025-01-01T12:00:00+00:00',
    },
    ...overrides,
  });

  const createTaskLevelEvent = (overrides?: Partial<OpenLineageEvent>): OpenLineageEvent => ({
    eventType: 'START',
    eventTime: '2025-01-01T12:00:00.000Z',
    producer: 'https://airflow.apache.org',
    schemaURL: 'https://openlineage.io/spec/1-0-5/OpenLineage.json',
    job: {
      namespace: 'airflow',
      name: 'test_dag.task_1',
    },
    run: {
      runId: '550e8400-e29b-41d4-a716-446655440000',
      facets: {
        parent: {
          _producer: 'https://airflow.apache.org',
          _schemaURL: 'https://openlineage.io/spec/facets/1-0-0/ParentRunFacet.json',
          run: {
            runId: 'manual__2025-01-01T12:00:00+00:00',
          },
          job: {
            namespace: 'airflow',
            name: 'test_dag',
          },
        },
      },
    },
    ...overrides,
  });

  describe('DAG-level events', () => {
    it('should handle START event', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'run-1' } as any);
      vi.mocked(prisma.lineageEvent.create).mockResolvedValue({} as any);

      const event = createDagLevelEvent({ eventType: 'START' });
      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.eventType).toBe('START');
      expect(result.isTaskLevel).toBe(false);
      expect(result.srcDagId).toBe('test_dag');
      expect(prisma.dagRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'RUNNING',
          }),
        })
      );
    });

    it('should handle COMPLETE event', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findFirst).mockResolvedValue({
        id: 'run-1',
        organizationId: 'org-123',
        startTime: new Date('2025-01-01T11:00:00Z'),
        taskRuns: [{ id: 'task-run-1', status: 'success' }],
      } as any);
      vi.mocked(prisma.dagRun.update).mockResolvedValue({ id: 'run-1' } as any);
      vi.mocked(prisma.lineageEvent.create).mockResolvedValue({} as any);
      vi.mocked(prisma.alertEvaluationJob.upsert).mockResolvedValue({ id: 'job-1', status: 'pending' } as any);

      const event = createDagLevelEvent({ eventType: 'COMPLETE' });
      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.eventType).toBe('COMPLETE');
      expect(prisma.dagRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            endTime: expect.any(Date),
            status: 'SUCCESS',
          }),
        })
      );
    });

    it('should handle FAIL event', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findFirst).mockResolvedValue({
        id: 'run-1',
        organizationId: 'org-123',
        startTime: new Date('2025-01-01T11:00:00Z'),
        taskRuns: [{ id: 'task-run-1', status: 'failed' }],
      } as any);
      vi.mocked(prisma.dagRun.update).mockResolvedValue({ id: 'run-1' } as any);
      vi.mocked(prisma.lineageEvent.create).mockResolvedValue({} as any);
      vi.mocked(prisma.alertEvaluationJob.upsert).mockResolvedValue({ id: 'job-1', status: 'pending' } as any);

      const event = createDagLevelEvent({ eventType: 'FAIL' });
      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.eventType).toBe('FAIL');
      expect(prisma.dagRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        })
      );
    });
  });

  describe('Task-level events', () => {
    it('should identify task-level events correctly', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findFirst).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.lineageEvent.create).mockResolvedValue({} as any);

      const event = createTaskLevelEvent();
      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.isTaskLevel).toBe(true);
      expect(result.srcTaskId).toBe('task_1');
    });

    it('should handle task START event', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findFirst).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.lineageEvent.create).mockResolvedValue({} as any);

      const event = createTaskLevelEvent({ eventType: 'START' });
      await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.taskRun.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: 'running',
          }),
        })
      );
    });

    it('should handle task COMPLETE event', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findFirst).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.taskRun.findUnique).mockResolvedValue({
        startTime: new Date('2025-01-01T11:00:00Z'),
      } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.lineageEvent.create).mockResolvedValue({} as any);

      const event = createTaskLevelEvent({ eventType: 'COMPLETE' });
      await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.taskRun.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: 'success',
          }),
        })
      );
    });
  });

  describe('Raw event storage', () => {
    it('should store raw lineage event', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({} as any);
      vi.mocked(prisma.lineageEvent.create).mockResolvedValue({} as any);

      const event = createDagLevelEvent();
      await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.lineageEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-123',
            eventType: 'START',
            jobName: 'test_dag',
            jobNamespace: 'airflow',
          }),
        })
      );
    });
  });

  it('should extract and store DAG schedule from job facets', async () => {
    vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
    vi.mocked(prisma.dagRun.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'run-1' } as any);
    vi.mocked(prisma.lineageEvent.create).mockResolvedValue({} as any);

    const event = createDagLevelEvent({
      job: {
        namespace: 'airflow',
        name: 'test_dag',
        facets: {
          airflow_dag: {
            schedule_interval: '@daily',
          },
        },
      },
    });

    await ingestLineage({
      organizationId: 'org-123',
      event,
    });

    expect(prisma.dag.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        schedule: '@daily',
      }),
      update: expect.objectContaining({
        schedule: '@daily',
      }),
    }));
  });
});
