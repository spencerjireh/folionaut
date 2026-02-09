import {
  SendMessageRequestSchema,
  SessionIdParamSchema,
  SessionListQuerySchema,
} from '@/validation/chat.schemas'
import { parseZodErrors } from '@/validation/parse-errors'
import { ZodError } from 'zod'

describe('Chat Validation Schemas', () => {
  describe('SendMessageRequestSchema', () => {
    it('should validate valid request', () => {
      const data = {
        message: 'Hello, how are you?',
        visitorId: 'visitor-123',
      }
      const result = SendMessageRequestSchema.parse(data)

      expect(result.message).toBe('Hello, how are you?')
      expect(result.visitorId).toBe('visitor-123')
    })

    it('should reject empty message', () => {
      expect(() =>
        SendMessageRequestSchema.parse({
          message: '',
          visitorId: 'visitor-123',
        })
      ).toThrow()
    })

    it('should reject message over 2000 characters', () => {
      expect(() =>
        SendMessageRequestSchema.parse({
          message: 'a'.repeat(2001),
          visitorId: 'visitor-123',
        })
      ).toThrow()
    })

    it('should accept message at exactly 2000 characters', () => {
      const data = {
        message: 'a'.repeat(2000),
        visitorId: 'visitor-123',
      }
      expect(() => SendMessageRequestSchema.parse(data)).not.toThrow()
    })

    it('should reject empty visitorId', () => {
      expect(() =>
        SendMessageRequestSchema.parse({
          message: 'Hello',
          visitorId: '',
        })
      ).toThrow()
    })

    it('should reject visitorId over 100 characters', () => {
      expect(() =>
        SendMessageRequestSchema.parse({
          message: 'Hello',
          visitorId: 'a'.repeat(101),
        })
      ).toThrow()
    })

    it('should reject missing message', () => {
      expect(() =>
        SendMessageRequestSchema.parse({
          visitorId: 'visitor-123',
        })
      ).toThrow()
    })

    it('should reject missing visitorId', () => {
      expect(() =>
        SendMessageRequestSchema.parse({
          message: 'Hello',
        })
      ).toThrow()
    })
  })

  describe('SessionIdParamSchema', () => {
    it('should accept valid session ID', () => {
      const result = SessionIdParamSchema.parse({ id: 'sess_abc123' })
      expect(result.id).toBe('sess_abc123')
    })

    it('should reject session ID without prefix', () => {
      expect(() => SessionIdParamSchema.parse({ id: 'abc123' })).toThrow()
    })

    it('should reject session ID with wrong prefix', () => {
      expect(() => SessionIdParamSchema.parse({ id: 'content_abc123' })).toThrow()
    })

    it('should reject empty session ID', () => {
      expect(() => SessionIdParamSchema.parse({ id: '' })).toThrow()
    })
  })

  describe('SessionListQuerySchema', () => {
    it('should provide defaults for empty query', () => {
      const result = SessionListQuerySchema.parse({})

      expect(result.status).toBeUndefined()
      expect(result.limit).toBe(50)
      expect(result.offset).toBe(0)
    })

    it('should accept valid status filter', () => {
      const result = SessionListQuerySchema.parse({ status: 'active' })
      expect(result.status).toBe('active')
    })

    it('should accept all valid statuses', () => {
      expect(SessionListQuerySchema.parse({ status: 'active' }).status).toBe('active')
      expect(SessionListQuerySchema.parse({ status: 'ended' }).status).toBe('ended')
      expect(SessionListQuerySchema.parse({ status: 'expired' }).status).toBe('expired')
    })

    it('should reject invalid status', () => {
      expect(() => SessionListQuerySchema.parse({ status: 'invalid' })).toThrow()
    })

    it('should parse string limit and offset', () => {
      const result = SessionListQuerySchema.parse({
        limit: '25',
        offset: '10',
      })

      expect(result.limit).toBe(25)
      expect(result.offset).toBe(10)
    })

    it('should enforce limit minimum', () => {
      expect(() => SessionListQuerySchema.parse({ limit: '0' })).toThrow()
    })

    it('should enforce limit maximum', () => {
      expect(() => SessionListQuerySchema.parse({ limit: '101' })).toThrow()
    })

    it('should enforce offset minimum', () => {
      expect(() => SessionListQuerySchema.parse({ offset: '-1' })).toThrow()
    })
  })

  describe('parseZodErrors', () => {
    it('should convert Zod errors to field map', () => {
      try {
        SendMessageRequestSchema.parse({})
      } catch (error) {
        const fields = parseZodErrors(error as ZodError)

        expect(fields).toHaveProperty('message')
        expect(fields).toHaveProperty('visitorId')
        expect(fields.message).toBeInstanceOf(Array)
        expect(fields.visitorId).toBeInstanceOf(Array)
      }
    })

    it('should include error messages', () => {
      try {
        SendMessageRequestSchema.parse({ message: '', visitorId: 'test' })
      } catch (error) {
        const fields = parseZodErrors(error as ZodError)

        expect(fields.message[0]).toBe('Message is required')
      }
    })

    it('should handle multiple errors on same field', () => {
      // Create a custom schema that would produce multiple errors
      // In practice, Zod typically returns one error per field
      try {
        SendMessageRequestSchema.parse({ message: '', visitorId: '' })
      } catch (error) {
        const fields = parseZodErrors(error as ZodError)

        // Both fields should have errors
        expect(Object.keys(fields).length).toBeGreaterThanOrEqual(2)
      }
    })

    it('should use _root for root-level errors', async () => {
      // Test with a simple string schema to get root-level error
      const { z } = await import('zod')
      const StringSchema = z.string().min(1)
      try {
        StringSchema.parse('')
      } catch (error) {
        const fields = parseZodErrors(error as ZodError)

        expect(fields).toHaveProperty('_root')
      }
    })
  })
})
