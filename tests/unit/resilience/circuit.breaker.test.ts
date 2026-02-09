import { LLMError } from '@/errors/app.error'

const { mockEmit } = vi.hoisted(() => ({
  mockEmit: vi.fn(),
}))

vi.mock('@/events', () => ({
  eventEmitter: {
    emit: mockEmit,
  },
}))

describe('CircuitBreaker', () => {
  let CircuitBreaker: typeof import('@/resilience/circuit.breaker').CircuitBreaker
  let breaker: InstanceType<typeof CircuitBreaker>

  beforeEach(async () => {
    // Import CircuitBreaker dynamically to apply mocks
    const module = await import('@/resilience/circuit.breaker')
    CircuitBreaker = module.CircuitBreaker

    breaker = new CircuitBreaker({
      name: 'test',
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
    })
    mockEmit.mockClear()
  })

  describe('initial state', () => {
    it('should start in closed state', () => {
      expect(breaker.getState()).toBe('closed')
    })

    it('should start with zero failures', () => {
      expect(breaker.getFailureCount()).toBe(0)
    })
  })

  describe('execute - closed state', () => {
    it('should execute function successfully', async () => {
      const result = await breaker.execute(async () => 'success')

      expect(result).toBe('success')
      expect(breaker.getState()).toBe('closed')
    })

    it('should track failures on error', async () => {
      await expect(
        breaker.execute(async () => {
          throw new Error('fail')
        })
      ).rejects.toThrow('fail')

      expect(breaker.getFailureCount()).toBe(1)
    })

    it('should reset failure count on success', async () => {
      // Fail twice
      await expect(breaker.execute(async () => { throw new Error('fail') })).rejects.toThrow()
      await expect(breaker.execute(async () => { throw new Error('fail') })).rejects.toThrow()
      expect(breaker.getFailureCount()).toBe(2)

      // Succeed
      await breaker.execute(async () => 'success')

      expect(breaker.getFailureCount()).toBe(0)
    })

    it('should open circuit after threshold failures', async () => {
      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(async () => { throw new Error('fail') })).rejects.toThrow()
      }

      expect(breaker.getState()).toBe('open')
      expect(mockEmit).toHaveBeenCalledWith('circuit:state_changed', {
        name: 'test',
        previousState: 'closed',
        newState: 'open',
        failureCount: 3,
      })
    })
  })

  describe('execute - open state', () => {
    beforeEach(async () => {
      // Trip the breaker
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(async () => { throw new Error('fail') })).rejects.toThrow()
      }
      mockEmit.mockClear()
    })

    it('should throw LLMError immediately without executing function', async () => {
      const fn = vi.fn()

      await expect(breaker.execute(fn as () => Promise<unknown>)).rejects.toBeInstanceOf(LLMError)
      expect(fn).not.toHaveBeenCalled()
    })

    it('should include circuit breaker name in error', async () => {
      try {
        await breaker.execute(async () => 'should not run')
        throw new Error('Should have thrown')
      } catch (error) {
        if ((error as Error).message === 'Should have thrown') throw error
        expect(error).toBeInstanceOf(LLMError)
        expect((error as LLMError).message).toBe('Circuit breaker is open')
        expect((error as LLMError).provider).toBe('test')
      }
    })

    it('should transition to half-open after timeout', async () => {
      // Fast-forward time
      vi.useFakeTimers()
      vi.advanceTimersByTime(1001)

      // Next call should transition to half-open
      const fn = vi.fn<() => Promise<string>>().mockResolvedValue('success')
      await breaker.execute(fn)

      expect(breaker.getState()).toBe('half_open')
      expect(fn).toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  describe('execute - half-open state', () => {
    beforeEach(async () => {
      // Trip the breaker
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(async () => { throw new Error('fail') })).rejects.toThrow()
      }

      // Wait for timeout and trigger half-open
      vi.useFakeTimers()
      vi.advanceTimersByTime(1001)
      await breaker.execute(async () => 'success')
      expect(breaker.getState()).toBe('half_open')
      mockEmit.mockClear()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return to closed after success threshold', async () => {
      // Need 2 successes (successThreshold)
      await breaker.execute(async () => 'success')

      expect(breaker.getState()).toBe('closed')
      expect(mockEmit).toHaveBeenCalledWith('circuit:state_changed', {
        name: 'test',
        previousState: 'half_open',
        newState: 'closed',
        failureCount: expect.any(Number),
      })
    })

    it('should return to open on single failure', async () => {
      await expect(breaker.execute(async () => { throw new Error('fail') })).rejects.toThrow()

      expect(breaker.getState()).toBe('open')
      expect(mockEmit).toHaveBeenCalledWith('circuit:state_changed', {
        name: 'test',
        previousState: 'half_open',
        newState: 'open',
        failureCount: expect.any(Number),
      })
    })
  })

  describe('reset', () => {
    it('should reset to closed state', async () => {
      // Trip the breaker
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(async () => { throw new Error('fail') })).rejects.toThrow()
      }
      expect(breaker.getState()).toBe('open')

      breaker.reset()

      expect(breaker.getState()).toBe('closed')
      expect(breaker.getFailureCount()).toBe(0)
    })

    it('should allow execution after reset', async () => {
      // Trip and reset
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(async () => { throw new Error('fail') })).rejects.toThrow()
      }
      breaker.reset()

      const result = await breaker.execute(async () => 'success')

      expect(result).toBe('success')
    })
  })

  describe('default options', () => {
    it('should use default values when not provided', async () => {
      const defaultBreaker = new CircuitBreaker({ name: 'default-test' })

      expect(defaultBreaker.getState()).toBe('closed')
      // We can't directly test default values, but we can verify it works
    })
  })

  describe('state transition events', () => {
    it('should emit event on closed to open transition', async () => {
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(async () => { throw new Error('fail') })).rejects.toThrow()
      }

      expect(mockEmit).toHaveBeenCalledWith('circuit:state_changed', {
        name: 'test',
        previousState: 'closed',
        newState: 'open',
        failureCount: 3,
      })
    })

    it('should not emit event when state does not change', async () => {
      // Single failure should not trigger state change
      await expect(breaker.execute(async () => { throw new Error('fail') })).rejects.toThrow()

      expect(mockEmit).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle async functions correctly', async () => {
      const result = await breaker.execute(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 'delayed result'
      })

      expect(result).toBe('delayed result')
    })

    it('should propagate different error types', async () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'CustomError'
        }
      }

      await expect(
        breaker.execute(async () => {
          throw new CustomError('custom error')
        })
      ).rejects.toThrow(CustomError)
    })

    it('should handle rapid successive calls', async () => {
      const results = await Promise.all([
        breaker.execute(async () => 1),
        breaker.execute(async () => 2),
        breaker.execute(async () => 3),
      ])

      expect(results).toEqual([1, 2, 3])
      expect(breaker.getState()).toBe('closed')
    })
  })
})
