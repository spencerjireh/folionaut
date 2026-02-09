import { defineConfig } from 'vitest/config'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
          setupFiles: ['tests/setup.ts'],
          testTimeout: 10_000,
          mockReset: true,
          restoreMocks: true,
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.e2e.test.ts'],
          setupFiles: ['tests/e2e/e2e-setup.ts'],
          testTimeout: 30_000,
          maxWorkers: 1,
          isolate: false,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      all: false,
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.types.ts',
        'src/**/index.ts',
        'src/index.ts',
        'src/mcp/**',
        'src/observability/**',
        'src/repositories/**',
        'src/seed/**',
        'src/config/**',
        'src/db/**',
        'src/events/handlers/**',
        'src/llm/openai.provider.ts',
        'src/llm/types.ts',
        'src/lib/logger.ts',
        'src/routes/metrics.routes.ts',
        'src/routes/v1/admin/chat.routes.ts',
        'src/middleware/idempotency.middleware.ts',
        'src/middleware/cors.middleware.ts',
        'src/cache/cache.factory.ts',
        'src/cache/cache.constants.ts',
        'src/cache/cache.interface.ts',
        'src/cache/redis.cache.ts',
        'src/events/event-emitter.ts',
        'src/events/event-map.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
        'src/middleware/admin-auth.middleware.ts': {
          lines: 100,
          branches: 100,
          functions: 100,
          statements: 100,
        },
        'src/resilience/rate.limiter.ts': {
          lines: 100,
          branches: 100,
          functions: 100,
          statements: 100,
        },
      },
    },
  },
})
