import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { parsePayload, parseArrayPayload } from './index';
import { z } from 'zod';

describe('Edge Cases: Payload Service', () => {
  describe('parsePayload', () => {
    const testSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body: '',
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON payload');
      }
    });

    it('should handle whitespace-only body', async () => {
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body: '   ',
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(false);
    });

    it('should handle null JSON value', async () => {
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body: 'null',
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(false);
    });

    it('should handle deeply nested objects', async () => {
      const deepSchema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.object({
              value: z.string(),
            }),
          }),
        }),
      });

      const body = JSON.stringify({
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      });

      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parsePayload(request, deepSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.level1.level2.level3.value).toBe('deep');
      }
    });

    it('should handle very large JSON payload', async () => {
      const largeSchema = z.object({
        data: z.array(z.string()),
      });

      const largeArray = Array(10000).fill('item');
      const body = JSON.stringify({ data: largeArray });

      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parsePayload(request, largeSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data.length).toBe(10000);
      }
    });

    it('should handle Unicode characters in payload', async () => {
      const body = JSON.stringify({ name: '日本語テスト 🚀', age: 25 });
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('日本語テスト 🚀');
      }
    });

    it('should handle special JSON characters that need escaping', async () => {
      const body = JSON.stringify({ name: 'Test\n"quoted"\ttab', age: 30 });
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test\n"quoted"\ttab');
      }
    });

    it('should handle trailing comma in JSON (invalid JSON)', async () => {
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body: '{"name": "John", "age": 30,}',
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON payload');
      }
    });

    it('should handle single quotes (invalid JSON)', async () => {
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body: "{'name': 'John', 'age': 30}",
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(false);
    });

    it('should handle NaN and Infinity values (become null in JSON)', async () => {
      const numberSchema = z.object({
        value: z.number().nullable(),
      });

      // JSON.stringify converts NaN to null
      const body = JSON.stringify({ value: null });
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parsePayload(request, numberSchema);

      expect(result.success).toBe(true);
    });

    it('should handle extra fields not in schema (should pass with strip)', async () => {
      const body = JSON.stringify({ name: 'John', age: 30, extraField: 'ignored' });
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        expect((result.data as any).extraField).toBeUndefined();
      }
    });

    it('should handle empty object against schema with required fields', async () => {
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body: '{}',
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(false);
    });

    it('should handle array when object expected', async () => {
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body: JSON.stringify([{ name: 'John', age: 30 }]),
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(false);
    });

    it('should handle number when object expected', async () => {
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body: '42',
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(false);
    });

    it('should handle string when object expected', async () => {
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body: '"hello"',
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(false);
    });
  });

  describe('parseArrayPayload', () => {
    const itemSchema = z.object({
      id: z.string(),
      value: z.number(),
    });

    it('should handle empty array', async () => {
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body: '[]',
      });

      const result = await parseArrayPayload(request, itemSchema);

      expect(result.success).toBe(false);
      expect(result.items).toHaveLength(0);
    });

    it('should handle null container key value', async () => {
      const body = JSON.stringify({ items: null });
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema, 'items');

      // null is wrapped as single item
      expect(result.success).toBe(false);
    });

    it('should handle missing container key', async () => {
      const body = JSON.stringify({ other_key: [{ id: '1', value: 10 }] });
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema, 'items');

      // Falls back to treating whole object as single item
      expect(result.success).toBe(false);
    });

    it('should handle very large array', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: `id-${i}`,
        value: i,
      }));
      const body = JSON.stringify(items);
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema);

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1000);
    });

    it('should handle array with only invalid items', async () => {
      const body = JSON.stringify([
        { id: 123, value: 'not-a-number' },
        { id: 456, value: 'also-not-a-number' },
      ]);
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema);

      expect(result.success).toBe(false);
      expect(result.items).toHaveLength(0);
      expect(result.errors).toHaveLength(2);
    });

    it('should track correct indices for errors', async () => {
      const body = JSON.stringify([
        { id: '1', value: 10 }, // valid
        { id: 123, value: 20 }, // invalid id
        { id: '3', value: 30 }, // valid
        { id: '4', value: 'bad' }, // invalid value
      ]);
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema);

      expect(result.items).toHaveLength(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].index).toBe(1);
      expect(result.errors[1].index).toBe(3);
    });

    it('should handle nested array in container', async () => {
      const body = JSON.stringify({
        items: [[{ id: '1', value: 10 }]], // nested array
      });
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema, 'items');

      // Nested array is not a valid item
      expect(result.items).toHaveLength(0);
    });

    it('should handle boolean values in array', async () => {
      const body = JSON.stringify([true, false]);
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema);

      expect(result.success).toBe(false);
    });

    it('should handle mixed valid objects and primitives', async () => {
      const body = JSON.stringify([
        { id: '1', value: 10 },
        null,
        { id: '2', value: 20 },
        'string',
        42,
      ]);
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema);

      expect(result.items).toHaveLength(2);
      expect(result.errors).toHaveLength(3);
    });

    it('should handle empty string container key', async () => {
      const body = JSON.stringify({
        '': [{ id: '1', value: 10 }],
        data: [{ id: '2', value: 20 }],
      });
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema, '');

      // Empty string key is falsy, so falls back to checking array
      expect(result.success).toBe(false); // object is not valid item
    });

    it('should handle duplicate items in array', async () => {
      const body = JSON.stringify([
        { id: '1', value: 10 },
        { id: '1', value: 10 }, // duplicate
        { id: '1', value: 10 }, // duplicate
      ]);
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema);

      // All items are valid (no unique constraint in schema)
      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(3);
    });
  });
});
