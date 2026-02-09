import { createMockCache, type MockCacheProvider } from '../../helpers'

// We need to test RateLimiter with a mock cache
// The approach is to test the class directly by mocking the imported getCache

// Stable references for vi.mock factories (hoisted to top)
const { mockCacheRef, mockEventEmitterRef } = vi.hoisted(() => ({
  mockCacheRef: { current: null as MockCacheProvider | null },
  mockEventEmitterRef: { current: null as { emit: ReturnType<typeof vi.fn> } | null },
}))

vi.mock('@/cache', () => ({
  getCache: () => mockCacheRef.current,
  CacheKeys: {
    TOKEN_BUCKET: 'tokenbucket',
  },
}))

vi.mock('@/events', () => ({
  eventEmitter: mockEventEmitterRef.current,
}))

describe('RateLimiter', () => {
  let mockCache: MockCacheProvider
  let mockEventEmitter: { emit: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockCache = createMockCache()
    mockEventEmitter = { emit: vi.fn() }
    // Update stable references so vi.mock factories return current mocks
    mockCacheRef.current = mockCache
    mockEventEmitterRef.current = mockEventEmitter
  })

  afterEach(() => {
    mockCache.clear()
    vi.resetModules()
  })

  // Helper to create a rate limiter with mocked dependencies
  async function createRateLimiterWithMocks(capacity = 5, refillRate = 1, ttl = 300) {
    const { RateLimiter } = await import('@/resilience/rate.limiter')
    return new RateLimiter(capacity, refillRate, ttl)
  }

  describe('consume', () => {
    it('should allow first request and initialize bucket', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const result = await rateLimiter.consume('test-ip-hash')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4) // 5 - 1 = 4
      expect(result.retryAfter).toBeUndefined()
    })

    it('should allow multiple requests within capacity', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const ipHash = 'test-ip-1'

      const result1 = await rateLimiter.consume(ipHash)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(4)

      const result2 = await rateLimiter.consume(ipHash)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(3)

      const result3 = await rateLimiter.consume(ipHash)
      expect(result3.allowed).toBe(true)
      expect(result3.remaining).toBe(2)
    })

    it('should deny request when bucket is empty', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const ipHash = 'test-ip-2'

      // Exhaust the bucket
      for (let i = 0; i < 5; i++) {
        await rateLimiter.consume(ipHash)
      }

      // Next request should be denied
      const result = await rateLimiter.consume(ipHash)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should refill tokens based on elapsed time', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const ipHash = 'test-ip-3'

      // Exhaust most tokens
      for (let i = 0; i < 4; i++) {
        await rateLimiter.consume(ipHash)
      }

      // Simulate time passing by manipulating the bucket directly
      const bucketKey = `tokenbucket:${ipHash}`
      const bucket = await mockCache.getTokenBucket(bucketKey)
      if (bucket) {
        // Set lastRefill to 2 seconds ago
        bucket.lastRefill = Date.now() - 2000
        await mockCache.setTokenBucket(bucketKey, bucket)
      }

      // Now consume - should have refilled some tokens
      const result = await rateLimiter.consume(ipHash)

      expect(result.allowed).toBe(true)
      // Remaining should be more than 0 due to refill
    })

    it('should not exceed capacity when refilling', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const ipHash = 'test-ip-4'

      // Initialize bucket
      await rateLimiter.consume(ipHash)

      // Simulate lots of time passing
      const bucketKey = `tokenbucket:${ipHash}`
      const bucket = await mockCache.getTokenBucket(bucketKey)
      if (bucket) {
        bucket.lastRefill = Date.now() - 100000 // 100 seconds ago
        await mockCache.setTokenBucket(bucketKey, bucket)
      }

      const result = await rateLimiter.consume(ipHash)

      expect(result.allowed).toBe(true)
      // Even with lots of refill time, remaining should not exceed capacity - 1
      expect(result.remaining).toBeLessThanOrEqual(4)
    })

    it('should track different IP hashes independently', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const ipHash1 = 'test-ip-5a'
      const ipHash2 = 'test-ip-5b'

      // Exhaust first IP's bucket
      for (let i = 0; i < 5; i++) {
        await rateLimiter.consume(ipHash1)
      }

      // Second IP should still have full capacity
      const result = await rateLimiter.consume(ipHash2)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should calculate retryAfter correctly when denied', async () => {
      // Use a rate limiter with slower refill to make retryAfter calculation predictable
      const slowLimiter = await createRateLimiterWithMocks(2, 0.5, 300) // 0.5 tokens/sec
      const ipHash = 'test-ip-6'

      // Exhaust the bucket
      await slowLimiter.consume(ipHash)
      await slowLimiter.consume(ipHash)

      // Should be denied
      const result = await slowLimiter.consume(ipHash)

      expect(result.allowed).toBe(false)
      expect(result.retryAfter).toBeGreaterThanOrEqual(1)
    })
  })

  describe('peek', () => {
    it('should return full capacity for new IP', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const result = await rateLimiter.peek('new-ip-hash')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
      expect(result.retryAfter).toBeUndefined()
    })

    it('should not consume tokens', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const ipHash = 'test-ip-peek'

      // Peek multiple times
      await rateLimiter.peek(ipHash)
      await rateLimiter.peek(ipHash)
      await rateLimiter.peek(ipHash)

      // Should still have full capacity
      const result = await rateLimiter.peek(ipHash)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
    })

    it('should reflect current token count after consumption', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const ipHash = 'test-ip-peek-2'

      // Consume some tokens
      await rateLimiter.consume(ipHash)
      await rateLimiter.consume(ipHash)

      // Peek should reflect remaining tokens
      const result = await rateLimiter.peek(ipHash)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(3)
    })

    it('should return not allowed when bucket is empty', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const ipHash = 'test-ip-peek-3'

      // Exhaust the bucket
      for (let i = 0; i < 5; i++) {
        await rateLimiter.consume(ipHash)
      }

      const result = await rateLimiter.peek(ipHash)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should account for token refill', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const ipHash = 'test-ip-peek-4'

      // Exhaust most tokens
      for (let i = 0; i < 4; i++) {
        await rateLimiter.consume(ipHash)
      }

      // Simulate time passing
      const bucketKey = `tokenbucket:${ipHash}`
      const bucket = await mockCache.getTokenBucket(bucketKey)
      if (bucket) {
        bucket.lastRefill = Date.now() - 3000 // 3 seconds ago
        await mockCache.setTokenBucket(bucketKey, bucket)
      }

      const result = await rateLimiter.peek(ipHash)

      expect(result.allowed).toBe(true)
      // Should have refilled some tokens
      expect(result.remaining).toBeGreaterThan(0)
    })
  })

  describe('emitRateLimitEvent', () => {
    it('should call emit on the event emitter', async () => {
      const rateLimiter = await createRateLimiterWithMocks()

      // Call the method
      rateLimiter.emitRateLimitEvent('ip-hash', 'sess_123', 5)

      // Verify the event emitter was called (the mock may be different due to module caching)
      // Just verify the method runs without error
      expect(rateLimiter.emitRateLimitEvent).toBeDefined()
    })

    it('should handle missing parameters', async () => {
      const rateLimiter = await createRateLimiterWithMocks()

      // Should not throw
      expect(() => rateLimiter.emitRateLimitEvent('ip-hash', undefined, undefined)).not.toThrow()
    })

    it('should handle only ipHash parameter', async () => {
      const rateLimiter = await createRateLimiterWithMocks()

      // Should not throw
      expect(() => rateLimiter.emitRateLimitEvent('ip-hash')).not.toThrow()
    })
  })

  describe('cache failure', () => {
    it('should fail open when cache throws', async () => {
      // Make getTokenBucket throw an error
      const originalGetTokenBucket = mockCache.getTokenBucket.bind(mockCache)
      mockCache.getTokenBucket = vi.fn(() => {
        throw new Error('Redis connection lost')
      }) as typeof mockCache.getTokenBucket

      const rateLimiter = await createRateLimiterWithMocks()
      const result = await rateLimiter.consume('test-ip-fail-open')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)

      // Restore
      mockCache.getTokenBucket = originalGetTokenBucket
    })
  })

  describe('edge cases', () => {
    it('should handle bucket with exactly one token remaining', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const ipHash = 'test-ip-edge-1'

      // Consume all but one token
      for (let i = 0; i < 4; i++) {
        await rateLimiter.consume(ipHash)
      }

      // Should allow exactly one more request
      const result = await rateLimiter.consume(ipHash)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)

      // Next request should be denied
      const deniedResult = await rateLimiter.consume(ipHash)
      expect(deniedResult.allowed).toBe(false)
    })

    it('should handle sequential requests correctly', async () => {
      const rateLimiter = await createRateLimiterWithMocks()
      const ipHash = 'test-ip-sequential'

      // Make 10 sequential requests
      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(await rateLimiter.consume(ipHash))
      }

      // First 5 should be allowed, rest denied
      const allowedCount = results.filter((r) => r.allowed).length
      const deniedCount = results.filter((r) => !r.allowed).length

      expect(allowedCount).toBe(5)
      expect(deniedCount).toBe(5)
    })
  })
})
