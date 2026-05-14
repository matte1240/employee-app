import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Required for Docker deployment
  turbopack: {}, // Enable Turbopack explicitly

  outputFileTracingIncludes: {
    '/**/*': [
      './node_modules/@prisma/client/**/*',
      './node_modules/@prisma/adapter-pg/**/*',
      './node_modules/.prisma/**/*',
      './node_modules/pg/**/*',
      './node_modules/pg-pool/**/*',
      './node_modules/pg-types/**/*',
      './node_modules/sharp/**/*',
      './node_modules/@img/**/*',
      './lib/generated/prisma/**/*',
    ],
  },
  outputFileTracingExcludes: {
    '/**/*': [
      '**/*.md',
      '**/*.markdown',
      '**/LICENSE*',
      '**/CHANGELOG*',
      '**/*.d.ts.map',
      '**/*.js.map',
      '**/*.mjs.map',
      '**/test/**',
      '**/tests/**',
      '**/__tests__/**',
      // Prisma CLI + engines are copied separately in the Dockerfile.
      'node_modules/@prisma/engines/**',
      'node_modules/prisma/**',
      // We only use PostgreSQL via PrismaPg adapter — drop other DB wasm compilers.
      'node_modules/@prisma/client/runtime/query_compiler_*_bg.cockroachdb.*',
      'node_modules/@prisma/client/runtime/query_compiler_*_bg.mysql.*',
      'node_modules/@prisma/client/runtime/query_compiler_*_bg.sqlite.*',
      'node_modules/@prisma/client/runtime/query_compiler_*_bg.sqlserver.*',
      // Build-time tooling that has no place at runtime.
      'node_modules/@swc/core-*/**',
      'node_modules/@esbuild/**',
      'node_modules/typescript/**',
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Rewrite for uploads to bypass static file serving issues in Docker
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        urlPattern: /\/icon-.*\.png|apple-touch-icon.*\.png|favicon.*\.png|logo40.*\.(png|svg)/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "app-icons",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
    ],
  },
})(nextConfig);
