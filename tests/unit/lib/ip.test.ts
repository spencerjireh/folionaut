import { extractClientIP, hashIP } from '@/lib/ip'
import { Request } from 'express'

describe('extractClientIP', () => {
  it('should use req.ip directly', () => {
    const req = {
      headers: {},
      ip: '192.168.1.1',
    } as unknown as Request

    expect(extractClientIP(req)).toBe('192.168.1.1')
  })

  it('should fall back to 127.0.0.1 when req.ip is undefined', () => {
    const req = {
      headers: {},
      ip: undefined,
    } as unknown as Request

    expect(extractClientIP(req)).toBe('127.0.0.1')
  })
})

describe('hashIP', () => {
  it('should return a 16-character hex string', () => {
    const hash = hashIP('192.168.1.1')

    expect(hash).toHaveLength(16)
    expect(hash).toMatch(/^[a-f0-9]+$/)
  })

  it('should return consistent hash for same IP', () => {
    const hash1 = hashIP('192.168.1.1')
    const hash2 = hashIP('192.168.1.1')

    expect(hash1).toBe(hash2)
  })

  it('should return different hash for different IPs', () => {
    const hash1 = hashIP('192.168.1.1')
    const hash2 = hashIP('192.168.1.2')

    expect(hash1).not.toBe(hash2)
  })

  it('should handle IPv6 addresses', () => {
    const hash = hashIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')

    expect(hash).toHaveLength(16)
    expect(hash).toMatch(/^[a-f0-9]+$/)
  })

  it('should handle localhost', () => {
    const hash = hashIP('127.0.0.1')

    expect(hash).toHaveLength(16)
    expect(hash).toMatch(/^[a-f0-9]+$/)
  })
})
