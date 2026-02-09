import { createHash } from 'crypto'
import type { Request } from 'express'

/**
 * Extracts the client IP address from the request.
 * Relies on Express's `trust proxy` setting to correctly resolve req.ip
 * from X-Forwarded-For headers set by the reverse proxy.
 */
export function extractClientIP(req: Request): string {
  return req.ip ?? '127.0.0.1'
}

/**
 * Hashes an IP address using SHA256.
 * Returns the first 16 characters of the hex hash for privacy.
 */
export function hashIP(ip: string): string {
  const hash = createHash('sha256').update(ip).digest('hex')
  return hash.substring(0, 16)
}
