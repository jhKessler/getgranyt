import { describe, it, expect } from 'vitest';
import { generateErrorFingerprint } from './fingerprint';

describe('generateErrorFingerprint', () => {
  describe('basic fingerprinting', () => {
    it('should generate consistent fingerprint for same error type and message', () => {
      const fp1 = generateErrorFingerprint('ValueError', 'Invalid value provided');
      const fp2 = generateErrorFingerprint('ValueError', 'Invalid value provided');
      
      expect(fp1).toBe(fp2);
    });

    it('should generate different fingerprints for different error types', () => {
      const fp1 = generateErrorFingerprint('ValueError', 'Invalid value');
      const fp2 = generateErrorFingerprint('TypeError', 'Invalid value');
      
      expect(fp1).not.toBe(fp2);
    });

    it('should generate different fingerprints for different messages', () => {
      const fp1 = generateErrorFingerprint('ValueError', 'Message A');
      const fp2 = generateErrorFingerprint('ValueError', 'Message B');
      
      expect(fp1).not.toBe(fp2);
    });
  });

  describe('stacktrace-based fingerprinting', () => {
    it('should include user code location in fingerprint', () => {
      const stacktrace = [
        { filename: '/app/dags/my_dag.py', function: 'process', lineno: 42 },
      ];
      
      const fpWithStack = generateErrorFingerprint('ValueError', 'Error', stacktrace);
      const fpWithoutStack = generateErrorFingerprint('ValueError', 'Error');
      
      expect(fpWithStack).not.toBe(fpWithoutStack);
    });

    it('should generate different fingerprints for same error at different locations', () => {
      const stacktrace1 = [
        { filename: '/app/dags/my_dag.py', function: 'process', lineno: 42 },
      ];
      const stacktrace2 = [
        { filename: '/app/dags/my_dag.py', function: 'process', lineno: 100 },
      ];
      
      const fp1 = generateErrorFingerprint('ValueError', 'Error', stacktrace1);
      const fp2 = generateErrorFingerprint('ValueError', 'Error', stacktrace2);
      
      expect(fp1).not.toBe(fp2);
    });

    it('should generate same fingerprint for same error at same location', () => {
      const stacktrace1 = [
        { filename: '/app/dags/my_dag.py', function: 'process', lineno: 42 },
      ];
      const stacktrace2 = [
        { filename: '/app/dags/my_dag.py', function: 'process', lineno: 42 },
      ];
      
      const fp1 = generateErrorFingerprint('ValueError', 'Error', stacktrace1);
      const fp2 = generateErrorFingerprint('ValueError', 'Error', stacktrace2);
      
      expect(fp1).toBe(fp2);
    });

    it('should use the most relevant (deepest) user frame', () => {
      const stacktrace = [
        { filename: '/usr/lib/python3.10/site-packages/airflow/operators/python.py', function: 'execute', lineno: 100 },
        { filename: '/app/dags/my_dag.py', function: 'outer_func', lineno: 10 },
        { filename: '/app/dags/my_dag.py', function: 'inner_func', lineno: 42 },
      ];
      
      const fp = generateErrorFingerprint('ValueError', 'Error', stacktrace);
      
      // The fingerprint should use line 42 (the deepest user frame)
      const stacktraceAtLine42 = [
        { filename: '/app/dags/my_dag.py', function: 'inner_func', lineno: 42 },
      ];
      const fpExpected = generateErrorFingerprint('ValueError', 'Error', stacktraceAtLine42);
      
      expect(fp).toBe(fpExpected);
    });

    it('should ignore library frames in stacktrace', () => {
      const stacktraceWithLibrary = [
        { filename: '/usr/lib/python3.10/site-packages/pandas/core/frame.py', function: 'read', lineno: 500 },
        { filename: '/home/user/.venv/lib/python3.10/site-packages/sqlalchemy/engine.py', function: 'execute', lineno: 200 },
      ];
      
      const fpWithLibraryOnly = generateErrorFingerprint('ValueError', 'Error', stacktraceWithLibrary);
      const fpWithoutStack = generateErrorFingerprint('ValueError', 'Error');
      
      // Should be same since no user frames
      expect(fpWithLibraryOnly).toBe(fpWithoutStack);
    });

    it('should handle empty stacktrace', () => {
      const fp1 = generateErrorFingerprint('ValueError', 'Error', []);
      const fp2 = generateErrorFingerprint('ValueError', 'Error');
      
      expect(fp1).toBe(fp2);
    });

    it('should handle undefined stacktrace', () => {
      const fp1 = generateErrorFingerprint('ValueError', 'Error', undefined);
      const fp2 = generateErrorFingerprint('ValueError', 'Error');
      
      expect(fp1).toBe(fp2);
    });

    it('should normalize user-specific path prefixes', () => {
      const stacktrace1 = [
        { filename: '/home/alice/projects/app/dags/my_dag.py', function: 'process', lineno: 42 },
      ];
      const stacktrace2 = [
        { filename: '/home/bob/workspace/app/dags/my_dag.py', function: 'process', lineno: 42 },
      ];
      
      const fp1 = generateErrorFingerprint('ValueError', 'Error', stacktrace1);
      const fp2 = generateErrorFingerprint('ValueError', 'Error', stacktrace2);
      
      expect(fp1).toBe(fp2);
    });
  });

  describe('message normalization', () => {
    it('should normalize UUIDs', () => {
      const fp1 = generateErrorFingerprint('NotFoundError', 'Resource 550e8400-e29b-41d4-a716-446655440000 not found');
      const fp2 = generateErrorFingerprint('NotFoundError', 'Resource a1b2c3d4-e5f6-4789-abcd-ef0123456789 not found');
      
      expect(fp1).toBe(fp2);
    });

    it('should normalize timestamps', () => {
      const fp1 = generateErrorFingerprint('TimeoutError', 'Timeout at 2024-01-15T10:30:00Z');
      const fp2 = generateErrorFingerprint('TimeoutError', 'Timeout at 2025-12-25T23:59:59Z');
      
      expect(fp1).toBe(fp2);
    });

    it('should normalize timestamps with timezone offsets', () => {
      const fp1 = generateErrorFingerprint('TimeoutError', 'Timeout at 2024-01-15T10:30:00+05:30');
      const fp2 = generateErrorFingerprint('TimeoutError', 'Timeout at 2025-12-25T23:59:59-08:00');
      
      expect(fp1).toBe(fp2);
    });

    it('should normalize IP addresses', () => {
      const fp1 = generateErrorFingerprint('ConnectionError', 'Failed to connect to 192.168.1.100');
      const fp2 = generateErrorFingerprint('ConnectionError', 'Failed to connect to 10.0.0.1');
      
      expect(fp1).toBe(fp2);
    });

    it('should normalize email addresses', () => {
      const fp1 = generateErrorFingerprint('ValidationError', 'Invalid email: alice@example.com');
      const fp2 = generateErrorFingerprint('ValidationError', 'Invalid email: bob@company.org');
      
      expect(fp1).toBe(fp2);
    });

    it('should normalize large numbers (IDs)', () => {
      const fp1 = generateErrorFingerprint('KeyError', 'User 123456789 not found');
      const fp2 = generateErrorFingerprint('KeyError', 'User 987654321 not found');
      
      expect(fp1).toBe(fp2);
    });

    it('should normalize ID-like patterns', () => {
      const fp1 = generateErrorFingerprint('KeyError', 'Record with id=12345 not found');
      const fp2 = generateErrorFingerprint('KeyError', 'Record with id=67890 not found');
      
      expect(fp1).toBe(fp2);
    });

    it('should normalize AWS ARNs', () => {
      const fp1 = generateErrorFingerprint('AccessDenied', 'Access denied for arn:aws:s3:::my-bucket/path');
      const fp2 = generateErrorFingerprint('AccessDenied', 'Access denied for arn:aws:s3:::other-bucket/different');
      
      expect(fp1).toBe(fp2);
    });

    it('should normalize S3 paths', () => {
      const fp1 = generateErrorFingerprint('FileNotFound', 'File not found: s3://bucket-a/path/to/file.csv');
      const fp2 = generateErrorFingerprint('FileNotFound', 'File not found: s3://bucket-b/other/location/data.csv');
      
      expect(fp1).toBe(fp2);
    });

    it('should normalize user paths', () => {
      const fp1 = generateErrorFingerprint('FileNotFound', 'File not found: /home/alice/data.csv');
      const fp2 = generateErrorFingerprint('FileNotFound', 'File not found: /home/bob/data.csv');
      
      expect(fp1).toBe(fp2);
    });
  });

  describe('HTTP status code preservation', () => {
    it('should preserve HTTP status codes in error messages', () => {
      const fp404 = generateErrorFingerprint('HTTPError', 'HTTP 404: Not Found');
      const fp500 = generateErrorFingerprint('HTTPError', 'HTTP 500: Internal Server Error');
      
      expect(fp404).not.toBe(fp500);
    });

    it('should preserve status codes with different formats', () => {
      const fp1 = generateErrorFingerprint('HTTPError', 'status: 404');
      const fp2 = generateErrorFingerprint('HTTPError', 'status: 500');
      
      expect(fp1).not.toBe(fp2);
    });

    it('should preserve error codes', () => {
      const fp1 = generateErrorFingerprint('APIError', 'error: 401 unauthorized');
      const fp2 = generateErrorFingerprint('APIError', 'error: 403 forbidden');
      
      expect(fp1).not.toBe(fp2);
    });

    it('should preserve port numbers in context', () => {
      const fp1 = generateErrorFingerprint('ConnectionError', 'Failed to connect on port: 5432');
      const fp2 = generateErrorFingerprint('ConnectionError', 'Failed to connect on port: 3306');
      
      expect(fp1).not.toBe(fp2);
    });
  });

  describe('small number preservation', () => {
    it('should preserve small numbers that are not IDs', () => {
      const fp1 = generateErrorFingerprint('ValueError', 'Expected 3 arguments');
      const fp2 = generateErrorFingerprint('ValueError', 'Expected 5 arguments');
      
      // Small numbers should be preserved (different fingerprints)
      expect(fp1).not.toBe(fp2);
    });

    it('should preserve retry counts', () => {
      const fp1 = generateErrorFingerprint('RetryError', 'Failed after 3 retries');
      const fp2 = generateErrorFingerprint('RetryError', 'Failed after 5 retries');
      
      expect(fp1).not.toBe(fp2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      const fp = generateErrorFingerprint('ValueError', '');
      expect(fp).toBeDefined();
      expect(fp.length).toBe(32); // MD5 hash length
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      const fp = generateErrorFingerprint('ValueError', longMessage);
      expect(fp).toBeDefined();
      expect(fp.length).toBe(32);
    });

    it('should handle unicode characters', () => {
      const fp = generateErrorFingerprint('UnicodeError', '無法解碼字符 🚀');
      expect(fp).toBeDefined();
      expect(fp.length).toBe(32);
    });

    it('should handle special characters', () => {
      const fp = generateErrorFingerprint('ParseError', 'Line 1\nLine 2\tTabbed\r\nWindows');
      expect(fp).toBeDefined();
      expect(fp.length).toBe(32);
    });

    it('should handle message with null bytes', () => {
      const fp = generateErrorFingerprint('BinaryError', 'Error with\x00null byte');
      expect(fp).toBeDefined();
      expect(fp.length).toBe(32);
    });
  });
});
