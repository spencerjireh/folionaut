import { AsyncLocalStorage } from 'node:async_hooks'
import type { Request, Response, NextFunction } from 'express'

export interface RequestContext {
  requestId: string
  startTime: number
  userId?: string
}

export const requestContext = new AsyncLocalStorage<RequestContext>()

export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore()
}

export function requestContextMiddleware() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const context: RequestContext = {
      requestId: (req.headers['x-request-id'] as string) || crypto.randomUUID(),
      startTime: Date.now(),
    }

    requestContext.run(context, () => {
      next()
    })
  }
}
