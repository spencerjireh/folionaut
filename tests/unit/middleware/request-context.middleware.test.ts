import { Request, Response, NextFunction } from 'express'

// Mock crypto.randomUUID
const mockUUID = '550e8400-e29b-41d4-a716-446655440000'

describe('requestContextMiddleware', () => {
  let requestContextMiddleware: typeof import('@/middleware/request-context.middleware').requestContextMiddleware
  let getRequestContext: typeof import('@/middleware/request-context.middleware').getRequestContext
  let requestContext: typeof import('@/middleware/request-context.middleware').requestContext

  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    // Set up crypto mock before importing
    vi.stubGlobal('crypto', {
      ...globalThis.crypto,
      randomUUID: vi.fn(() => mockUUID),
    })

    vi.resetModules()

    // Dynamic import after setting up mocks
    const module = await import('@/middleware/request-context.middleware')
    requestContextMiddleware = module.requestContextMiddleware
    getRequestContext = module.getRequestContext
    requestContext = module.requestContext

    mockReq = {
      headers: {},
    }
    mockRes = {}
    mockNext = vi.fn()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should create context with request ID from headers', () =>
    new Promise<void>((resolve) => {
      const requestId = 'test-request-id'
      mockReq.headers = { 'x-request-id': requestId }

      mockNext = vi.fn(() => {
        const context = getRequestContext()
        expect(context).toBeDefined()
        expect(context?.requestId).toBe(requestId)
        resolve()
      })

      const middleware = requestContextMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
    }))

  it('should generate request ID if none provided', () =>
    new Promise<void>((resolve) => {
      mockNext = vi.fn(() => {
        const context = getRequestContext()
        expect(context?.requestId).toBe(mockUUID)
        resolve()
      })

      const middleware = requestContextMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
    }))

  it('should set startTime in context', () =>
    new Promise<void>((resolve) => {
      const beforeTime = Date.now()

      mockNext = vi.fn(() => {
        const context = getRequestContext()
        const afterTime = Date.now()
        expect(context?.startTime).toBeGreaterThanOrEqual(beforeTime)
        expect(context?.startTime).toBeLessThanOrEqual(afterTime)
        resolve()
      })

      const middleware = requestContextMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
    }))

  it('should call next within context', () =>
    new Promise<void>((resolve) => {
      mockNext = vi.fn(() => {
        expect(mockNext).toHaveBeenCalled()
        resolve()
      })

      const middleware = requestContextMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
    }))
})

describe('getRequestContext', () => {
  let getRequestContext: typeof import('@/middleware/request-context.middleware').getRequestContext
  let requestContext: typeof import('@/middleware/request-context.middleware').requestContext

  beforeEach(async () => {
    vi.resetModules()
    const module = await import('@/middleware/request-context.middleware')
    getRequestContext = module.getRequestContext
    requestContext = module.requestContext
  })

  it('should return undefined outside of context', () => {
    const context = getRequestContext()
    expect(context).toBeUndefined()
  })

  it('should return context when running inside context', () =>
    new Promise<void>((resolve) => {
      const testContext = {
        requestId: 'test-id',
        startTime: Date.now(),
      }

      requestContext.run(testContext, () => {
        const context = getRequestContext()
        expect(context).toEqual(testContext)
        resolve()
      })
    }))
})
