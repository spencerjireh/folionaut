import type { Request, Response, NextFunction } from 'express'
import { AppError, ValidationError, RateLimitError } from '@/errors/app.error'
import { getRequestContext } from './request-context.middleware'
import { logger } from '@/lib/logger'
import { env } from '@/config/env'

interface ErrorResponse {
  error: {
    code: string
    message: string
    requestId?: string
    fields?: Record<string, string[]>
    retryAfter?: number
    stack?: string
  }
}

export function errorHandlerMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const context = getRequestContext()
  const requestId = context?.requestId

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        requestId,
      },
    }

    if (err instanceof ValidationError && Object.keys(err.fields).length > 0) {
      response.error.fields = err.fields
    }

    if (err instanceof RateLimitError) {
      response.error.retryAfter = err.retryAfter
      res.setHeader('Retry-After', err.retryAfter.toString())
    }

    if (env.NODE_ENV === 'development' && err.stack) {
      response.error.stack = err.stack
    }

    logger.warn({ err, requestId }, 'Operational error')
    res.status(err.statusCode).json(response)
    return
  }

  logger.error({ err, requestId }, 'Unexpected error')

  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      requestId,
    },
  }

  if (env.NODE_ENV === 'development' && err.stack) {
    response.error.stack = err.stack
  }

  res.status(500).json(response)
}
