import { isRetryableError, withRetry } from '@/llm/retry'
import { LLMError } from '@/errors/app.error'

describe('isRetryableError', () => {
  describe('LLMError handling', () => {
    it('should return true for HTTP 500 errors', () => {
      const error = new LLMError('HTTP 500 Internal Server Error', 'openai')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for HTTP 502 errors', () => {
      const error = new LLMError('HTTP 502 Bad Gateway', 'openai')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for HTTP 503 errors', () => {
      const error = new LLMError('HTTP 503 Service Unavailable', 'openai')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for HTTP 504 errors', () => {
      const error = new LLMError('HTTP 504 Gateway Timeout', 'openai')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for rate limit (429) errors', () => {
      const error = new LLMError('HTTP 429 Too Many Requests', 'openai')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for rate limit keyword errors', () => {
      const error = new LLMError('Rate limit exceeded', 'openai')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for network errors', () => {
      const error = new LLMError('Network error: fetch failed', 'openai')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for connection errors', () => {
      const error = new LLMError('Connection refused', 'openai')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for ECONNREFUSED errors', () => {
      const error = new LLMError('ECONNREFUSED', 'openai')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for ENOTFOUND errors', () => {
      const error = new LLMError('ENOTFOUND api.openai.com', 'openai')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for ETIMEDOUT errors', () => {
      const error = new LLMError('ETIMEDOUT', 'openai')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for timeout errors', () => {
      const error = new LLMError('Request timed out', 'openai')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return false for HTTP 400 errors', () => {
      const error = new LLMError('HTTP 400 Bad Request', 'openai')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should return false for HTTP 401 errors', () => {
      const error = new LLMError('HTTP 401 Unauthorized', 'openai')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should return false for HTTP 403 errors', () => {
      const error = new LLMError('HTTP 403 Forbidden', 'openai')
      expect(isRetryableError(error)).toBe(false)
    })
  })

  describe('generic error handling', () => {
    it('should return true for AbortError', () => {
      const error = new Error('Operation was aborted')
      error.name = 'AbortError'
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for TimeoutError', () => {
      const error = new Error('Operation timed out')
      error.name = 'TimeoutError'
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for fetch failed errors', () => {
      const error = new Error('fetch failed')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for socket hang up errors', () => {
      const error = new Error('socket hang up')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return false for generic errors', () => {
      const error = new Error('Something went wrong')
      expect(isRetryableError(error)).toBe(false)
    })
  })
})

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const result = await withRetry(fn)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new LLMError('HTTP 500 error', 'openai'))
      .mockResolvedValueOnce('success')

    const resultPromise = withRetry(fn, { maxRetries: 3, initialDelayMs: 100 })

    // Fast forward through the delay
    await vi.advanceTimersByTimeAsync(150)

    const result = await resultPromise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should not retry on non-retryable error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new LLMError('HTTP 400 Bad Request', 'openai'))

    await expect(withRetry(fn)).rejects.toThrow('HTTP 400 Bad Request')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should throw after max retries', async () => {
    vi.useRealTimers() // Use real timers for this test

    const fn = vi.fn()
      .mockRejectedValue(new LLMError('HTTP 500 error', 'openai'))

    await expect(
      withRetry(fn, { maxRetries: 2, initialDelayMs: 10, maxDelayMs: 20 })
    ).rejects.toThrow('HTTP 500 error')

    expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('should use default options', async () => {
    const fn = vi.fn().mockResolvedValue('result')

    const result = await withRetry(fn)

    expect(result).toBe('result')
  })

  it('should apply exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new LLMError('HTTP 503', 'openai'))
      .mockRejectedValueOnce(new LLMError('HTTP 503', 'openai'))
      .mockResolvedValueOnce('success')

    const startTime = Date.now()
    const resultPromise = withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
    })

    // First retry: ~100-125ms
    await vi.advanceTimersByTimeAsync(150)
    // Second retry: ~200-250ms
    await vi.advanceTimersByTimeAsync(300)

    const result = await resultPromise
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should cap delay at maxDelayMs', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new LLMError('HTTP 503', 'openai'))
      .mockRejectedValueOnce(new LLMError('HTTP 503', 'openai'))
      .mockRejectedValueOnce(new LLMError('HTTP 503', 'openai'))
      .mockResolvedValueOnce('success')

    const resultPromise = withRetry(fn, {
      maxRetries: 4,
      initialDelayMs: 5000,
      maxDelayMs: 100,
      backoffMultiplier: 2,
    })

    // Delays should be capped at 100ms (plus jitter)
    await vi.advanceTimersByTimeAsync(150)
    await vi.advanceTimersByTimeAsync(150)
    await vi.advanceTimersByTimeAsync(150)

    const result = await resultPromise
    expect(result).toBe('success')
  })
})
