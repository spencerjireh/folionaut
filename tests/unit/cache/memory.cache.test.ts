import { MemoryCache } from '@/cache/memory.cache'

describe('MemoryCache', () => {
  let cache: MemoryCache

  beforeEach(() => {
    cache = new MemoryCache()
  })

  afterEach(async () => {
    await cache.close()
  })

  describe('get/set', () => {
    it('should store and retrieve values', async () => {
      await cache.set('key', 'value')
      const result = await cache.get<string>('key')

      expect(result).toBe('value')
    })

    it('should return undefined for non-existent keys', async () => {
      const result = await cache.get('non-existent')

      expect(result).toBeUndefined()
    })

    it('should store complex objects', async () => {
      const data = { name: 'test', nested: { value: 123 } }
      await cache.set('object', data)
      const result = await cache.get<typeof data>('object')

      expect(result).toEqual(data)
    })

    it('should overwrite existing values', async () => {
      await cache.set('key', 'value1')
      await cache.set('key', 'value2')
      const result = await cache.get<string>('key')

      expect(result).toBe('value2')
    })
  })

  describe('TTL', () => {
    it('should expire values after TTL', async () => {
      const originalDateNow = Date.now
      let currentTime = originalDateNow()

      // Mock Date.now
      Date.now = vi.fn(() => currentTime)

      await cache.set('key', 'value', 1) // 1 second TTL

      // Value should exist initially
      expect(await cache.get('key')).toBe('value')

      // Advance time past TTL
      currentTime += 1001

      // Value should be expired
      expect(await cache.get('key')).toBeUndefined()

      // Restore Date.now
      Date.now = originalDateNow
    })

    it('should not expire values without TTL', async () => {
      const originalDateNow = Date.now
      let currentTime = originalDateNow()

      Date.now = vi.fn(() => currentTime)

      await cache.set('key', 'value') // No TTL

      currentTime += 100000

      expect(await cache.get('key')).toBe('value')

      Date.now = originalDateNow
    })
  })

  describe('del', () => {
    it('should delete existing keys', async () => {
      await cache.set('key', 'value')
      await cache.del('key')

      expect(await cache.get('key')).toBeUndefined()
    })

    it('should not throw for non-existent keys', async () => {
      await expect(cache.del('non-existent')).resolves.toBeUndefined()
    })
  })

  describe('delPattern', () => {
    it('should delete keys matching pattern with *', async () => {
      await cache.set('prefix:key1', 'value1')
      await cache.set('prefix:key2', 'value2')
      await cache.set('other:key', 'value3')

      const deleted = await cache.delPattern('prefix:*')

      expect(deleted).toBe(2)
      expect(await cache.get('prefix:key1')).toBeUndefined()
      expect(await cache.get('prefix:key2')).toBeUndefined()
      expect(await cache.get('other:key')).toBe('value3')
    })

    it('should delete keys matching pattern with ?', async () => {
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')
      await cache.set('key10', 'value10')

      const deleted = await cache.delPattern('key?')

      expect(deleted).toBe(2)
      expect(await cache.get('key1')).toBeUndefined()
      expect(await cache.get('key2')).toBeUndefined()
      expect(await cache.get('key10')).toBe('value10')
    })

    it('should return 0 when no keys match', async () => {
      await cache.set('key', 'value')

      const deleted = await cache.delPattern('other:*')

      expect(deleted).toBe(0)
    })
  })

  describe('incr/decr', () => {
    it('should increment from 0 for new keys', async () => {
      const result = await cache.incr('counter')

      expect(result).toBe(1)
    })

    it('should increment existing values', async () => {
      await cache.set('counter', 5)

      const result = await cache.incr('counter')

      expect(result).toBe(6)
    })

    it('should apply TTL on increment', async () => {
      const originalDateNow = Date.now
      let currentTime = originalDateNow()
      Date.now = vi.fn(() => currentTime)

      await cache.incr('counter', 1) // 1 second TTL

      expect(await cache.get('counter')).toBe(1)

      currentTime += 1001

      expect(await cache.get('counter')).toBeUndefined()

      Date.now = originalDateNow
    })

    it('should decrement values', async () => {
      await cache.set('counter', 5)

      const result = await cache.decr('counter')

      expect(result).toBe(4)
    })

    it('should not go below 0 on decrement', async () => {
      await cache.set('counter', 0)

      const result = await cache.decr('counter')

      expect(result).toBe(0)
    })

    it('should decrement from 0 for new keys', async () => {
      const result = await cache.decr('counter')

      expect(result).toBe(0)
    })
  })

  describe('token bucket operations', () => {
    it('should store and retrieve token bucket', async () => {
      const bucket = { tokens: 10, lastRefill: Date.now() }

      await cache.setTokenBucket('bucket:key', bucket)
      const result = await cache.getTokenBucket('bucket:key')

      expect(result).toEqual(bucket)
    })

    it('should return undefined for non-existent bucket', async () => {
      const result = await cache.getTokenBucket('non-existent')

      expect(result).toBeUndefined()
    })

    it('should apply TTL to token bucket', async () => {
      const originalDateNow = Date.now
      let currentTime = originalDateNow()
      Date.now = vi.fn(() => currentTime)

      const bucket = { tokens: 10, lastRefill: currentTime }
      await cache.setTokenBucket('bucket:key', bucket, 1)

      expect(await cache.getTokenBucket('bucket:key')).toEqual(bucket)

      currentTime += 1001

      expect(await cache.getTokenBucket('bucket:key')).toBeUndefined()

      Date.now = originalDateNow
    })
  })

  describe('ping', () => {
    it('should resolve without error', async () => {
      await expect(cache.ping()).resolves.toBeUndefined()
    })
  })

  describe('close', () => {
    it('should clear all data', async () => {
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      await cache.close()

      expect(await cache.get('key1')).toBeUndefined()
      expect(await cache.get('key2')).toBeUndefined()
    })

    it('should be safe to call multiple times', async () => {
      await cache.close()
      await expect(cache.close()).resolves.toBeUndefined()
    })
  })

  describe('cleanup', () => {
    it('should return undefined for expired entries on get', async () => {
      const originalDateNow = Date.now
      let currentTime = originalDateNow()
      Date.now = vi.fn(() => currentTime)

      await cache.set('key1', 'value1', 30) // Expires in 30 seconds
      await cache.set('key2', 'value2', 90) // Expires in 90 seconds

      // Both should exist initially
      expect(await cache.get('key1')).toBe('value1')
      expect(await cache.get('key2')).toBe('value2')

      // Advance time past key1's expiry
      currentTime += 31000

      // key1 should be expired, key2 should still exist
      expect(await cache.get('key1')).toBeUndefined()
      expect(await cache.get('key2')).toBe('value2')

      Date.now = originalDateNow
    })
  })
})
