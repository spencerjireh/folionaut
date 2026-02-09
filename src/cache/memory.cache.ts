import type { CacheProvider, TokenBucket } from './cache.interface'

interface CacheEntry<T = unknown> {
  value: T
  expiresAt: number | null
}

/**
 * In-memory cache implementation with TTL support.
 * Uses Map-based storage with periodic cleanup.
 */
export class MemoryCache implements CacheProvider {
  private cache = new Map<string, CacheEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Periodic cleanup every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60_000)

    // Prevent interval from keeping Node.js alive
    this.cleanupInterval.unref()
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    // Check expiration
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
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
      .replace(/\*/g, '.*') // Convert * to .*
      .replace(/\?/g, '.') // Convert ? to .

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
    // Memory cache is always available
  }

  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt !== null && entry.expiresAt < now) {
        this.cache.delete(key)
      }
    }
  }
}
