import { Router, type Request, type Response } from 'express'
import { client } from '@/db/client'
import { env } from '@/config/env'

export const healthRouter = Router()

const startTime = Date.now()

/**
 * Liveness probe - is the service running?
 */
healthRouter.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

/**
 * Readiness probe - is the service ready to accept traffic?
 */
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, 'ok' | 'error'> = {
    database: 'ok',
  }

  let overallStatus: 'ready' | 'degraded' = 'ready'

  // Check database connectivity
  try {
    await client.execute('SELECT 1')
  } catch {
    checks.database = 'error'
    overallStatus = 'degraded'
  }

  const statusCode = overallStatus === 'ready' ? 200 : 503
  res.status(statusCode).json({ status: overallStatus, checks })
})

/**
 * Startup probe - service information
 */
healthRouter.get('/startup', (_req: Request, res: Response) => {
  const uptimeMs = Date.now() - startTime
  res.json({
    status: 'started',
    uptime: uptimeMs,
    version: process.env.npm_package_version || '0.0.0',
    environment: env.NODE_ENV,
  })
})
