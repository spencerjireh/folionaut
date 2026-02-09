import { generateETag, isStale, setCacheHeaders } from '@/lib/etag'
import { Response } from 'express'

describe('generateETag', () => {
  it('should generate weak ETag with W/ prefix', () => {
    const etag = generateETag({ test: 'data' })

    expect(etag).toMatch(/^W\/"[a-f0-9]{32}"$/)
  })

  it('should generate consistent ETag for same data', () => {
    const data = { foo: 'bar', num: 123 }
    const etag1 = generateETag(data)
    const etag2 = generateETag(data)

    expect(etag1).toBe(etag2)
  })

  it('should generate different ETag for different data', () => {
    const etag1 = generateETag({ foo: 'bar' })
    const etag2 = generateETag({ foo: 'baz' })

    expect(etag1).not.toBe(etag2)
  })

  it('should handle arrays', () => {
    const etag = generateETag([1, 2, 3])

    expect(etag).toMatch(/^W\/"[a-f0-9]{32}"$/)
  })

  it('should handle nested objects', () => {
    const etag = generateETag({
      level1: {
        level2: {
          value: 'deep',
        },
      },
    })

    expect(etag).toMatch(/^W\/"[a-f0-9]{32}"$/)
  })

  it('should handle null', () => {
    const etag = generateETag(null)

    expect(etag).toMatch(/^W\/"[a-f0-9]{32}"$/)
  })

  it('should handle primitive values', () => {
    expect(generateETag('string')).toMatch(/^W\/"[a-f0-9]{32}"$/)
    expect(generateETag(123)).toMatch(/^W\/"[a-f0-9]{32}"$/)
    expect(generateETag(true)).toMatch(/^W\/"[a-f0-9]{32}"$/)
  })
})

describe('isStale', () => {
  const testEtag = 'W/"abc123"'

  it('should return true when If-None-Match is undefined', () => {
    expect(isStale(testEtag, undefined)).toBe(true)
  })

  it('should return false when ETag matches (weak comparison)', () => {
    expect(isStale(testEtag, 'W/"abc123"')).toBe(false)
  })

  it('should return false when ETag matches without W/ prefix', () => {
    expect(isStale(testEtag, '"abc123"')).toBe(false)
  })

  it('should return true when ETag does not match', () => {
    expect(isStale(testEtag, 'W/"xyz789"')).toBe(true)
  })

  it('should handle array of If-None-Match values', () => {
    expect(isStale(testEtag, ['W/"other"', 'W/"abc123"'])).toBe(false)
    expect(isStale(testEtag, ['W/"other"', 'W/"another"'])).toBe(true)
  })

  it('should handle strong ETag against weak ETag', () => {
    // Weak comparison - should match
    expect(isStale('W/"abc123"', '"abc123"')).toBe(false)
  })

  it('should handle wildcard (*)', () => {
    // Note: Current implementation doesn't handle wildcard specially
    // This test documents current behavior
    expect(isStale(testEtag, '*')).toBe(true)
  })
})

describe('setCacheHeaders', () => {
  let mockRes: Partial<Response>
  let headers: Record<string, string>

  beforeEach(() => {
    headers = {}
    mockRes = {
      setHeader: vi.fn((name: string, value: string) => {
        headers[name] = value
        return mockRes as Response
      }),
    }
  })

  it('should set ETag header', () => {
    setCacheHeaders(mockRes as Response, { etag: 'W/"test123"' })

    expect(mockRes.setHeader).toHaveBeenCalledWith('ETag', 'W/"test123"')
  })

  it('should set Cache-Control header when maxAge is provided', () => {
    setCacheHeaders(mockRes as Response, { etag: 'W/"test"', maxAge: 300 })

    expect(mockRes.setHeader).toHaveBeenCalledWith('ETag', 'W/"test"')
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300')
  })

  it('should not set Cache-Control when maxAge is undefined', () => {
    setCacheHeaders(mockRes as Response, { etag: 'W/"test"' })

    expect(mockRes.setHeader).toHaveBeenCalledTimes(1)
    expect(mockRes.setHeader).toHaveBeenCalledWith('ETag', 'W/"test"')
  })

  it('should handle maxAge of 0', () => {
    setCacheHeaders(mockRes as Response, { etag: 'W/"test"', maxAge: 0 })

    expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=0')
  })
})
