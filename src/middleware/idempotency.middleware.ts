import { createHash } from 'crypto'
import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { getCache, CacheKeys, CacheTTL } from '@/cache'
import { logger } from '@/lib/logger'

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key'
const REPLAYED_HEADER = 'X-Idempotent-Replayed'

interface CachedResponse {
  statusCode: number
  headers: Record<string, string>
  body: unknown
}

/**
 * Generates a cache key from method, path, and idempotency key.
 */
function generateCacheKey(method: string, path: string, idempotencyKey: string): string {
  const input = `${method}:${path}:${idempotencyKey}`
  const hash = createHash('sha256').update(input).digest('hex')
  return `${CacheKeys.IDEMPOTENCY}:${hash}`
}

/**
 * Middleware that prevents duplicate mutations via Idempotency-Key header.
 * Only caches successful (2xx) responses.
 * Sets X-Idempotent-Replayed: true on replayed requests.
 */
export function idempotencyMiddleware(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const idempotencyKey = req.headers[IDEMPOTENCY_KEY_HEADER]

    // If no idempotency key provided, skip middleware
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return next()
    }

    const cacheKey = generateCacheKey(req.method, req.path, idempotencyKey)

    try {
      const cache = getCache()
      const cachedResponse = await cache.get<CachedResponse>(cacheKey)

      // If we have a cached response, replay it
      if (cachedResponse) {
        res.set(REPLAYED_HEADER, 'true')

        // Restore cached headers
        for (const [key, value] of Object.entries(cachedResponse.headers)) {
          res.set(key, value)
        }

        return res.status(cachedResponse.statusCode).json(cachedResponse.body)
      }

      // Store original json method to intercept response
      const originalJson = res.json.bind(res)

      res.json = (body: unknown): Response => {
        // Only cache successful responses (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Capture relevant headers (excluding some internal ones)
          const headersToCache: Record<string, string> = {}
          const headerNames = ['content-type', 'etag', 'cache-control']

          for (const name of headerNames) {
            const value = res.get(name)
            if (value) {
              headersToCache[name] = value
            }
          }

          // Cache the response (fire-and-forget)
          cache
            .set(
              cacheKey,
              {
                statusCode: res.statusCode,
                headers: headersToCache,
                body,
              },
              CacheTTL.IDEMPOTENCY
            )
            .catch((error) => {
              logger.warn(
                { error: (error as Error).message },
                'Failed to cache idempotency response'
              )
            })
        }

        return originalJson(body)
      }

      next()
    } catch (error) {
      // Graceful degradation - continue without idempotency if cache fails
      logger.warn(
        { error: (error as Error).message },
        'Idempotency cache error, continuing without idempotency'
      )
      next()
    }
  }
}
