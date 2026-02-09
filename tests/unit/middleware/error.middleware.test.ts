import { Request, Response, NextFunction } from 'express'

const { mockGetRequestContext } = vi.hoisted(() => ({
  mockGetRequestContext: vi.fn(() => ({ requestId: 'test-request-id' })),
}))

vi.mock('@/middleware/request-context.middleware', () => ({
  getRequestContext: mockGetRequestContext,
}))

vi.mock('@/config/env', () => ({
  env: {
    NODE_ENV: 'test',
  },
}))

describe('errorHandlerMiddleware', () => {
  let errorHandlerMiddleware: typeof import('@/middleware/error.middleware').errorHandlerMiddleware
  let AppError: typeof import('@/errors/app.error').AppError
  let ValidationError: typeof import('@/errors/app.error').ValidationError
  let NotFoundError: typeof import('@/errors/app.error').NotFoundError
  let UnauthorizedError: typeof import('@/errors/app.error').UnauthorizedError
  let RateLimitError: typeof import('@/errors/app.error').RateLimitError

  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: vi.Mock<NextFunction>
  let jsonMock: vi.Mock
  let statusMock: vi.Mock
  let setHeaderMock: vi.Mock

  beforeEach(async () => {
    vi.clearAllMocks()
    mockGetRequestContext.mockReturnValue({ requestId: 'test-request-id' })

    // Dynamic imports to apply mocks
    const errorHandlerModule = await import('@/middleware/error.middleware')
    errorHandlerMiddleware = errorHandlerModule.errorHandlerMiddleware

    const errorsModule = await import('@/errors/app.error')
    AppError = errorsModule.AppError
    ValidationError = errorsModule.ValidationError
    NotFoundError = errorsModule.NotFoundError
    UnauthorizedError = errorsModule.UnauthorizedError
    RateLimitError = errorsModule.RateLimitError

    jsonMock = vi.fn()
    setHeaderMock = vi.fn()
    statusMock = vi.fn().mockReturnValue({ json: jsonMock })

    mockReq = {}
    mockRes = {
      status: statusMock,
      setHeader: setHeaderMock,
    }
    mockNext = vi.fn()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('AppError handling', () => {
    it('should handle AppError with correct status and response', () => {
      const error = new AppError('Test error', 'TEST_CODE', 500)

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'TEST_CODE',
          message: 'Test error',
          requestId: 'test-request-id',
        },
      })
    })

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('Resource', 'id-123')

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: "Resource with identifier 'id-123' not found",
          requestId: 'test-request-id',
        },
      })
    })

    it('should handle UnauthorizedError', () => {
      const error = new UnauthorizedError('Access denied')

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access denied',
          requestId: 'test-request-id',
        },
      })
    })
  })

  describe('ValidationError handling', () => {
    it('should include field errors in response', () => {
      const error = new ValidationError('Invalid input', {
        email: ['Required'],
        password: ['Too short'],
      })

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          requestId: 'test-request-id',
          fields: {
            email: ['Required'],
            password: ['Too short'],
          },
        },
      })
    })

    it('should not include empty fields object', () => {
      const error = new ValidationError('Invalid input', {})

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      const response = jsonMock.mock.calls[0][0]
      expect(response.error.fields).toBeUndefined()
    })
  })

  describe('RateLimitError handling', () => {
    it('should set Retry-After header', () => {
      const error = new RateLimitError(60)

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(429)
      expect(setHeaderMock).toHaveBeenCalledWith('Retry-After', '60')
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          requestId: 'test-request-id',
          retryAfter: 60,
        },
      })
    })
  })

  describe('Non-operational error handling', () => {
    it('should handle generic Error', () => {
      const error = new Error('Something went wrong')

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong', // In test mode, original message is shown
          requestId: 'test-request-id',
        },
      })
    })
  })

  describe('request context', () => {
    it('should include requestId from context', () => {
      const error = new AppError('Test', 'TEST', 500)

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      const response = jsonMock.mock.calls[0][0]
      expect(response.error.requestId).toBe('test-request-id')
    })

    it('should handle missing request context', () => {
      mockGetRequestContext.mockReturnValue(undefined)
      const error = new AppError('Test', 'TEST', 500)

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext)

      const response = jsonMock.mock.calls[0][0]
      expect(response.error.requestId).toBeUndefined()
    })
  })
})
