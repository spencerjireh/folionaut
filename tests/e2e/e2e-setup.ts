/**
 * E2E test setup.
 * Sets env vars BEFORE any source module is imported, then bootstraps the full app.
 */

import type { Server } from 'node:http'
import { MOCK_LLM_PORT, IS_DEPLOYED, IS_LOCAL_SERVER, ADMIN_API_KEY } from './helpers/constants'

// Set environment variables before any source imports parse them via Zod
process.env.NODE_ENV = 'test'
process.env.PORT = '0' // not used -- supertest binds in-process
process.env.TURSO_DATABASE_URL = 'file::memory:?cache=shared'
process.env.TURSO_AUTH_TOKEN = 'test-auth-token-placeholder'
process.env.ADMIN_API_KEY = ADMIN_API_KEY
process.env.LLM_PROVIDER = 'openai'
process.env.LLM_API_KEY = 'test-llm-api-key'
process.env.LLM_BASE_URL = `http://127.0.0.1:${MOCK_LLM_PORT}/v1`
process.env.LLM_MODEL = 'gpt-4o-mini'
process.env.LLM_MAX_TOKENS = '500'
process.env.LLM_TEMPERATURE = '0.7'
process.env.LLM_REQUEST_TIMEOUT_MS = '10000'
process.env.LLM_MAX_RETRIES = '0'
process.env.REQUEST_TIMEOUT_MS = '30000'
process.env.CHAT_REQUEST_TIMEOUT_MS = '30000'
process.env.RATE_LIMIT_CAPACITY = '5'
process.env.RATE_LIMIT_REFILL_RATE = '0.333'
process.env.CORS_ORIGINS = 'http://localhost:3000'
process.env.OTEL_ENABLED = 'false'
delete process.env.REDIS_URL

// Now import source modules (env is already set)
import { startMockLLMServer, stopMockLLMServer, resetMockLLM } from './helpers/mock-llm-server'
import { setApp, setDb, setLocalServerUrl, truncateAll } from './helpers/e2e-client'

let httpServer: Server | null = null

beforeAll(async () => {
  if (!IS_DEPLOYED) {
    // 1. Start mock LLM server
    await startMockLLMServer()

    // 2. Initialize DB schema (in-memory SQLite)
    const { db } = await import('@/db/client')
    const { initializeSchema } = await import('../../tests/helpers/test-db')
    await initializeSchema(db)
    setDb(db)

    // 3. Initialize cache (memory fallback since no REDIS_URL)
    const { createCache } = await import('@/cache/cache.factory')
    await createCache()

    // 4. Register event handlers
    const { registerCacheHandlers } = await import('@/events/handlers/cache.handlers')
    const { registerAuditHandlers } = await import('@/events/handlers/audit.handlers')
    const { registerMetricsHandlers } = await import('@/events/handlers/metrics.handlers')
    registerCacheHandlers()
    registerAuditHandlers()
    registerMetricsHandlers()

    // 5. Create and expose the Express app
    const { createApp } = await import('@/app')
    const app = createApp()
    setApp(app)

    // 6. Optionally start a real HTTP server
    if (IS_LOCAL_SERVER) {
      httpServer = await new Promise<Server>((resolve) => {
        const server = app.listen(0, '127.0.0.1', () => {
          const addr = server.address()
          if (addr && typeof addr === 'object') {
            setLocalServerUrl(`http://127.0.0.1:${addr.port}`)
          }
          resolve(server)
        })
      })
    }
  }
}, 30000)

beforeEach(async () => {
  resetMockLLM()
  await truncateAll()
  const { getCache } = await import('@/cache/cache.factory')
  await getCache().delPattern('*')
})

afterAll(async () => {
  if (!IS_DEPLOYED) {
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer!.close((err) => (err ? reject(err) : resolve()))
      })
      httpServer = null
    }
    await stopMockLLMServer()
    const { eventEmitter } = await import('@/events')
    eventEmitter.removeAllListeners()
    const { closeCache } = await import('@/cache/cache.factory')
    await closeCache()
  }
})
