export interface TokenBucket {
  tokens: number
  lastRefill: number
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | undefined>
  set(key: string, value: unknown, ttl?: number): Promise<void>
  del(key: string): Promise<void>
  delPattern(pattern: string): Promise<number>
  incr(key: string, ttl?: number): Promise<number>
  decr(key: string): Promise<number>
  getTokenBucket(key: string): Promise<TokenBucket | undefined>
  setTokenBucket(key: string, bucket: TokenBucket, ttl?: number): Promise<void>
  ping(): Promise<void>
  close(): Promise<void>
}
