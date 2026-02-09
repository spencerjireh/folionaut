import type { Request, Response, NextFunction } from 'express'
import { getRequestContext } from './request-context.middleware'

export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID()
    req.headers['x-request-id'] = requestId
    res.setHeader('X-Request-Id', requestId)
    next()
  }
}

export function getRequestId(): string | undefined {
  return getRequestContext()?.requestId
}
