import type { RequestHandler } from 'express'
import { RateLimiter } from '@/resilience/rate.limiter'
import { RateLimitError } from '@/errors/app.error'
import { extractClientIP, hashIP } from '@/lib/ip'
import { eventEmitter } from '@/events'

interface RateLimitMiddlewareOptions {
  capacity: number
  refillRate: number
  keyPrefix: string
}

export function rateLimitMiddleware(options: RateLimitMiddlewareOptions): RequestHandler {
  const limiter = new RateLimiter(
    options.capacity,
    options.refillRate,
    undefined,
    options.keyPrefix
  )

  return (req, _res, next) => {
    const clientIP = extractClientIP(req)
    const ipHash = hashIP(clientIP)

    limiter
      .consume(ipHash)
      .then((result) => {
        if (result.allowed) {
          next()
        } else {
          eventEmitter.emit('content:rate_limited', {
            ipHash,
            retryAfter: result.retryAfter ?? 0,
            path: req.originalUrl,
          })
          next(new RateLimitError(result.retryAfter ?? 1))
        }
      })
      .catch(() => {
        // Fail open on cache errors
        next()
      })
  }
}
