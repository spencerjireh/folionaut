import express from 'express'
import compression from 'compression'
import { requestIdMiddleware } from '@/middleware/request-id.middleware'
import { requestContextMiddleware } from '@/middleware/request-context.middleware'
import { requestTimeoutMiddleware } from '@/middleware/request-timeout.middleware'
import { securityMiddleware } from '@/middleware/security.middleware'
import { corsMiddleware } from '@/middleware/cors.middleware'
import { httpLogger } from './lib/logger'
import { errorHandlerMiddleware } from '@/middleware/error.middleware'
import { adminAuthMiddleware } from '@/middleware/admin-auth.middleware'
import { NotFoundError } from './errors/app.error'
import { healthRouter } from './routes/health.routes'
import { metricsRouter } from './routes/metrics.routes'
import { contentRouter } from './routes/v1/content.routes'
import { chatRouter } from './routes/v1/chat.routes'
import { adminContentRouter } from './routes/v1/admin/content.routes'
import { adminChatRouter } from './routes/v1/admin/chat.routes'
import { mcpRouter } from './mcp/http'
import { metricsMiddleware } from './observability'
import { env } from './config/env'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)

  app.use(requestIdMiddleware())
  app.use(requestContextMiddleware())
  app.use(securityMiddleware())
  app.use(corsMiddleware())
  app.use(compression())
  app.use(express.json({ limit: '100kb' }))
  app.use(
    requestTimeoutMiddleware({
      defaultTimeout: env.REQUEST_TIMEOUT_MS,
      routeTimeouts: {
        '/api/v1/chat': env.CHAT_REQUEST_TIMEOUT_MS,
      },
    })
  )
  app.use(httpLogger)
  app.use(metricsMiddleware())

  app.get('/', (_req, res) => {
    res.json({ status: 'ok' })
  })

  // Health check routes
  app.use('/api/health', healthRouter)

  // Metrics endpoint (admin-only)
  app.use('/api/metrics', adminAuthMiddleware(), metricsRouter)

  // Public API routes
  app.use('/api/v1/content', contentRouter)
  app.use('/api/v1/chat', chatRouter)

  // Admin API routes
  app.use('/api/v1/admin/content', adminContentRouter)
  app.use('/api/v1/admin/chat', adminChatRouter)

  // MCP over HTTP (admin-only)
  app.use('/api/mcp', adminAuthMiddleware(), mcpRouter)

  // 404 handler
  app.use((_req, _res, next) => {
    next(new NotFoundError('Route'))
  })

  app.use(errorHandlerMiddleware)

  return app
}
