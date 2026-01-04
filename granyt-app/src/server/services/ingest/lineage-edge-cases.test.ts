import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { OpenLineageEvent } from '@/lib/validators';
import { ingestLineage } from '../ingest';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dag: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
    },
    dagRun: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
    },
    dagRunMetricSnapshot: {
      upsert: vi.fn(),
    },
    taskRun: {
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

const setupStandardMocks = () => {
  vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
  vi.mocked(prisma.dag.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.dagRun.upsert).mockResolvedValue({ id: 'run-1' } as any);
  vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({
    id: 'run-1',
    organizationId: 'org-123',
    startTime: new Date('2025-01-01T11:00:00Z'),
    taskRuns: [{ id: 'task-run-1', status: 'success' }],
  } as any);
  vi.mocked(prisma.lineageEvent.create).mockResolvedValue({} as any);
  vi.mocked(prisma.metric.findMany).mockResolvedValue([]);
  vi.mocked(prisma.metric.aggregate).mockResolvedValue({ _sum: { rowCount: 0 } } as any);
  vi.mocked(prisma.dagRunMetricSnapshot.upsert).mockResolvedValue({} as any);
  vi.mocked(prisma.errorOccurrence.count).mockResolvedValue(0);
  vi.mocked(prisma.alertEvaluationJob.upsert).mockResolvedValue({ id: 'job-1', status: 'pending' } as any);
  vi.mocked(prisma.taskRun.upsert).mockResolvedValue({} as any);
};

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

describe('Edge Cases: Lineage Events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStandardMocks();
  });

  describe('Event Without Parent Facet', () => {
    it('should handle task event without parent facet', async () => {
      const event: OpenLineageEvent = {
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
          // No parent facet!
        },
      };

      const result = await ingestLineage({
        organizationId: 'org-123',
        environment: 'production',
        event,
      });

      expect(result.srcDagId).toBe('test_dag');
      expect(result.srcTaskId).toBe('task_1');
    });
  });

  describe('Event Type Edge Cases', () => {
    it('should handle ABORT event type', async () => {
      const event = createDagLevelEvent({ eventType: 'ABORT' });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.eventType).toBe('ABORT');
      expect(prisma.dagRun.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: 'FAILED',
          }),
        })
      );
    });

    it('should handle RUNNING event type', async () => {
      const event = createDagLevelEvent({ eventType: 'RUNNING' });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.eventType).toBe('RUNNING');
    });

    it('should handle OTHER event type', async () => {
      const event = createDagLevelEvent({ eventType: 'OTHER' });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.eventType).toBe('OTHER');
    });
  });

  describe('Environment Handling', () => {
    it('should store environment on lineage event handling', async () => {
      const event = createDagLevelEvent();

      await ingestLineage({
        organizationId: 'org-123',
        environment: 'staging',
        event,
      });

      expect(prisma.dagRun.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            environment: 'staging',
          }),
        })
      );
    });

    it('should handle undefined environment', async () => {
      const event = createDagLevelEvent();

      await ingestLineage({
        organizationId: 'org-123',
        environment: undefined,
        event,
      });

      expect(prisma.dagRun.upsert).toHaveBeenCalled();
    });

    it('should handle empty string environment', async () => {
      const event = createDagLevelEvent();

      await ingestLineage({
        organizationId: 'org-123',
        environment: '',
        event,
      });

      expect(prisma.dagRun.upsert).toHaveBeenCalled();
    });
  });

  describe('Out of Order Events', () => {
    it('should handle COMPLETE event when no prior START recorded', async () => {
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null); // No existing run

      const event = createDagLevelEvent({ eventType: 'COMPLETE' });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.eventType).toBe('COMPLETE');
      // Should still create/update the dag run
      expect(prisma.dagRun.upsert).toHaveBeenCalled();
    });

    it('should handle FAIL event when no prior START recorded', async () => {
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);

      const event = createDagLevelEvent({ eventType: 'FAIL' });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.eventType).toBe('FAIL');
    });
  });

  describe('Input/Output Datasets', () => {
    it('should handle event with input datasets', async () => {
      const event = createTaskLevelEvent({
        inputs: [
          {
            namespace: 'postgres://localhost:5432',
            name: 'public.users',
          },
          {
            namespace: 's3://my-bucket',
            name: 'data/raw/events.parquet',
          },
        ],
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.isTaskLevel).toBe(true);
      expect(prisma.lineageEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rawEvent: expect.objectContaining({
              inputs: expect.arrayContaining([
                expect.objectContaining({ name: 'public.users' }),
              ]),
            }),
          }),
        })
      );
    });

    it('should handle event with output datasets', async () => {
      const event = createTaskLevelEvent({
        outputs: [
          {
            namespace: 'postgres://localhost:5432',
            name: 'public.processed_users',
          },
        ],
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.isTaskLevel).toBe(true);
    });

    it('should handle event with both inputs and outputs', async () => {
      const event = createTaskLevelEvent({
        inputs: [{ namespace: 's3://bucket', name: 'input.csv' }],
        outputs: [{ namespace: 's3://bucket', name: 'output.csv' }],
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.isTaskLevel).toBe(true);
    });

    it('should handle empty inputs and outputs arrays', async () => {
      const event = createTaskLevelEvent({
        inputs: [],
        outputs: [],
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.isTaskLevel).toBe(true);
    });
  });

  describe('Job Facets', () => {
    it('should handle event with documentation facet', async () => {
      const event = createDagLevelEvent({
        job: {
          namespace: 'airflow',
          name: 'documented_dag',
          facets: {
            documentation: {
              _producer: 'https://airflow.apache.org',
              _schemaURL: 'https://openlineage.io/spec/facets/1-0-0/DocumentationJobFacet.json',
              description: 'This DAG processes user data daily',
            },
          },
        },
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.srcDagId).toBe('documented_dag');
    });

    it('should handle event with ownership facet', async () => {
      const event = createDagLevelEvent({
        job: {
          namespace: 'airflow',
          name: 'owned_dag',
          facets: {
            ownership: {
              _producer: 'https://airflow.apache.org',
              _schemaURL: 'https://openlineage.io/spec/facets/1-0-0/OwnershipJobFacet.json',
              owners: [{ name: 'data-team', type: 'team' }],
            },
          },
        },
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.srcDagId).toBe('owned_dag');
    });
  });

  describe('Run Facets', () => {
    it('should handle event with error message facet', async () => {
      const event = createDagLevelEvent({
        eventType: 'FAIL',
        run: {
          runId: 'manual__2025-01-01',
          facets: {
            errorMessage: {
              _producer: 'https://airflow.apache.org',
              _schemaURL: 'https://openlineage.io/spec/facets/1-0-0/ErrorMessageRunFacet.json',
              message: 'Task failed due to connection timeout',
              programmingLanguage: 'python',
              stackTrace: 'Traceback (most recent call last):\n  File "main.py", line 42',
            },
          },
        },
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.eventType).toBe('FAIL');
    });

    it('should handle event with nominal time facet', async () => {
      const event = createDagLevelEvent({
        run: {
          runId: 'scheduled__2025-01-01',
          facets: {
            nominalTime: {
              _producer: 'https://airflow.apache.org',
              _schemaURL: 'https://openlineage.io/spec/facets/1-0-0/NominalTimeRunFacet.json',
              nominalStartTime: '2025-01-01T00:00:00Z',
              nominalEndTime: '2025-01-02T00:00:00Z',
            },
          },
        },
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      // The function processes the event successfully - srcRunId is not returned
      // but the event is processed with the nominal time facet
      expect(result.eventType).toBeDefined();
      expect(result.srcDagId).toBe('test_dag');
    });
  });

  describe('Database Error Handling', () => {
    it('should propagate DAG upsert errors', async () => {
      vi.mocked(prisma.dag.upsert).mockRejectedValue(new Error('DAG upsert failed'));

      const event = createDagLevelEvent();

      await expect(
        ingestLineage({ organizationId: 'org-123', event })
      ).rejects.toThrow('DAG upsert failed');
    });

    it('should propagate DagRun upsert errors', async () => {
      vi.mocked(prisma.dagRun.upsert).mockRejectedValue(new Error('Connection timeout'));

      const event = createDagLevelEvent();

      await expect(
        ingestLineage({ organizationId: 'org-123', event })
      ).rejects.toThrow('Connection timeout');
    });

    it('should propagate lineageEvent create errors', async () => {
      vi.mocked(prisma.lineageEvent.create).mockRejectedValue(
        new Error('Unique constraint violation')
      );

      const event = createDagLevelEvent();

      await expect(
        ingestLineage({ organizationId: 'org-123', event })
      ).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('Job Name Edge Cases', () => {
    it('should handle job name with multiple dots', async () => {
      const event: OpenLineageEvent = {
        ...createTaskLevelEvent(),
        job: {
          namespace: 'airflow',
          name: 'namespace.dag_name.task_group.subtask',
        },
      };

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      // Should extract properly even with multiple dots
      expect(result.isTaskLevel).toBe(true);
    });

    it('should handle job name without dots (DAG level)', async () => {
      const event = createDagLevelEvent({
        job: { namespace: 'airflow', name: 'simple_dag_name' },
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.isTaskLevel).toBe(false);
      expect(result.srcDagId).toBe('simple_dag_name');
    });

    it('should handle job name with unicode characters', async () => {
      const event = createDagLevelEvent({
        job: { namespace: 'airflow', name: 'dag_数据_🚀' },
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.srcDagId).toBe('dag_数据_🚀');
    });

    it('should handle very long job name', async () => {
      const longName = 'dag_' + 'a'.repeat(500);
      const event = createDagLevelEvent({
        job: { namespace: 'airflow', name: longName },
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.srcDagId).toBe(longName);
    });
  });

  describe('Timestamp Edge Cases', () => {
    it('should handle eventTime with microseconds', async () => {
      const event = createDagLevelEvent({
        eventTime: '2025-01-01T12:00:00.123456Z',
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.eventType).toBe('START');
    });

    it('should handle eventTime with timezone offset', async () => {
      const event = createDagLevelEvent({
        eventTime: '2025-01-01T17:30:00+05:30',
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.eventType).toBe('START');
    });

    it('should handle eventTime in the far past', async () => {
      const event = createDagLevelEvent({
        eventTime: '1990-01-01T00:00:00Z',
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.eventType).toBe('START');
    });
  });

  describe('Namespace Edge Cases', () => {
    it('should handle custom namespace', async () => {
      const event = createDagLevelEvent({
        job: { namespace: 'custom_namespace', name: 'test_dag' },
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.srcDagId).toBe('test_dag');
    });

    it('should handle namespace with special characters', async () => {
      const event = createDagLevelEvent({
        job: { namespace: 'namespace:with/special-chars', name: 'test_dag' },
      });

      const result = await ingestLineage({
        organizationId: 'org-123',
        event,
      });

      expect(result.srcDagId).toBe('test_dag');
    });
  });
});
