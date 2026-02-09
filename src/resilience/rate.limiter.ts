import { getCache, CacheKeys } from '@/cache'
import { env } from '@/config/env'
import { eventEmitter } from '@/events'
import { logger } from '@/lib/logger'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number
}

const DEFAULT_TTL = 300 // 5 minutes

/**
 * Token bucket rate limiter using the cache layer.
 * Implements the token bucket algorithm where tokens refill over time.
 */
export class RateLimiter {
  private readonly capacity: number
  private readonly refillRate: number
  private readonly ttl: number

  constructor(
    capacity: number = env.RATE_LIMIT_CAPACITY,
    refillRate: number = env.RATE_LIMIT_REFILL_RATE,
    ttl: number = DEFAULT_TTL
  ) {
    this.capacity = capacity
    this.refillRate = refillRate
    this.ttl = ttl
  }

  /**
   * Attempts to consume a token from the bucket for the given IP hash.
   * Returns whether the request is allowed and how many tokens remain.
   */
  async consume(ipHash: string): Promise<RateLimitResult> {
    try {
      const key = `${CacheKeys.TOKEN_BUCKET}:${ipHash}`
      const now = Date.now()
      const cache = getCache()

      let bucket = await cache.getTokenBucket(key)

      if (!bucket) {
        // Initialize new bucket with full capacity minus one token for this request
        bucket = { tokens: this.capacity - 1, lastRefill: now }
        await cache.setTokenBucket(key, bucket, this.ttl)
        return { allowed: true, remaining: Math.floor(bucket.tokens) }
      }

      // Refill tokens based on elapsed time
      const elapsed = (now - bucket.lastRefill) / 1000
      bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillRate)
      bucket.lastRefill = now

      if (bucket.tokens >= 1) {
        bucket.tokens -= 1
        await cache.setTokenBucket(key, bucket, this.ttl)
        return { allowed: true, remaining: Math.floor(bucket.tokens) }
      }

      // Not enough tokens - calculate retry time
      const retryAfter = Math.ceil((1 - bucket.tokens) / this.refillRate)
      await cache.setTokenBucket(key, bucket, this.ttl)

      return { allowed: false, remaining: 0, retryAfter }
    } catch (error) {
      logger.warn({ error, ipHash }, 'Rate limiter cache failure, allowing request')
      return { allowed: true, remaining: 0 }
    }
  }

  /**
   * Checks the current rate limit status without consuming a token.
   */
  async peek(ipHash: string): Promise<RateLimitResult> {
    const key = `${CacheKeys.TOKEN_BUCKET}:${ipHash}`
    const now = Date.now()
    const cache = getCache()

    const bucket = await cache.getTokenBucket(key)

    if (!bucket) {
      // No bucket exists - would be allowed with full capacity
      return { allowed: true, remaining: this.capacity }
    }

    // Calculate current token count with refill
    const elapsed = (now - bucket.lastRefill) / 1000
    const currentTokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillRate)

    if (currentTokens >= 1) {
      return { allowed: true, remaining: Math.floor(currentTokens) }
    }

    const retryAfter = Math.ceil((1 - currentTokens) / this.refillRate)
    return { allowed: false, remaining: 0, retryAfter }
  }

  /**
   * Emits a rate limit event for logging/monitoring.
   */
  emitRateLimitEvent(ipHash: string, sessionId?: string, retryAfter?: number): void {
    eventEmitter.emit('chat:rate_limited', {
      ipHash,
      sessionId,
      retryAfter: retryAfter ?? 0,
    })
  }
}

export const rateLimiter = new RateLimiter()
