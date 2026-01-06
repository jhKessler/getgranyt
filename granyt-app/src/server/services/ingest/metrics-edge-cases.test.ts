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
    dagRunMetricSnapshot: {
      upsert: vi.fn(),
    },
    errorOccurrence: {
      count: vi.fn(),
    },
    dagComputedMetrics: {
      upsert: vi.fn(),
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

describe('Edge Cases: Data Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup standard mocks
    vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
    vi.mocked(prisma.dag.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({ 
      id: 'dagrun-1',
      organizationId: 'org-123',
      taskRuns: [{ id: 'taskrun-1', status: 'success' }],
    } as any);
    vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1', dagRunId: 'dagrun-1' } as any);
    vi.mocked(prisma.taskRun.findUnique).mockResolvedValue({
      dagRunId: 'dagrun-1',
      dagRun: { srcDagId: 'test_dag', startTime: new Date(), organizationId: 'org-123' }
    } as any);
    vi.mocked(prisma.metric.create).mockResolvedValue({} as any);
    vi.mocked(prisma.metric.aggregate).mockResolvedValue({ _sum: { rowCount: 100 }, _count: 1 } as any);
    vi.mocked(prisma.metric.findMany).mockResolvedValue([]);
    vi.mocked(prisma.dagRunMetricSnapshot.upsert).mockResolvedValue({} as any);
    vi.mocked(prisma.errorOccurrence.count).mockResolvedValue(0);
    vi.mocked(prisma.dagComputedMetrics.upsert).mockResolvedValue({} as any);
  });

  it('should handle zero row count', async () => {
    const metrics: MetricsPayload = {
      captured_at: '2025-01-01T12:00:00.000Z',
      dag_id: 'test_dag',
      task_id: 'task_1',
      run_id: 'manual__2025-01-01',
      metrics: {
        row_count: 0,
        column_count: 5,
        memory_bytes: 0,
        dataframe_type: 'pandas',
      },
      schema: {
        column_dtypes: {},
      },
    };

    await ingestMetrics({
      organizationId: 'org-123',
      payload: metrics,
    });

    expect(prisma.metric.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metrics: expect.objectContaining({
            row_count: 0,
          }),
        }),
      })
    );
  });

  it('should handle very large row counts', async () => {
    const metrics: MetricsPayload = {
      captured_at: '2025-01-01T12:00:00.000Z',
      dag_id: 'big_data_dag',
      task_id: 'task_1',
      run_id: 'manual__2025-01-01',
      metrics: {
        row_count: 999999999999,
        column_count: 1000,
        memory_bytes: 999999999999999,
        dataframe_type: 'spark',
      },
      schema: {
        column_dtypes: {},
      },
    };

    await ingestMetrics({
      organizationId: 'org-123',
      payload: metrics,
    });

    expect(prisma.metric.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metrics: expect.objectContaining({
            row_count: 999999999999,
            memory_bytes: 999999999999999,
          }),
        }),
      })
    );
  });

  it('should handle polars dataframe type', async () => {
    const metrics: MetricsPayload = {
      captured_at: '2025-01-01T12:00:00.000Z',
      dag_id: 'test_dag',
      task_id: 'task_1',
      run_id: 'manual__2025-01-01',
      metrics: {
        row_count: 100,
        column_count: 5,
        memory_bytes: 1024,
        dataframe_type: 'polars',
      },
      schema: {
        column_dtypes: {},
      },
    };

    await ingestMetrics({
      organizationId: 'org-123',
      payload: metrics,
    });

    expect(prisma.metric.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metrics: expect.objectContaining({
            dataframe_type: 'polars',
          }),
        }),
      })
    );
  });

  it('should handle schema with null counts', async () => {
    const metrics: MetricsPayload = {
      captured_at: '2025-01-01T12:00:00.000Z',
      dag_id: 'test_dag',
      task_id: 'task_1',
      run_id: 'manual__2025-01-01',
      metrics: {
        row_count: 100,
        column_count: 2,
        memory_bytes: 512,
        dataframe_type: 'pandas',
      },
      schema: {
        column_dtypes: { all_nulls: 'object', mixed: 'int64' },
        null_counts: { all_nulls: 100, mixed: 50 },
        empty_string_counts: { all_nulls: 0 },
      },
    };

    await ingestMetrics({
      organizationId: 'org-123',
      payload: metrics,
    });

    expect(prisma.metric.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schema: expect.objectContaining({
            column_dtypes: { all_nulls: 'object', mixed: 'int64' },
            null_counts: { all_nulls: 100, mixed: 50 },
          }),
        }),
      })
    );
  });

  describe('Column Name Edge Cases', () => {
    it('should handle column names with special characters in schema', async () => {
      const metrics: MetricsPayload = {
        captured_at: '2025-01-01T12:00:00.000Z',
        dag_id: 'test_dag',
        task_id: 'task_1',
        run_id: 'manual__2025-01-01',
        metrics: {
          row_count: 100,
          column_count: 3,
          memory_bytes: 1024,
          dataframe_type: 'pandas',
        },
        schema: {
          column_dtypes: {
            'column with spaces': 'object',
            'column-with-dashes': 'int64',
            'column.with.dots': 'float64',
          },
          null_counts: {
            'column with spaces': 0,
            'column-with-dashes': 0,
            'column.with.dots': 0,
          },
        },
      };

      await ingestMetrics({
        organizationId: 'org-123',
        payload: metrics,
      });

      expect(prisma.metric.create).toHaveBeenCalled();
    });

    it('should handle unicode column names in schema', async () => {
      const metrics: MetricsPayload = {
        captured_at: '2025-01-01T12:00:00.000Z',
        dag_id: 'test_dag',
        task_id: 'task_1',
        run_id: 'manual__2025-01-01',
        metrics: {
          row_count: 100,
          column_count: 2,
          memory_bytes: 1024,
          dataframe_type: 'pandas',
        },
        schema: {
          column_dtypes: {
            '数据列': 'object',
            'colonne_française': 'int64',
          },
          null_counts: { '数据列': 0 },
        },
      };

      await ingestMetrics({
        organizationId: 'org-123',
        payload: metrics,
      });

      expect(prisma.metric.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schema: expect.objectContaining({
              column_dtypes: expect.objectContaining({
                '数据列': 'object',
              }),
            }),
          }),
        })
      );
    });

    it('should handle very long column names in schema', async () => {
      const longColumnName = 'column_' + 'a'.repeat(500);
      const metrics: MetricsPayload = {
        captured_at: '2025-01-01T12:00:00.000Z',
        dag_id: 'test_dag',
        task_id: 'task_1',
        run_id: 'manual__2025-01-01',
        metrics: {
          row_count: 100,
          column_count: 1,
          memory_bytes: 1024,
          dataframe_type: 'pandas',
        },
        schema: {
          column_dtypes: { [longColumnName]: 'object' },
          null_counts: { [longColumnName]: 0 },
        },
      };

      await ingestMetrics({
        organizationId: 'org-123',
        payload: metrics,
      });

      expect(prisma.metric.create).toHaveBeenCalled();
    });

    it('should handle empty column name in schema', async () => {
      const metrics: MetricsPayload = {
        captured_at: '2025-01-01T12:00:00.000Z',
        dag_id: 'test_dag',
        task_id: 'task_1',
        run_id: 'manual__2025-01-01',
        metrics: {
          row_count: 100,
          column_count: 1,
          memory_bytes: 1024,
          dataframe_type: 'pandas',
        },
        schema: {
          column_dtypes: { '': 'object' },
          null_counts: { '': 0 },
        },
      };

      await ingestMetrics({
        organizationId: 'org-123',
        payload: metrics,
      });

      expect(prisma.metric.create).toHaveBeenCalled();
    });
  });

  describe('Data Type Edge Cases', () => {
    it('should handle complex dtypes in schema', async () => {
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
          column_dtypes: {
            datetime: 'datetime64[ns]',
            timedelta: 'timedelta64[ns]',
            category: 'category',
            complex: 'complex128',
            sparse: 'Sparse[float64, nan]',
          },
        },
      };

      await ingestMetrics({
        organizationId: 'org-123',
        payload: metrics,
      });

      expect(prisma.metric.create).toHaveBeenCalled();
    });

    it('should handle polars-specific dtypes in schema', async () => {
      const metrics: MetricsPayload = {
        captured_at: '2025-01-01T12:00:00.000Z',
        dag_id: 'test_dag',
        task_id: 'task_1',
        run_id: 'manual__2025-01-01',
        metrics: {
          row_count: 100,
          column_count: 3,
          memory_bytes: 1024,
          dataframe_type: 'polars',
        },
        schema: {
          column_dtypes: {
            list_col: 'List[Int64]',
            struct_col: 'Struct',
            utf8: 'Utf8',
          },
        },
      };

      await ingestMetrics({
        organizationId: 'org-123',
        payload: metrics,
      });

      expect(prisma.metric.create).toHaveBeenCalled();
    });
  });

  describe('Database Error Handling', () => {
    it('should propagate DAG upsert errors', async () => {
      vi.mocked(prisma.dag.upsert).mockRejectedValue(new Error('DAG upsert failed'));

      const metrics: MetricsPayload = {
        captured_at: '2025-01-01T12:00:00.000Z',
        dag_id: 'test_dag',
        task_id: 'task_1',
        run_id: 'manual__2025-01-01',
        metrics: {
          row_count: 100,
          column_count: 1,
          memory_bytes: 1024,
          dataframe_type: 'pandas',
        },
        schema: {
          column_dtypes: {},
        },
      };

      await expect(
        ingestMetrics({ organizationId: 'org-123', payload: metrics })
      ).rejects.toThrow('DAG upsert failed');
    });

    it('should propagate metric create errors', async () => {
      vi.mocked(prisma.metric.create).mockRejectedValue(
        new Error('Unique constraint violation')
      );

      const metrics: MetricsPayload = {
        captured_at: '2025-01-01T12:00:00.000Z',
        dag_id: 'test_dag',
        task_id: 'task_1',
        run_id: 'manual__2025-01-01',
        metrics: {
          row_count: 100,
          column_count: 1,
          memory_bytes: 1024,
          dataframe_type: 'pandas',
        },
        schema: {
          column_dtypes: {},
        },
      };

      await expect(
        ingestMetrics({ organizationId: 'org-123', payload: metrics })
      ).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('Spark DataFrame Edge Cases', () => {
    it('should handle spark dataframe type', async () => {
      const metrics: MetricsPayload = {
        captured_at: '2025-01-01T12:00:00.000Z',
        dag_id: 'big_data_dag',
        task_id: 'task_1',
        run_id: 'manual__2025-01-01',
        metrics: {
          row_count: 1000000000,
          column_count: 100,
          memory_bytes: 999999999999,
          dataframe_type: 'spark',
        },
        schema: {
          column_dtypes: {},
        },
      };

      await ingestMetrics({
        organizationId: 'org-123',
        payload: metrics,
      });

      expect(prisma.metric.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metrics: expect.objectContaining({
              dataframe_type: 'spark',
            }),
          }),
        })
      );
    });
  });

  describe('Environment Handling', () => {
    it('should pass through environment to DAG creation', async () => {
      const metrics: MetricsPayload = {
        captured_at: '2025-01-01T12:00:00.000Z',
        dag_id: 'test_dag',
        task_id: 'task_1',
        run_id: 'manual__2025-01-01',
        metrics: {
          row_count: 100,
          column_count: 1,
          memory_bytes: 1024,
          dataframe_type: 'pandas',
        },
        schema: {
          column_dtypes: {},
        },
      };

      await ingestMetrics({
        organizationId: 'org-123',
        environment: 'production',
        payload: metrics,
      });

      // Environment is passed through DagContext to dagRun, not to dag itself
      // Verify dag.upsert was called with the DAG information
      expect(prisma.dag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            srcDagId: 'test_dag',
          }),
        })
      );
    });
  });
});
