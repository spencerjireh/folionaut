import { LLMError } from '@/errors/app.error'

export interface RetryOptions {
  /** Maximum number of retry attempts. Default: 3 */
  maxRetries?: number
  /** Initial delay between retries in ms. Default: 1000 */
  initialDelayMs?: number
  /** Maximum delay between retries in ms. Default: 10000 */
  maxDelayMs?: number
  /** Multiplier for exponential backoff. Default: 2 */
  backoffMultiplier?: number
}

function isNetworkError(message: string): boolean {
  return (
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('etimedout') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('fetch failed') ||
    message.includes('socket hang up')
  )
}

/**
 * Determines if an error is retryable.
 * Returns true for:
 * - 5xx server errors
 * - 429 rate limit errors
 * - Network/timeout errors
 * - Abort errors
 */
export function isRetryableError(error: Error): boolean {
  // Check for LLM errors with specific messages
  if (error instanceof LLMError) {
    const message = error.message.toLowerCase()

    // Server errors (5xx)
    if (
      message.includes('http 5') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    ) {
      return true
    }

    // Rate limit
    if (message.includes('429') || message.includes('rate limit')) {
      return true
    }

    // LLM-specific connection errors
    if (message.includes('connection')) {
      return true
    }

    if (isNetworkError(message)) {
      return true
    }
  }

  // Check for fetch-specific errors
  const errorName = error.name.toLowerCase()
  if (errorName === 'aborterror' || errorName === 'timeouterror') {
    return true
  }

  // Check for generic network errors
  if (isNetworkError(error.message.toLowerCase())) {
    return true
  }

  return false
}

/**
 * Calculates delay for next retry with exponential backoff and jitter.
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number
): number {
  // Exponential backoff
  const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt)

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs)

  // Add jitter (0-25% of delay)
  const jitter = cappedDelay * Math.random() * 0.25

  return Math.floor(cappedDelay + jitter)
}

/**
 * Sleeps for the specified duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wraps a function with retry logic using exponential backoff.
 *
 * @param fn - The async function to wrap
 * @param options - Retry configuration options
 * @returns The result of the function if successful
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3
  const initialDelayMs = options?.initialDelayMs ?? 1000
  const maxDelayMs = options?.maxDelayMs ?? 10000
  const backoffMultiplier = options?.backoffMultiplier ?? 2

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Don't retry non-retryable errors
      if (!isRetryableError(lastError)) {
        break
      }

      // Calculate and wait for delay
      const delay = calculateDelay(attempt, initialDelayMs, maxDelayMs, backoffMultiplier)
      await sleep(delay)
    }
  }

  throw lastError
}
