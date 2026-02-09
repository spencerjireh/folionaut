/**
 * Vitest global setup file.
 * Runs before all tests.
 */

import { setupTestEnv } from './helpers/mock-env'
import { resetIdCounter } from './helpers/test-factories'
import { resetMockCache } from './helpers/mock-cache'
import { resetMockLLM } from './helpers/mock-llm'

// Set up test environment variables before any imports
setupTestEnv()

// Suppress pino logging during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
    trace: vi.fn(),
    fatal: vi.fn(),
  },
  httpLogger: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
}))

// Mock the observability metrics to avoid Prometheus registration issues
vi.mock('@/observability/metrics', () => ({
  httpRequestsTotal: { inc: vi.fn() },
  httpRequestDuration: { observe: vi.fn(), startTimer: vi.fn(() => vi.fn()) },
  chatMessagesTotal: { inc: vi.fn() },
  chatTokensTotal: { inc: vi.fn() },
  chatActiveSessionsGauge: { set: vi.fn() },
  llmRequestsTotal: { inc: vi.fn() },
  llmRequestDuration: { observe: vi.fn() },
  circuitBreakerState: { set: vi.fn() },
  rateLimitHitsTotal: { inc: vi.fn() },
  cacheOperationsTotal: { inc: vi.fn() },
  register: {
    metrics: vi.fn().mockResolvedValue(''),
    contentType: 'text/plain',
  },
}))

// Mock the metrics middleware
vi.mock('@/observability/metrics.middleware', () => ({
  metricsMiddleware: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}))

// Global beforeEach hook
beforeEach(() => {
  // Reset ID counter for consistent test IDs
  resetIdCounter()
  // Reset mock cache
  resetMockCache()
  // Reset mock LLM
  resetMockLLM()
  // Clear all mocks
  vi.clearAllMocks()
})

// Global afterEach hook
afterEach(() => {
  // Additional cleanup if needed
})

// Export helpers for use in tests
export { setupTestEnv } from './helpers/mock-env'
export { resetIdCounter } from './helpers/test-factories'
export { resetMockCache, getMockCache, createMockCache } from './helpers/mock-cache'
export { resetMockLLM, getMockLLM, createMockLLM } from './helpers/mock-llm'
