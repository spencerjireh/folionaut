import Redis from 'ioredis'
import type { CacheProvider, TokenBucket } from './cache.interface'
import { logger } from '@/lib/logger'

/**
 * Redis cache implementation using ioredis.
 * Features lazy connection, retry strategy, and SCAN-based pattern deletion.
 */
export class RedisCache implements CacheProvider {
  private client: Redis
  private isConnected = false

  constructor(url: string) {
    // Enable TLS for cloud Redis providers (Upstash, etc.)
    const parsedUrl = new URL(url)
    const isCloudRedis =
      parsedUrl.hostname.includes('upstash.io') ||
      parsedUrl.hostname.includes('redis.cloud') ||
      parsedUrl.protocol === 'rediss:'

    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.warn({ times }, 'Redis retry limit reached')
          return null // Stop retrying
        }
        return Math.min(times * 200, 2000) // Exponential backoff
      },
      lazyConnect: true,
      tls: isCloudRedis ? {} : undefined,
    })

    this.client.on('connect', () => {
      this.isConnected = true
      logger.info('Redis connected')
    })

    this.client.on('error', (error) => {
      logger.error({ error: error.message }, 'Redis error')
    })

    this.client.on('close', () => {
      this.isConnected = false
      logger.info('Redis connection closed')
    })
  }

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.client.get(key)
    if (value === null) return undefined

    try {
      return JSON.parse(value) as T
    } catch {
      // Return raw value if not JSON
      return value as unknown as T
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value)

    if (ttl) {
      await this.client.setex(key, ttl, serialized)
    } else {
      await this.client.set(key, serialized)
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async delPattern(pattern: string): Promise<number> {
    let cursor = '0'
    let deleted = 0

    // Use SCAN for production safety (doesn't block)
    do {
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = nextCursor

      if (keys.length > 0) {
        const count = await this.client.del(...keys)
        deleted += count
      }
    } while (cursor !== '0')

    return deleted
  }

  async incr(key: string, ttl?: number): Promise<number> {
    const value = await this.client.incr(key)

    if (ttl) {
      await this.client.expire(key, ttl)
    }

    return value
  }

  async decr(key: string): Promise<number> {
    const value = await this.client.decr(key)
    return Math.max(0, value)
  }

  async getTokenBucket(key: string): Promise<TokenBucket | undefined> {
    return this.get<TokenBucket>(key)
  }

  async setTokenBucket(key: string, bucket: TokenBucket, ttl?: number): Promise<void> {
    await this.set(key, bucket, ttl)
  }

  async ping(): Promise<void> {
    await this.client.ping()
  }

  async close(): Promise<void> {
    await this.client.quit()
    this.isConnected = false
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect()
    }
  }
}
