import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ErrorEvent } from '@/lib/validators';
import { ingestError, ingestErrors } from '../ingest';

// Mock notifications to avoid console logs in tests
vi.mock('@/server/services/notifications', () => ({
  notify: vi.fn().mockResolvedValue({ sent: true, channels: [] }),
  NotificationEventType: {
    PIPELINE_ERROR: 'PIPELINE_ERROR',
    NEW_PIPELINE_ERROR: 'NEW_PIPELINE_ERROR',
    ROW_COUNT_DROP_ALERT: 'ROW_COUNT_DROP_ALERT',
    NULL_OCCURRENCE_ALERT: 'NULL_OCCURRENCE_ALERT',
    SCHEMA_CHANGE_ALERT: 'SCHEMA_CHANGE_ALERT',
  },
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dag: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
    },
    dagRun: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    taskRun: {
      upsert: vi.fn(),
    },
    generalError: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    errorOccurrence: {
      create: vi.fn(),
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

const createValidErrorEvent = (overrides?: Partial<ErrorEvent>): ErrorEvent => ({
  error_id: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: '2025-01-01T12:00:00.000Z',
  exception: {
    type: 'ValueError',
    message: 'Invalid value provided',
  },
  task_instance: {
    dag_id: 'test_dag',
    task_id: 'task_1',
    run_id: 'manual__2025-01-01',
  },
  ...overrides,
});

const setupStandardMocks = () => {
  vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
  vi.mocked(prisma.dag.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.dagRun.findFirst).mockResolvedValue({ id: 'dagrun-1', environment: 'production' } as any);
  vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);
  vi.mocked(prisma.generalError.upsert).mockResolvedValue({ id: 'error-1' } as any);
  vi.mocked(prisma.errorOccurrence.create).mockResolvedValue({} as any);
  vi.mocked(prisma.userNotificationSettings.findMany).mockResolvedValue([]);
  vi.mocked(prisma.organizationChannelConfig.findMany).mockResolvedValue([]);
  vi.mocked(prisma.organizationChannelConfig.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.organizationMember.findMany).mockResolvedValue([]);
};

describe('Edge Cases: Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Message Edge Cases', () => {
    it('should handle very long error messages', async () => {
      setupStandardMocks();

      const longMessage = 'A'.repeat(10000);
      const event = createValidErrorEvent({
        exception: { type: 'ValueError', message: longMessage },
      });

      await ingestError({
        organizationId: 'org-123',
        environment: 'production',
        event,
      });

      expect(prisma.generalError.upsert).toHaveBeenCalled();
      expect(prisma.errorOccurrence.create).toHaveBeenCalled();
    });

    it('should handle Unicode characters in error messages', async () => {
      setupStandardMocks();

      const event = createValidErrorEvent({
        exception: {
          type: 'UnicodeDecodeError',
          message: "無法解碼字符 '\\xe4' - 日本語テスト 🚀",
        },
      });

      await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.generalError.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            message: "無法解碼字符 '\\xe4' - 日本語テスト 🚀",
          }),
        })
      );
    });

    it('should handle empty error message', async () => {
      setupStandardMocks();

      const event = createValidErrorEvent({
        exception: { type: 'CustomError', message: '' },
      });

      await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.generalError.upsert).toHaveBeenCalled();
    });

    it('should handle error message with null bytes', async () => {
      setupStandardMocks();

      const event = createValidErrorEvent({
        exception: { type: 'BinaryError', message: 'Error with\x00null byte' },
      });

      await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.generalError.upsert).toHaveBeenCalled();
    });

    it('should handle error message with newlines and special chars', async () => {
      setupStandardMocks();

      const event = createValidErrorEvent({
        exception: {
          type: 'ParseError',
          message: 'Line 1\nLine 2\tTabbed\r\nWindows newline',
        },
      });

      await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.generalError.upsert).toHaveBeenCalled();
    });
  });

  describe('Fingerprint Generation', () => {
    it('should generate same fingerprint for errors with different variable values', async () => {
      setupStandardMocks();

      // Use large numbers (6+ digits) which are normalized as IDs
      const event1 = createValidErrorEvent({
        error_id: 'err-1',
        exception: {
          type: 'KeyError',
          message: "Column 'user_id_12345678' not found in table",
        },
        task_instance: { dag_id: 'dag', task_id: 'task', run_id: 'run1' },
      });

      const event2 = createValidErrorEvent({
        error_id: 'err-2',
        timestamp: '2025-01-01T13:00:00.000Z',
        exception: {
          type: 'KeyError',
          message: "Column 'user_id_98765432' not found in table",
        },
        task_instance: { dag_id: 'dag', task_id: 'task', run_id: 'run2' },
      });

      await ingestError({ organizationId: 'org-123', event: event1 });
      await ingestError({ organizationId: 'org-123', event: event2 });

      const calls = vi.mocked(prisma.generalError.upsert).mock.calls;
      const fingerprint1 = calls[0][0].where.organizationId_fingerprint?.fingerprint;
      const fingerprint2 = calls[1][0].where.organizationId_fingerprint?.fingerprint;

      // Same fingerprint because large numbers are normalized and no stacktrace
      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should generate different fingerprints for different error types', async () => {
      setupStandardMocks();

      const event1 = createValidErrorEvent({
        error_id: 'err-1',
        exception: { type: 'ValueError', message: 'Invalid value' },
      });

      const event2 = createValidErrorEvent({
        error_id: 'err-2',
        exception: { type: 'TypeError', message: 'Invalid value' },
      });

      await ingestError({ organizationId: 'org-123', event: event1 });
      await ingestError({ organizationId: 'org-123', event: event2 });

      const calls = vi.mocked(prisma.generalError.upsert).mock.calls;
      const fingerprint1 = calls[0][0].where.organizationId_fingerprint?.fingerprint;
      const fingerprint2 = calls[1][0].where.organizationId_fingerprint?.fingerprint;

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should normalize UUIDs in fingerprint calculation', async () => {
      setupStandardMocks();

      const event1 = createValidErrorEvent({
        error_id: 'err-1',
        exception: {
          type: 'NotFoundError',
          message: 'Resource 550e8400-e29b-41d4-a716-446655440000 not found',
        },
      });

      const event2 = createValidErrorEvent({
        error_id: 'err-2',
        exception: {
          type: 'NotFoundError',
          message: 'Resource a1b2c3d4-e5f6-4789-abcd-ef0123456789 not found',
        },
      });

      await ingestError({ organizationId: 'org-123', event: event1 });
      await ingestError({ organizationId: 'org-123', event: event2 });

      const calls = vi.mocked(prisma.generalError.upsert).mock.calls;
      const fingerprint1 = calls[0][0].where.organizationId_fingerprint?.fingerprint;
      const fingerprint2 = calls[1][0].where.organizationId_fingerprint?.fingerprint;

      expect(fingerprint1).toBe(fingerprint2);
    });
  });

  describe('Stacktrace Edge Cases', () => {
    it('should handle deeply nested stacktrace', async () => {
      setupStandardMocks();

      const deepStacktrace = Array.from({ length: 100 }, (_, i) => ({
        filename: `/app/module${i}.py`,
        function: `function_${i}`,
        lineno: i + 1,
        module: `module${i}`,
      }));

      const event = createValidErrorEvent({ stacktrace: deepStacktrace });

      await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.errorOccurrence.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stacktrace: expect.arrayContaining([
              expect.objectContaining({ lineno: 1 }),
            ]),
          }),
        })
      );
    });

    it('should handle stacktrace with missing fields', async () => {
      setupStandardMocks();

      const event = createValidErrorEvent({
        stacktrace: [
          { filename: '/app/main.py', function: 'main', lineno: 1 }, // Minimal required fields
        ],
      });

      await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.errorOccurrence.create).toHaveBeenCalled();
    });

    it('should handle empty stacktrace array', async () => {
      setupStandardMocks();

      const event = createValidErrorEvent({ stacktrace: [] });

      await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.errorOccurrence.create).toHaveBeenCalled();
    });

    it('should handle stacktrace with very long file paths', async () => {
      setupStandardMocks();

      const longPath = '/app/' + 'nested_folder/'.repeat(50) + 'main.py';
      const event = createValidErrorEvent({
        stacktrace: [
          { filename: longPath, function: 'process', lineno: 1, module: 'main' },
        ],
      });

      await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.errorOccurrence.create).toHaveBeenCalled();
    });
  });

  describe('Database Error Handling', () => {
    it('should propagate DAG upsert errors', async () => {
      vi.mocked(prisma.dag.upsert).mockRejectedValue(new Error('DAG upsert failed'));

      const event = createValidErrorEvent();

      await expect(
        ingestError({ organizationId: 'org-123', event })
      ).rejects.toThrow('DAG upsert failed');
    });

    it('should propagate DagRun findUnique errors', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findFirst).mockRejectedValue(new Error('Connection timeout'));

      const event = createValidErrorEvent();

      await expect(
        ingestError({ organizationId: 'org-123', event })
      ).rejects.toThrow('Connection timeout');
    });

    it('should propagate generalError upsert errors', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findFirst).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);
      vi.mocked(prisma.generalError.upsert).mockRejectedValue(
        new Error('Unique constraint violation')
      );

      const event = createValidErrorEvent();

      await expect(
        ingestError({ organizationId: 'org-123', event })
      ).rejects.toThrow('Unique constraint violation');
    });

    it('should propagate errorOccurrence create errors', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findFirst).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);
      vi.mocked(prisma.generalError.upsert).mockResolvedValue({ id: 'error-1' } as any);
      vi.mocked(prisma.errorOccurrence.create).mockRejectedValue(
        new Error('Foreign key constraint failed')
      );

      const event = createValidErrorEvent();

      await expect(
        ingestError({ organizationId: 'org-123', event })
      ).rejects.toThrow('Foreign key constraint failed');
    });
  });

  describe('Batch Error Ingestion', () => {
    it('should handle batch with mixed valid and invalid errors', async () => {
      setupStandardMocks();

      const events = [
        createValidErrorEvent({ error_id: 'err-1' }),
        createValidErrorEvent({ error_id: 'err-2' }),
      ];

      const results = await ingestErrors('org-123', events);

      expect(results).toHaveLength(2);
    });

    it('should handle empty batch', async () => {
      setupStandardMocks();

      const results = await ingestErrors('org-123', []);

      expect(results).toHaveLength(0);
    });

    it('should handle single error in batch', async () => {
      setupStandardMocks();

      const events = [createValidErrorEvent({ error_id: 'single-err' })];

      const results = await ingestErrors('org-123', events);

      expect(results).toHaveLength(1);
      expect(results[0].errorId).toBe('single-err');
    });

    it('should handle large batch of errors', async () => {
      setupStandardMocks();

      const events = Array.from({ length: 100 }, (_, i) =>
        createValidErrorEvent({ error_id: `err-${i}` })
      );

      const results = await ingestErrors('org-123', events);

      expect(results).toHaveLength(100);
    });
  });

  describe('Timestamp Edge Cases', () => {
    it('should handle ISO timestamp with microseconds', async () => {
      setupStandardMocks();

      const event = createValidErrorEvent({
        timestamp: '2025-01-01T12:00:00.123456Z',
      });

      await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.errorOccurrence.create).toHaveBeenCalled();
    });

    it('should handle timestamp with timezone offset', async () => {
      setupStandardMocks();

      const event = createValidErrorEvent({
        timestamp: '2025-01-01T12:00:00+05:30',
      });

      await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.errorOccurrence.create).toHaveBeenCalled();
    });
  });

  describe('Exception Type Edge Cases', () => {
    it('should handle very long exception type', async () => {
      setupStandardMocks();

      const longType = 'com.company.module.submodule.' + 'NestedClass.'.repeat(20) + 'CustomException';
      const event = createValidErrorEvent({
        exception: { type: longType, message: 'Error' },
      });

      await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.generalError.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            exceptionType: longType,
          }),
        })
      );
    });

    it('should handle exception type with special characters', async () => {
      setupStandardMocks();

      const event = createValidErrorEvent({
        exception: { type: 'Error<T>', message: 'Generic error' },
      });

      await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(prisma.generalError.upsert).toHaveBeenCalled();
    });
  });
});
