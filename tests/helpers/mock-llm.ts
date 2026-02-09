import type { LLMProvider, LLMMessage, LLMOptions, LLMResponse } from '@/llm/types'

export interface MockLLMConfig {
  defaultResponse?: string
  defaultTokensUsed?: number
  defaultModel?: string
  shouldFail?: boolean
  failMessage?: string
  responseDelay?: number
}

/**
 * Mock LLM provider for testing.
 * Can be configured to return specific responses or simulate failures.
 */
export class MockLLMProvider implements LLMProvider {
  private config: MockLLMConfig
  private calls: Array<{ messages: LLMMessage[]; options?: LLMOptions }> = []

  constructor(config: MockLLMConfig = {}) {
    this.config = {
      defaultResponse: 'This is a mock response from the AI assistant.',
      defaultTokensUsed: 50,
      defaultModel: 'gpt-4o-mini',
      shouldFail: false,
      failMessage: 'Mock LLM failure',
      responseDelay: 0,
      ...config,
    }
  }

  async sendMessage(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    this.calls.push({ messages, options })

    if (this.config.responseDelay && this.config.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.config.responseDelay))
    }

    if (this.config.shouldFail) {
      throw new Error(this.config.failMessage)
    }

    return {
      content: this.config.defaultResponse!,
      tokensUsed: this.config.defaultTokensUsed!,
      model: options?.model ?? this.config.defaultModel!,
    }
  }

  /**
   * Returns all recorded calls to sendMessage.
   */
  getCalls(): Array<{ messages: LLMMessage[]; options?: LLMOptions }> {
    return this.calls
  }

  /**
   * Returns the last call to sendMessage.
   */
  getLastCall(): { messages: LLMMessage[]; options?: LLMOptions } | undefined {
    return this.calls[this.calls.length - 1]
  }

  /**
   * Returns the number of calls to sendMessage.
   */
  getCallCount(): number {
    return this.calls.length
  }

  /**
   * Clears the recorded calls.
   */
  clearCalls(): void {
    this.calls = []
  }

  /**
   * Updates the mock configuration.
   */
  setConfig(config: Partial<MockLLMConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Sets the mock to fail on next call.
   */
  setFailure(message?: string): void {
    this.config.shouldFail = true
    if (message) {
      this.config.failMessage = message
    }
  }

  /**
   * Sets the mock to succeed on next call.
   */
  setSuccess(response?: string): void {
    this.config.shouldFail = false
    if (response) {
      this.config.defaultResponse = response
    }
  }

  /**
   * Resets the mock to default configuration.
   */
  reset(): void {
    this.calls = []
    this.config = {
      defaultResponse: 'This is a mock response from the AI assistant.',
      defaultTokensUsed: 50,
      defaultModel: 'gpt-4o-mini',
      shouldFail: false,
      failMessage: 'Mock LLM failure',
      responseDelay: 0,
    }
  }
}

// Singleton instance for tests
let mockLLMInstance: MockLLMProvider | null = null

/**
 * Gets the shared mock LLM provider instance.
 */
export function getMockLLM(): MockLLMProvider {
  if (!mockLLMInstance) {
    mockLLMInstance = new MockLLMProvider()
  }
  return mockLLMInstance
}

/**
 * Resets the mock LLM provider instance.
 */
export function resetMockLLM(): void {
  if (mockLLMInstance) {
    mockLLMInstance.reset()
  }
}

/**
 * Creates a fresh mock LLM provider instance (not shared).
 */
export function createMockLLM(config?: MockLLMConfig): MockLLMProvider {
  return new MockLLMProvider(config)
}
