import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ingestError, ingestErrors } from './ingest';
import type { ErrorEvent } from '@/lib/validators';

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
      findUnique: vi.fn(),
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

describe('Ingest Errors Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  describe('ingestError', () => {
    it('should ingest error successfully', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);
      vi.mocked(prisma.generalError.upsert).mockResolvedValue({ id: 'error-1' } as any);
      vi.mocked(prisma.errorOccurrence.create).mockResolvedValue({} as any);

      const event = createValidErrorEvent();
      const result = await ingestError({
        organizationId: 'org-123',
        event,
      });

      expect(result.errorId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.generalErrorId).toBe('error-1');
      expect(result.taskRunId).toBe('taskrun-1');
    });

    it('should throw error when task instance is missing', async () => {
      const event = createValidErrorEvent({
        task_instance: undefined,
      });

      await expect(ingestError({
        organizationId: 'org-123',
        event,
      })).rejects.toThrow('Missing task_instance: dag_id, task_id, and run_id are required');
    });

    it('should generate consistent fingerprint for same error type and message', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);
      vi.mocked(prisma.generalError.upsert).mockResolvedValue({ id: 'error-1' } as any);
      vi.mocked(prisma.errorOccurrence.create).mockResolvedValue({} as any);

      const event1 = createValidErrorEvent({
        error_id: '550e8400-e29b-41d4-a716-446655440001',
      });
      const event2 = createValidErrorEvent({
        error_id: '550e8400-e29b-41d4-a716-446655440002',
      });

      await ingestError({ organizationId: 'org-123', event: event1 });
      await ingestError({ organizationId: 'org-123', event: event2 });

      const call1 = vi.mocked(prisma.generalError.upsert).mock.calls[0][0];
      const call2 = vi.mocked(prisma.generalError.upsert).mock.calls[1][0];

      expect(call1.where.organizationId_fingerprint!.fingerprint).toBe(
        call2.where.organizationId_fingerprint!.fingerprint
      );
    });

    it('should normalize variable parts in fingerprint', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);
      vi.mocked(prisma.generalError.upsert).mockResolvedValue({ id: 'error-1' } as any);
      vi.mocked(prisma.errorOccurrence.create).mockResolvedValue({} as any);

      // Use large numbers (6+ digits) which are treated as IDs and normalized
      const event1 = createValidErrorEvent({
        error_id: '550e8400-e29b-41d4-a716-446655440001',
        exception: { type: 'KeyError', message: 'Key 12345678 not found' },
      });
      const event2 = createValidErrorEvent({
        error_id: '550e8400-e29b-41d4-a716-446655440002',
        exception: { type: 'KeyError', message: 'Key 98765432 not found' },
      });

      await ingestError({ organizationId: 'org-123', event: event1 });
      await ingestError({ organizationId: 'org-123', event: event2 });

      const call1 = vi.mocked(prisma.generalError.upsert).mock.calls[0][0];
      const call2 = vi.mocked(prisma.generalError.upsert).mock.calls[1][0];

      // Both should have the same fingerprint because large numbers (IDs) are normalized
      expect(call1.where.organizationId_fingerprint!.fingerprint).toBe(
        call2.where.organizationId_fingerprint!.fingerprint
      );
    });

    it('should store stacktrace in error occurrence', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);
      vi.mocked(prisma.generalError.upsert).mockResolvedValue({ id: 'error-1' } as any);
      vi.mocked(prisma.errorOccurrence.create).mockResolvedValue({} as any);

      const event = createValidErrorEvent({
        stacktrace: [
          {
            filename: '/app/main.py',
            function: 'process',
            lineno: 42,
            module: 'main',
          },
        ],
      });

      await ingestError({ organizationId: 'org-123', event });

      expect(prisma.errorOccurrence.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stacktrace: expect.arrayContaining([
              expect.objectContaining({
                filename: '/app/main.py',
                function: 'process',
                lineno: 42,
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('ingestErrors', () => {
    it('should ingest multiple errors', async () => {
      vi.mocked(prisma.dag.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.dagRun.findUnique).mockResolvedValue({ id: 'dagrun-1' } as any);
      vi.mocked(prisma.taskRun.upsert).mockResolvedValue({ id: 'taskrun-1' } as any);
      vi.mocked(prisma.generalError.upsert).mockResolvedValue({ id: 'error-1' } as any);
      vi.mocked(prisma.errorOccurrence.create).mockResolvedValue({} as any);

      const events = [
        createValidErrorEvent({ error_id: '550e8400-e29b-41d4-a716-446655440001' }),
        createValidErrorEvent({ error_id: '550e8400-e29b-41d4-a716-446655440002' }),
      ];

      const results = await ingestErrors('org-123', events);

      expect(results).toHaveLength(2);
      expect(results[0].errorId).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(results[1].errorId).toBe('550e8400-e29b-41d4-a716-446655440002');
    });
  });
});
