import request from 'supertest'
import express, { type Express } from 'express'
import { createMockCache, type MockCacheProvider } from '../../helpers'

const { mockCacheRef, mockEmit } = vi.hoisted(() => ({
  mockCacheRef: { current: null as MockCacheProvider | null },
  mockEmit: vi.fn(),
}))

vi.mock('@/cache', () => ({
  getCache: () => mockCacheRef.current,
  CacheKeys: {
    TOKEN_BUCKET: 'tokenbucket',
    CONTENT_TOKEN_BUCKET: 'content_tokenbucket',
  },
}))

vi.mock('@/events', () => ({
  eventEmitter: { emit: mockEmit },
}))

describe('rateLimitMiddleware', () => {
  let app: Express
  let mockCache: MockCacheProvider

  beforeEach(() => {
    mockCache = createMockCache()
    mockCacheRef.current = mockCache
    mockEmit.mockClear()
    app = express()
    app.set('trust proxy', 1)
  })

  afterEach(() => {
    mockCache.clear()
    vi.resetModules()
  })

  async function setupApp(capacity = 3, refillRate = 1, keyPrefix = 'content_tokenbucket') {
    const { rateLimitMiddleware } = await import('@/middleware/rate-limit.middleware')
    app.use(rateLimitMiddleware({ capacity, refillRate, keyPrefix }))
    app.get('/test', (_req, res) => {
      res.json({ status: 'ok' })
    })
    app.use(
      (
        err: { statusCode?: number; message?: string },
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        res.status(err.statusCode ?? 500).json({ error: err.message })
      }
    )
  }

  it('should allow requests within capacity', async () => {
    await setupApp(3)

    const res = await request(app).get('/test').set('X-Forwarded-For', '10.100.0.1')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('should return 429 when capacity is exceeded', async () => {
    await setupApp(2)

    const ip = '10.100.0.2'
    await request(app).get('/test').set('X-Forwarded-For', ip)
    await request(app).get('/test').set('X-Forwarded-For', ip)

    const res = await request(app).get('/test').set('X-Forwarded-For', ip)

    expect(res.status).toBe(429)
  })

  it('should emit content:rate_limited event when rate limited', async () => {
    await setupApp(1)

    const ip = '10.100.0.3'
    await request(app).get('/test').set('X-Forwarded-For', ip)
    await request(app).get('/test').set('X-Forwarded-For', ip)

    expect(mockEmit).toHaveBeenCalledWith(
      'content:rate_limited',
      expect.objectContaining({
        ipHash: expect.any(String),
        retryAfter: expect.any(Number),
        path: '/test',
      })
    )
  })

  it('should fail open on cache error', async () => {
    await setupApp(3)

    // Make cache throw
    const originalGet = mockCache.getTokenBucket.bind(mockCache)
    mockCache.getTokenBucket = vi.fn(() => {
      throw new Error('Cache failure')
    }) as typeof mockCache.getTokenBucket

    const res = await request(app).get('/test').set('X-Forwarded-For', '10.100.0.4')

    expect(res.status).toBe(200)

    mockCache.getTokenBucket = originalGet
  })

  it('should use the correct key prefix', async () => {
    const prefix = 'custom_prefix'
    await setupApp(3, 1, prefix)

    const ip = '10.100.0.5'
    await request(app).get('/test').set('X-Forwarded-For', ip)

    // Check that the cache key uses the custom prefix
    const keys = mockCache.keys()
    const hasCustomPrefix = keys.some((k) => k.startsWith(prefix + ':'))
    expect(hasCustomPrefix).toBe(true)
  })

  it('should track different IPs independently', async () => {
    await setupApp(1)

    const res1 = await request(app).get('/test').set('X-Forwarded-For', '10.100.0.6')
    const res2 = await request(app).get('/test').set('X-Forwarded-For', '10.100.0.7')

    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
  })
})
