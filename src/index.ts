import { sql } from 'drizzle-orm'
import { createApp } from '@/app'
import { env } from '@/config/env'
import { logger } from '@/lib/logger'
import { db, client } from '@/db/client'
import { createCache, closeCache } from '@/cache'
import { closeMcpSessions } from '@/mcp/http'
import { registerCacheHandlers } from '@/events/handlers/cache.handlers'
import { registerAuditHandlers } from '@/events/handlers/audit.handlers'
import { registerMetricsHandlers } from '@/events/handlers/metrics.handlers'
import { initializeMetrics, initializeTracing } from '@/observability'
import { chatRepository } from '@/repositories/chat.repository'

async function start() {
  // Initialize metrics and tracing
  initializeMetrics()
  await initializeTracing()

  // Verify database connection
  try {
    await db.run(sql`SELECT 1`)
    logger.info('Database connection verified')
  } catch (error) {
    logger.fatal({ error }, 'Failed to connect to database')
    process.exit(1)
  }

  // Initialize cache
  await createCache()

  // Register event handlers
  registerCacheHandlers()
  if (env.FEATURE_AUDIT_LOG) {
    registerAuditHandlers()
  }
  registerMetricsHandlers()

  // Hourly cleanup of expired chat sessions
  if (env.FEATURE_AI_CHAT) {
    setInterval(
      async () => {
        try {
          const count = await chatRepository.deleteExpired()
          if (count > 0) {
            logger.info({ count }, 'Expired chat sessions cleaned up')
          }
        } catch (error) {
          logger.warn({ error }, 'Failed to clean up expired chat sessions')
        }
      },
      60 * 60 * 1000
    )
  }

  const app = createApp()

  // Log active feature flags
  const featureFlags = {
    FEATURE_AI_CHAT: env.FEATURE_AI_CHAT,
    FEATURE_MCP_SERVER: env.FEATURE_MCP_SERVER,
    FEATURE_ADMIN_API: env.FEATURE_ADMIN_API,
    FEATURE_RATE_LIMITING: env.FEATURE_RATE_LIMITING,
    FEATURE_AUDIT_LOG: env.FEATURE_AUDIT_LOG,
  }
  logger.info({ featureFlags }, 'Feature flags')

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started')
  })

  async function shutdown(signal: string) {
    logger.info({ signal }, 'Shutdown signal received')
    let isCleanedUp = false

    server.close(async () => {
      if (isCleanedUp) return
      isCleanedUp = true
      logger.info('Server closed')
      if (env.FEATURE_MCP_SERVER) closeMcpSessions()
      await closeCache()
      client.close()
      logger.info('Database connection closed')
      process.exit(0)
    })

    setTimeout(async () => {
      if (isCleanedUp) return
      isCleanedUp = true
      logger.error('Forced shutdown after timeout')
      if (env.FEATURE_MCP_SERVER) closeMcpSessions()
      await closeCache()
      client.close()
      process.exit(1)
    }, 10000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection')
    throw reason
  })

  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception')
    client.close()
    process.exit(1)
  })
}

start()
