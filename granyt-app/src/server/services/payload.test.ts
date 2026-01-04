import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { parsePayload, parseArrayPayload } from './payload';
import { z } from 'zod';

describe('Payload Service', () => {
  describe('parsePayload', () => {
    const testSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('should successfully parse valid payload', async () => {
      const body = JSON.stringify({ name: 'John', age: 30 });
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        expect(result.data.age).toBe(30);
      }
    });

    it('should return error for invalid payload', async () => {
      const body = JSON.stringify({ name: 'John', age: 'not-a-number' });
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('age');
      }
    });

    it('should return error for invalid JSON', async () => {
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body: 'not valid json',
      });

      const result = await parsePayload(request, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON payload');
      }
    });
  });

  describe('parseArrayPayload', () => {
    const itemSchema = z.object({
      id: z.string(),
      value: z.number(),
    });

    it('should parse array payload', async () => {
      const body = JSON.stringify([
        { id: '1', value: 10 },
        { id: '2', value: 20 },
      ]);
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema);

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should parse single item as array', async () => {
      const body = JSON.stringify({ id: '1', value: 10 });
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema);

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1);
    });

    it('should parse payload with container key', async () => {
      const body = JSON.stringify({
        items: [
          { id: '1', value: 10 },
          { id: '2', value: 20 },
        ],
      });
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema, 'items');

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(2);
    });

    it('should handle mixed valid/invalid items', async () => {
      const body = JSON.stringify([
        { id: '1', value: 10 },
        { id: '2', value: 'invalid' },
        { id: '3', value: 30 },
      ]);
      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        body,
      });

      const result = await parseArrayPayload(request, itemSchema);

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(1);
    });

    it('should fail when all items are invalid', async () => {
      const body = JSON.stringify([
        { id: 1, value: 'invalid' },
        { id: 2, value: 'also-invalid' },
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
  });
});
