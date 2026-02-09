import { LLMError } from '@/errors/app.error'
import { eventEmitter } from '@/events'
import type { CircuitState } from '@/events/event-map'

export interface CircuitBreakerOptions {
  name: string
  failureThreshold?: number
  successThreshold?: number
  timeout?: number
}

const DEFAULT_FAILURE_THRESHOLD = 5
const DEFAULT_SUCCESS_THRESHOLD = 2
const DEFAULT_TIMEOUT = 30000 // 30 seconds

/**
 * Circuit breaker implementation for protecting external service calls.
 *
 * States:
 * - closed: Normal operation, requests pass through
 * - open: Requests fail immediately without calling the service
 * - half_open: One test request allowed to determine if service recovered
 */
export class CircuitBreaker {
  private readonly name: string
  private readonly failureThreshold: number
  private readonly successThreshold: number
  private readonly timeout: number

  private state: CircuitState = 'closed'
  private failureCount = 0
  private successCount = 0
  private lastFailureTime?: number

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name
    this.failureThreshold = options.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD
    this.successThreshold = options.successThreshold ?? DEFAULT_SUCCESS_THRESHOLD
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT
  }

  /**
   * Executes a function through the circuit breaker.
   * If the circuit is open, throws immediately.
   * If the circuit is closed or half-open, executes the function.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('half_open')
      } else {
        throw new LLMError('Circuit breaker is open', this.name)
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * Returns the current state of the circuit breaker.
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Returns the current failure count.
   */
  getFailureCount(): number {
    return this.failureCount
  }

  /**
   * Manually resets the circuit breaker to closed state.
   */
  reset(): void {
    this.transitionTo('closed')
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = undefined
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) {
      return true
    }
    return Date.now() - this.lastFailureTime >= this.timeout
  }

  private onSuccess(): void {
    if (this.state === 'half_open') {
      this.successCount++
      if (this.successCount >= this.successThreshold) {
        this.transitionTo('closed')
        this.failureCount = 0
        this.successCount = 0
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success in closed state
      this.failureCount = 0
    }
  }

  private onFailure(): void {
    this.lastFailureTime = Date.now()

    if (this.state === 'half_open') {
      // Single failure in half-open state trips back to open
      this.transitionTo('open')
      this.successCount = 0
    } else if (this.state === 'closed') {
      this.failureCount++
      if (this.failureCount >= this.failureThreshold) {
        this.transitionTo('open')
      }
    }
  }

  private transitionTo(newState: CircuitState): void {
    const previousState = this.state
    if (previousState === newState) {
      return
    }

    this.state = newState

    eventEmitter.emit('circuit:state_changed', {
      name: this.name,
      previousState,
      newState,
      failureCount: this.failureCount,
    })
  }
}
