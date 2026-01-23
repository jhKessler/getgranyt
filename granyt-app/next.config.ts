import path from 'path';
import { fileURLToPath } from 'url';
import type { NextConfig } from 'next';

// Validate environment variables at build time
import "./src/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker deployment
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  // Skip static optimization for error pages
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
