import { timingSafeEqual } from 'crypto'
import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { UnauthorizedError } from '@/errors/app.error'
import { env } from '@/config/env'

const ADMIN_KEY_HEADER = 'x-admin-key'

/**
 * Performs a timing-safe comparison between two strings.
 * Returns false if lengths differ (but still takes constant time).
 */
function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8')
  const bufferB = Buffer.from(b, 'utf8')

  // If lengths differ, compare bufferA to itself to maintain constant time
  if (bufferA.length !== bufferB.length) {
    timingSafeEqual(bufferA, bufferA)
    return false
  }

  return timingSafeEqual(bufferA, bufferB)
}

/**
 * Middleware that validates the X-Admin-Key header against env.ADMIN_API_KEY.
 * Uses constant-time comparison to prevent timing attacks.
 * Sets req.userId to 'admin' for audit trail purposes.
 */
export function adminAuthMiddleware(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const providedKey = req.headers[ADMIN_KEY_HEADER]

    if (!providedKey || typeof providedKey !== 'string') {
      return next(new UnauthorizedError('Missing X-Admin-Key header'))
    }

    if (!safeCompare(providedKey, env.ADMIN_API_KEY)) {
      return next(new UnauthorizedError('Invalid X-Admin-Key'))
    }

    // Set userId for audit trail
    ;(req as Request & { userId?: string }).userId = 'admin'

    next()
  }
}
