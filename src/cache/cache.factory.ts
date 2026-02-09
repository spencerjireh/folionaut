import type { CacheProvider } from './cache.interface'
import { MemoryCache } from './memory.cache'
import { RedisCache } from './redis.cache'
import { env } from '@/config/env'
import { logger } from '@/lib/logger'

let cacheInstance: CacheProvider | null = null

/**
 * Creates and initializes the cache provider.
 * Tries Redis first if REDIS_URL is set, falls back to memory cache.
 */
export async function createCache(): Promise<CacheProvider> {
  if (cacheInstance) {
    return cacheInstance
  }

  if (env.REDIS_URL) {
    try {
      const redisCache = new RedisCache(env.REDIS_URL)
      await redisCache.connect()
      await redisCache.ping()
      cacheInstance = redisCache
      logger.info('Using Redis cache provider')
      return cacheInstance
    } catch (error) {
      logger.warn(
        { error: (error as Error).message },
        'Redis connection failed, falling back to memory cache'
      )
    }
  }

  cacheInstance = new MemoryCache()
  logger.info('Using in-memory cache provider')
  return cacheInstance
}

/**
 * Returns the singleton cache instance.
 * Throws if cache hasn't been initialized.
 */
export function getCache(): CacheProvider {
  if (!cacheInstance) {
    throw new Error('Cache not initialized. Call createCache() first.')
  }
  return cacheInstance
}

/**
 * Closes the cache connection gracefully.
 */
export async function closeCache(): Promise<void> {
  if (cacheInstance) {
    await cacheInstance.close()
    cacheInstance = null
    logger.info('Cache provider closed')
  }
}
