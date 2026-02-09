export const CacheKeys = {
  CONTENT_LIST: 'content:list',
  CONTENT_BUNDLE: 'content:bundle',
  CONTENT_ITEM: 'content:item',
  IDEMPOTENCY: 'idempotency',
  RATE_LIMIT: 'ratelimit',
  TOKEN_BUCKET: 'tokenbucket',
} as const

export const CacheTTL = {
  CONTENT_LIST: 60,
  CONTENT_BUNDLE: 300,
  CONTENT_ITEM: 300,
  IDEMPOTENCY: 86400,
  RATE_LIMIT: 60,
} as const
