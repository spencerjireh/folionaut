import type { RequestHandler, Request, Response, NextFunction } from 'express'
import { AppError } from '@/errors/app.error'

export interface TimeoutOptions {
  /** Default timeout in milliseconds. Default: 30000 (30s) */
  defaultTimeout?: number
  /** Per-route timeout overrides. Key is route path prefix. */
  routeTimeouts?: Record<string, number>
  /** HTTP status code to return on timeout. Default: 504 */
  statusCode?: 408 | 504
}

/**
 * Custom error for request timeout.
 */
export class RequestTimeoutError extends AppError {
  constructor(timeoutMs: number) {
    super(`Request timeout after ${timeoutMs}ms`, 'REQUEST_TIMEOUT', 504)
  }
}

/**
 * Middleware that applies a timeout to incoming requests.
 * Uses AbortController to provide early termination signal.
 */
export function requestTimeoutMiddleware(options?: TimeoutOptions): RequestHandler {
  const defaultTimeout = options?.defaultTimeout ?? 30000
  const routeTimeouts = options?.routeTimeouts ?? {}

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine timeout for this route
    let timeout = defaultTimeout

    for (const [routePrefix, routeTimeout] of Object.entries(routeTimeouts)) {
      if (req.path.startsWith(routePrefix)) {
        timeout = routeTimeout
        break
      }
    }

    // Create abort controller for downstream use
    const abortController = new AbortController()

    // Attach signal to request for downstream services
    ;(req as Request & { signal: AbortSignal }).signal = abortController.signal

    // Set timeout
    const timeoutId = setTimeout(() => {
      abortController.abort()

      if (!res.headersSent) {
        next(new RequestTimeoutError(timeout))
      }
    }, timeout)

    // Clean up on response finish or close
    const cleanup = () => {
      clearTimeout(timeoutId)
    }

    res.on('finish', cleanup)
    res.on('close', cleanup)

    next()
  }
}
