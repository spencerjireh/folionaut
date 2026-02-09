import type { Request, Response, NextFunction } from 'express'
import { httpRequestsTotal, httpRequestDuration } from './metrics'

// Paths to exclude from detailed metrics (high cardinality)
const EXCLUDED_PATHS = ['/api/metrics', '/api/health']

function normalizePath(path: string): string {
  // Replace dynamic segments with placeholders
  return path
    .replace(/\/sess_[^/]+/g, '/:sessionId')
    .replace(/\/content_[^/]+/g, '/:contentId')
    .replace(/\/msg_[^/]+/g, '/:messageId')
}

export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (EXCLUDED_PATHS.some((p) => req.path.startsWith(p))) {
      return next()
    }

    const start = process.hrtime.bigint()

    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - start) / 1e9
      const path = normalizePath(req.route?.path ?? req.path)
      const labels = {
        method: req.method,
        path,
        status: String(res.statusCode),
      }

      httpRequestsTotal.inc(labels)
      httpRequestDuration.observe(labels, duration)
    })

    next()
  }
}
