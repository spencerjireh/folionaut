import { createHash } from 'node:crypto'
import type { Response } from 'express'

/**
 * Generates a weak ETag from data by MD5 hashing the JSON-stringified content.
 */
export function generateETag(data: unknown): string {
  const hash = createHash('md5').update(JSON.stringify(data)).digest('hex')
  return `W/"${hash}"`
}

/**
 * Checks if the content is stale by comparing ETags.
 * Returns true if content should be returned (stale or no match).
 * Returns false if content hasn't changed (304 can be returned).
 */
export function isStale(etag: string, ifNoneMatch: string | string[] | undefined): boolean {
  if (!ifNoneMatch) return true

  const tags = Array.isArray(ifNoneMatch) ? ifNoneMatch : [ifNoneMatch]
  const normalizedEtag = etag.replace(/^W\//, '')

  return !tags.some((tag) => {
    const normalizedTag = tag.replace(/^W\//, '')
    return normalizedTag === normalizedEtag
  })
}

interface CacheOptions {
  etag: string
  maxAge?: number
}

/**
 * Sets ETag and Cache-Control headers on the response.
 */
export function setCacheHeaders(res: Response, options: CacheOptions): void {
  res.setHeader('ETag', options.etag)
  if (options.maxAge !== undefined) {
    res.setHeader('Cache-Control', `public, max-age=${options.maxAge}`)
  }
}
