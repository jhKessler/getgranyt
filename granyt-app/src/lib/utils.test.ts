import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDocsLink } from './utils';

describe('getDocsLink', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('APP mode (default)', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_GRANYT_MODE;
    });

    it('returns external URL with tracking param for empty path', async () => {
      const { getDocsLink } = await import('./utils');
      const result = getDocsLink();
      expect(result).toBe('https://granyt.dev/docs?utm_source=app');
    });

    it('returns external URL with tracking param for path with /docs prefix', async () => {
      const { getDocsLink } = await import('./utils');
      const result = getDocsLink('/docs/webhooks');
      expect(result).toBe('https://granyt.dev/docs/webhooks?utm_source=app');
    });

    it('returns external URL with tracking param for path without /docs prefix', async () => {
      const { getDocsLink } = await import('./utils');
      const result = getDocsLink('webhooks');
      expect(result).toBe('https://granyt.dev/docs/webhooks?utm_source=app');
    });

    it('returns external URL with tracking param for path with leading slash', async () => {
      const { getDocsLink } = await import('./utils');
      const result = getDocsLink('/webhooks');
      expect(result).toBe('https://granyt.dev/docs/webhooks?utm_source=app');
    });

    it('uses custom source parameter', async () => {
      const { getDocsLink } = await import('./utils');
      const result = getDocsLink('/docs/webhooks', 'dashboard-nav');
      expect(result).toBe('https://granyt.dev/docs/webhooks?utm_source=dashboard-nav');
    });

    it('removes trailing slash from path', async () => {
      const { getDocsLink } = await import('./utils');
      const result = getDocsLink('/docs/webhooks/');
      expect(result).toBe('https://granyt.dev/docs/webhooks?utm_source=app');
    });
  });

  describe('DOCS mode', () => {
    it('returns relative path', async () => {
      process.env.NEXT_PUBLIC_GRANYT_MODE = 'DOCS';
      const { getDocsLink } = await import('./utils');
      const result = getDocsLink('/docs/webhooks');
      expect(result).toBe('/docs/webhooks');
    });

    it('returns relative path for path without /docs prefix', async () => {
      process.env.NEXT_PUBLIC_GRANYT_MODE = 'DOCS';
      const { getDocsLink } = await import('./utils');
      const result = getDocsLink('webhooks');
      expect(result).toBe('/docs/webhooks');
    });

    it('returns /docs for empty path', async () => {
      process.env.NEXT_PUBLIC_GRANYT_MODE = 'DOCS';
      const { getDocsLink } = await import('./utils');
      const result = getDocsLink();
      expect(result).toBe('/docs');
    });

    it('is case insensitive for mode', async () => {
      process.env.NEXT_PUBLIC_GRANYT_MODE = 'docs';
      const { getDocsLink } = await import('./utils');
      const result = getDocsLink('/docs/webhooks');
      expect(result).toBe('/docs/webhooks');
    });
  });

  describe('DEV mode', () => {
    it('returns relative path', async () => {
      process.env.NEXT_PUBLIC_GRANYT_MODE = 'DEV';
      const { getDocsLink } = await import('./utils');
      const result = getDocsLink('/docs/webhooks');
      expect(result).toBe('/docs/webhooks');
    });

    it('returns relative path for nested paths', async () => {
      process.env.NEXT_PUBLIC_GRANYT_MODE = 'DEV';
      const { getDocsLink } = await import('./utils');
      const result = getDocsLink('sdk-reference/environment-variables');
      expect(result).toBe('/docs/sdk-reference/environment-variables');
    });
  });
});
