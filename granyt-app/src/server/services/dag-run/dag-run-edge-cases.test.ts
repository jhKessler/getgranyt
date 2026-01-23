import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveDagContext, ensureDagExists, findOrCreateDagRun, findOrCreateTaskRun } from '../dag-run';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dag: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
    },
    dagRun: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    taskRun: {
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Edge Cases: DAG Run Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Run Type Detection', () => {
    it('should detect backfill run type', async () => {
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'run-1' } as any);

      await findOrCreateDagRun({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcRunId: 'backfill__2025-01-01',
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

    it('should handle unknown run type prefixes as unknown', async () => {
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'run-1' } as any);

      await findOrCreateDagRun({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcRunId: 'custom_prefix__2025-01-01',
        timestamp: new Date(),
      });

      expect(prisma.dagRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            runType: 'unknown', // Unrecognized prefix returns 'unknown'
          }),
        })
      );
    });

    it('should handle run ID without prefix separator', async () => {
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'run-1' } as any);

      await findOrCreateDagRun({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcRunId: 'simple-run-id-no-prefix',
        timestamp: new Date(),
      });

      expect(prisma.dagRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            runType: 'unknown', // No recognized prefix
          }),
        })
      );
    });

    it('should handle triggered run type as unknown', async () => {
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'run-1' } as any);

      await findOrCreateDagRun({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcRunId: 'triggered__2025-01-01T10:00:00+00:00',
        timestamp: new Date(),
      });

      expect(prisma.dagRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            runType: 'unknown', // 'triggered__' is not a recognized prefix
          }),
        })
      );
    });
  });

  describe('Timestamp Edge Cases', () => {
    it('should handle timestamp in the far future', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);

      const futureDate = new Date('2099-12-31T23:59:59.999Z');

      await ensureDagExists({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        namespace: 'airflow',
        timestamp: futureDate,
      });

      expect(prisma.dag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            lastSeenAt: futureDate,
          }),
        })
      );
    });

    it('should handle timestamp in the far past', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);

      const pastDate = new Date('1990-01-01T00:00:00.000Z');

      await ensureDagExists({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        namespace: 'airflow',
        timestamp: pastDate,
      });

      expect(prisma.dag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            lastSeenAt: pastDate,
          }),
        })
      );
    });

    it('should handle invalid date object gracefully', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);

      const invalidDate = new Date('invalid');

      await ensureDagExists({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        namespace: 'airflow',
        timestamp: invalidDate,
      });

      // Should still call upsert (database will handle invalid date)
      expect(prisma.dag.upsert).toHaveBeenCalled();
    });
  });

  describe('DAG ID Edge Cases', () => {
    it('should handle DAG ID with special characters', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);

      await ensureDagExists({
        organizationId: 'org-123',
        srcDagId: 'dag-with_special.chars:v2',
        namespace: 'airflow',
        timestamp: new Date(),
      });

      expect(prisma.dag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId_srcDagId_namespace: expect.objectContaining({
              srcDagId: 'dag-with_special.chars:v2',
            }),
          }),
        })
      );
    });

    it('should handle very long DAG ID', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);

      const longDagId = 'dag_' + 'a'.repeat(500);

      await ensureDagExists({
        organizationId: 'org-123',
        srcDagId: longDagId,
        namespace: 'airflow',
        timestamp: new Date(),
      });

      expect(prisma.dag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            srcDagId: longDagId,
          }),
        })
      );
    });

    it('should handle DAG ID with unicode characters', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);

      await ensureDagExists({
        organizationId: 'org-123',
        srcDagId: 'dag_数据管道_🚀',
        namespace: 'airflow',
        timestamp: new Date(),
      });

      expect(prisma.dag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            srcDagId: 'dag_数据管道_🚀',
          }),
        })
      );
    });
  });

  describe('Task Operator Edge Cases', () => {
    it('should handle empty operator string', async () => {
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);

      await findOrCreateTaskRun({
        organizationId: 'org-123',
        dagRunId: 'dagrun-1',
        srcTaskId: 'task_1',
        operator: '',
      });

      expect(prisma.taskRun.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            operator: '',
          }),
        })
      );
    });

    it('should handle null operator', async () => {
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);

      await findOrCreateTaskRun({
        organizationId: 'org-123',
        dagRunId: 'dagrun-1',
        srcTaskId: 'task_1',
        operator: undefined,
      });

      expect(prisma.taskRun.upsert).toHaveBeenCalled();
    });

    it('should handle very long operator name', async () => {
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);

      const longOperator = 'CustomOperator' + 'Extension'.repeat(100);

      await findOrCreateTaskRun({
        organizationId: 'org-123',
        dagRunId: 'dagrun-1',
        srcTaskId: 'task_1',
        operator: longOperator,
      });

      expect(prisma.taskRun.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            operator: longOperator,
          }),
        })
      );
    });
  });

  describe('Database Error Handling', () => {
    it('should propagate database errors from dag upsert', async () => {
      vi.mocked(prisma.dag.upsert).mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(
        ensureDagExists({
          organizationId: 'org-123',
          srcDagId: 'test_dag',
          namespace: 'airflow',
          timestamp: new Date(),
        })
      ).rejects.toThrow('Unique constraint violation');
    });

    it('should propagate database errors from dagRun create', async () => {
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockRejectedValue(
        new Error('Foreign key constraint failed')
      );

      await expect(
        findOrCreateDagRun({
          organizationId: 'org-123',
          srcDagId: 'test_dag',
          srcRunId: 'manual__2025-01-01',
          timestamp: new Date(),
        })
      ).rejects.toThrow('Foreign key constraint failed');
    });

    it('should propagate database errors from taskRun upsert', async () => {
      vi.mocked(prisma.taskRun.upsert).mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(
        findOrCreateTaskRun({
          organizationId: 'org-123',
          dagRunId: 'dagrun-1',
          srcTaskId: 'task_1',
          operator: 'PythonOperator',
        })
      ).rejects.toThrow('Connection timeout');
    });
  });

  describe('Namespace Handling', () => {
    it('should handle custom namespace', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);

      await ensureDagExists({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        namespace: 'custom_namespace',
        timestamp: new Date(),
      });

      expect(prisma.dag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId_srcDagId_namespace: expect.objectContaining({
              namespace: 'custom_namespace',
            }),
          }),
        })
      );
    });

    it('should handle empty namespace', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);

      await ensureDagExists({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        namespace: '',
        timestamp: new Date(),
      });

      expect(prisma.dag.upsert).toHaveBeenCalled();
    });
  });

  describe('resolveDagContext Edge Cases', () => {
    it('should handle undefined values correctly', async () => {
      await expect(
        resolveDagContext({
          organizationId: 'org-123',
          srcDagId: undefined as unknown as string,
          srcTaskId: 'task_1',
          srcRunId: 'run-123',
          timestamp: new Date(),
        })
      ).rejects.toThrow();
    });

    it('should handle whitespace-only dag ID', async () => {
      // Whitespace is truthy so it passes validation and fails at DB level
      // This documents the current behavior - could be improved to validate input
      vi.mocked(prisma.dag.upsert).mockRejectedValue(new Error('Foreign key constraint failed'));
      
      await expect(
        resolveDagContext({
          organizationId: 'org-123',
          srcDagId: '   ',
          srcTaskId: 'task_1',
          srcRunId: 'run-123',
          timestamp: new Date(),
        })
      ).rejects.toThrow();
    });

    it('should pass through environment when provided', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      // With environment in unique key, findUnique returns null if no run exists with that environment
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);

      await resolveDagContext({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcTaskId: 'task_1',
        srcRunId: 'run-123',
        timestamp: new Date(),
        environment: 'staging',
      });

      // Should create dagRun with the specified environment
      expect(prisma.dagRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            environment: 'staging',
          }),
        })
      );
    });
  });
});
