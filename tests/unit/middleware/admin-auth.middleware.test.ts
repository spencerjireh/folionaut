import { Request, Response, NextFunction } from 'express'
import { adminAuthMiddleware } from '@/middleware/admin-auth.middleware'
import { UnauthorizedError } from '@/errors/app.error'
import { getTestAdminKey, getInvalidAdminKey } from '../../helpers'

describe('adminAuthMiddleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: vi.Mock<NextFunction>

  beforeEach(() => {
    mockReq = {
      headers: {},
    }
    mockRes = {}
    mockNext = vi.fn()
  })

  describe('when X-Admin-Key header is missing', () => {
    it('should call next with UnauthorizedError', () => {
      const middleware = adminAuthMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(1)
      const error = mockNext.mock.calls[0][0]
      expect(error).toBeInstanceOf(UnauthorizedError)
      expect(error.message).toBe('Missing X-Admin-Key header')
    })
  })

  describe('when X-Admin-Key header is not a string (array)', () => {
    it('should call next with UnauthorizedError', () => {
      mockReq.headers = {
        'x-admin-key': ['key1', 'key2'],
      }

      const middleware = adminAuthMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(1)
      const error = mockNext.mock.calls[0][0]
      expect(error).toBeInstanceOf(UnauthorizedError)
      expect(error.message).toBe('Missing X-Admin-Key header')
    })
  })

  describe('when X-Admin-Key is invalid', () => {
    it('should call next with UnauthorizedError for wrong key', () => {
      mockReq.headers = {
        'x-admin-key': getInvalidAdminKey(),
      }

      const middleware = adminAuthMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(1)
      const error = mockNext.mock.calls[0][0]
      expect(error).toBeInstanceOf(UnauthorizedError)
      expect(error.message).toBe('Invalid X-Admin-Key')
    })

    it('should call next with UnauthorizedError for key of different length', () => {
      mockReq.headers = {
        'x-admin-key': 'short-key',
      }

      const middleware = adminAuthMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(1)
      const error = mockNext.mock.calls[0][0]
      expect(error).toBeInstanceOf(UnauthorizedError)
      expect(error.message).toBe('Invalid X-Admin-Key')
    })

    it('should call next with UnauthorizedError for empty string', () => {
      mockReq.headers = {
        'x-admin-key': '',
      }

      const middleware = adminAuthMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(1)
      const error = mockNext.mock.calls[0][0]
      expect(error).toBeInstanceOf(UnauthorizedError)
      expect(error.message).toBe('Missing X-Admin-Key header')
    })
  })

  describe('when X-Admin-Key is valid', () => {
    it('should call next without error', () => {
      mockReq.headers = {
        'x-admin-key': getTestAdminKey(),
      }

      const middleware = adminAuthMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should set userId to admin on request', () => {
      mockReq.headers = {
        'x-admin-key': getTestAdminKey(),
      }

      const middleware = adminAuthMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect((mockReq as Request & { userId?: string }).userId).toBe('admin')
    })
  })

  describe('timing-safe comparison', () => {
    it('should handle valid key correctly', () => {
      const validKey = getTestAdminKey()

      mockReq.headers = { 'x-admin-key': validKey }
      const middleware = adminAuthMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should handle invalid key of same length correctly', () => {
      const invalidKey = getInvalidAdminKey()

      mockReq.headers = { 'x-admin-key': invalidKey }
      const middleware = adminAuthMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError))
    })
  })

  describe('header case sensitivity', () => {
    it('should accept lowercase header name', () => {
      mockReq.headers = {
        'x-admin-key': getTestAdminKey(),
      }

      const middleware = adminAuthMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })
  })
})
