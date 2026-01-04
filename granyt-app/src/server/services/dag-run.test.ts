import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveDagContext, ensureDagExists, findOrCreateDagRun, findOrCreateTaskRun } from './dag-run';

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
    },
    taskRun: {
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('DAG Run Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureDagExists', () => {
    it('should upsert DAG record', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);

      await ensureDagExists({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        namespace: 'airflow',
        timestamp: new Date('2025-01-01'),
      });

      expect(prisma.dag.upsert).toHaveBeenCalledWith({
        where: {
          organizationId_srcDagId_namespace: {
            organizationId: 'org-123',
            srcDagId: 'test_dag',
            namespace: 'airflow',
          },
        },
        create: expect.objectContaining({
          organizationId: 'org-123',
          srcDagId: 'test_dag',
          namespace: 'airflow',
        }),
        update: expect.objectContaining({
          lastSeenAt: expect.any(Date),
        }),
      });
    });
  });

  describe('findOrCreateDagRun', () => {
    it('should return existing DagRun if found', async () => {
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({
        id: 'dagrun-123',
      } as any);

      const result = await findOrCreateDagRun({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcRunId: 'manual__2025-01-01',
        timestamp: new Date(),
      });

      expect(result.id).toBe('dagrun-123');
      expect(prisma.dagRun.create).not.toHaveBeenCalled();
    });

    it('should create DagRun if not found', async () => {
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({
        id: 'new-dagrun-123',
      } as any);

      const result = await findOrCreateDagRun({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcRunId: 'manual__2025-01-01',
        timestamp: new Date(),
      });

      expect(result.id).toBe('new-dagrun-123');
      expect(prisma.dagRun.create).toHaveBeenCalled();
    });

    it('should set runType to manual for manual runs', async () => {
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'run-1' } as any);

      await findOrCreateDagRun({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcRunId: 'manual__2025-01-01',
        timestamp: new Date(),
      });

      expect(prisma.dagRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            runType: 'manual',
          }),
        })
      );
    });

    it('should set runType to scheduled for scheduled runs', async () => {
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dagRun.create).mockResolvedValue({ id: 'run-1' } as any);

      await findOrCreateDagRun({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcRunId: 'scheduled__2025-01-01',
        timestamp: new Date(),
      });

      expect(prisma.dagRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            runType: 'scheduled',
          }),
        })
      );
    });
  });

  describe('findOrCreateTaskRun', () => {
    it('should upsert TaskRun record', async () => {
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({
        id: 'taskrun-123',
      } as any);

      const result = await findOrCreateTaskRun({
        organizationId: 'org-123',
        dagRunId: 'dagrun-123',
        srcTaskId: 'task_1',
        operator: 'PythonOperator',
      });

      expect(result.id).toBe('taskrun-123');
      expect(prisma.taskRun.upsert).toHaveBeenCalledWith({
        where: {
          dagRunId_srcTaskId: {
            dagRunId: 'dagrun-123',
            srcTaskId: 'task_1',
          },
        },
        create: expect.objectContaining({
          organizationId: 'org-123',
          dagRunId: 'dagrun-123',
          srcTaskId: 'task_1',
          operator: 'PythonOperator',
        }),
        update: expect.objectContaining({
          operator: 'PythonOperator',
        }),
      });
    });
  });

  describe('resolveDagContext', () => {
    it('should throw error when srcRunId is missing', async () => {
      await expect(resolveDagContext({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcTaskId: 'task_1',
        srcRunId: null,
        timestamp: new Date(),
      })).rejects.toThrow('Insufficient DAG context: dag_id, task_id, and run_id are required');
    });

    it('should throw error when srcTaskId is missing', async () => {
      await expect(resolveDagContext({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcTaskId: null,
        srcRunId: 'run-123',
        timestamp: new Date(),
      })).rejects.toThrow('Insufficient DAG context: dag_id, task_id, and run_id are required');
    });

    it('should throw error when srcDagId is missing', async () => {
      await expect(resolveDagContext({
        organizationId: 'org-123',
        srcDagId: '',
        srcTaskId: 'task_1',
        srcRunId: 'run-123',
        timestamp: new Date(),
      })).rejects.toThrow('Insufficient DAG context: dag_id, task_id, and run_id are required');
    });

    it('should return taskRunId when all context is provided', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);

      const result = await resolveDagContext({
        organizationId: 'org-123',
        srcDagId: 'test_dag',
        srcTaskId: 'task_1',
        srcRunId: 'run-123',
        timestamp: new Date(),
      });

      expect(result).toBe('taskrun-1');
    });
  });
});
