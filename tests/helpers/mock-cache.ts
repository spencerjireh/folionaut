import type { CacheProvider, TokenBucket } from '@/cache'

interface CacheEntry<T = unknown> {
  value: T
  expiresAt: number | null
}

/**
 * Mock cache provider for testing.
 * Uses an in-memory Map with TTL support.
 */
export class MockCacheProvider implements CacheProvider {
  private cache = new Map<string, CacheEntry>()

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value as T
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : null
    this.cache.set(key, { value, expiresAt })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async delPattern(pattern: string): Promise<number> {
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')

    const regex = new RegExp(`^${regexPattern}$`)
    let deleted = 0

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deleted++
      }
    }

    return deleted
  }

  async incr(key: string, ttl?: number): Promise<number> {
    const current = await this.get<number>(key)
    const newValue = (current ?? 0) + 1
    await this.set(key, newValue, ttl)
    return newValue
  }

  async decr(key: string): Promise<number> {
    const current = await this.get<number>(key)
    const newValue = Math.max(0, (current ?? 0) - 1)
    await this.set(key, newValue)
    return newValue
  }

  async getTokenBucket(key: string): Promise<TokenBucket | undefined> {
    return this.get<TokenBucket>(key)
  }

  async setTokenBucket(key: string, bucket: TokenBucket, ttl?: number): Promise<void> {
    await this.set(key, bucket, ttl)
  }

  async ping(): Promise<void> {
    // Mock always succeeds
  }

  async close(): Promise<void> {
    this.cache.clear()
  }

  /**
   * Clears all cached data.
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Returns the current size of the cache.
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Returns all keys in the cache.
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
}

// Singleton instance for tests
let mockCacheInstance: MockCacheProvider | null = null

/**
 * Gets the shared mock cache instance.
 */
export function getMockCache(): MockCacheProvider {
  if (!mockCacheInstance) {
    mockCacheInstance = new MockCacheProvider()
  }
  return mockCacheInstance
}

/**
 * Resets the mock cache instance.
 */
export function resetMockCache(): void {
  if (mockCacheInstance) {
    mockCacheInstance.clear()
  }
}

/**
 * Creates a fresh mock cache instance (not shared).
 */
export function createMockCache(): MockCacheProvider {
  return new MockCacheProvider()
}
