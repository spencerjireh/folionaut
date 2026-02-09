import { env } from '@/config/env'
import { LLMError } from '@/errors/app.error'
import { llmRequestsTotal, llmRequestDuration } from '@/observability'
import { withRetry } from './retry'
import type { LLMProvider, LLMMessage, LLMOptions, LLMResponse, ToolCall } from './types'


interface OpenAIToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  tool_calls?: OpenAIToolCall[]
  tool_call_id?: string
}

interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

interface OpenAIRequest {
  model: string
  messages: OpenAIMessage[]
  max_tokens: number
  temperature: number
  tools?: OpenAITool[]
  tool_choice?: 'auto' | 'none' | 'required'
}

interface OpenAIChoice {
  index: number
  message: {
    role: string
    content: string | null
    tool_calls?: OpenAIToolCall[]
  }
  finish_reason: string
}

interface OpenAIUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

interface OpenAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: OpenAIChoice[]
  usage: OpenAIUsage
}

interface OpenAIErrorResponse {
  error: {
    message: string
    type: string
    param?: string
    code?: string
  }
}

/**
 * OpenAI provider implementation using native fetch.
 */
export class OpenAIProvider implements LLMProvider {
  private readonly apiKey: string
  private readonly apiUrl: string
  private readonly defaultModel: string
  private readonly defaultMaxTokens: number
  private readonly defaultTemperature: number
  private readonly requestTimeoutMs: number
  private readonly maxRetries: number

  constructor() {
    this.apiKey = env.LLM_API_KEY
    this.apiUrl = env.LLM_BASE_URL
      ? `${env.LLM_BASE_URL}/chat/completions`
      : 'https://api.openai.com/v1/chat/completions'
    this.defaultModel = env.LLM_MODEL
    this.defaultMaxTokens = env.LLM_MAX_TOKENS
    this.defaultTemperature = env.LLM_TEMPERATURE
    this.requestTimeoutMs = env.LLM_REQUEST_TIMEOUT_MS
    this.maxRetries = env.LLM_MAX_RETRIES
  }

  /**
   * Convert LLMMessage to OpenAI message format.
   */
  private toOpenAIMessage(msg: LLMMessage): OpenAIMessage {
    const openAIMsg: OpenAIMessage = {
      role: msg.role,
      content: msg.content,
    }

    // Add tool_calls for assistant messages
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      openAIMsg.tool_calls = msg.tool_calls
    }

    // Add tool_call_id for tool messages
    if (msg.tool_call_id) {
      openAIMsg.tool_call_id = msg.tool_call_id
    }

    return openAIMsg
  }

  async sendMessage(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const model = options?.model ?? this.defaultModel
    const maxTokens = options?.maxTokens ?? this.defaultMaxTokens
    const temperature = options?.temperature ?? this.defaultTemperature
    const start = process.hrtime.bigint()

    const requestBody: OpenAIRequest = {
      model,
      messages: messages.map((msg) => this.toOpenAIMessage(msg)),
      max_tokens: maxTokens,
      temperature,
    }

    // Add tools if provided
    if (options?.tools && options.tools.length > 0) {
      requestBody.tools = options.tools.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }))
      requestBody.tool_choice = 'auto'
    }

    // Wrap the fetch call with retry logic
    const executeRequest = async (): Promise<LLMResponse> => {
      // Create abort controller for timeout
      const abortController = new AbortController()
      const timeoutId = setTimeout(() => abortController.abort(), this.requestTimeoutMs)

      let response: Response

      try {
        response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        })
      } catch (error) {
        clearTimeout(timeoutId)
        const err = error as Error

        // Handle abort/timeout errors
        if (err.name === 'AbortError') {
          throw new LLMError(`Request timeout after ${this.requestTimeoutMs}ms`, 'openai')
        }

        throw new LLMError(`Network error: ${err.message}`, 'openai')
      } finally {
        clearTimeout(timeoutId)
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`

        try {
          const errorBody = (await response.json()) as OpenAIErrorResponse
          if (errorBody.error?.message) {
            errorMessage = errorBody.error.message
          }
        } catch {
          // Use HTTP status as error message
        }

        throw new LLMError(errorMessage, 'openai')
      }

      const data = (await response.json()) as OpenAIResponse

      if (!data.choices || data.choices.length === 0) {
        throw new LLMError('No response from model', 'openai')
      }

      const choice = data.choices[0]
      const content = choice.message?.content ?? ''

      // Build response with optional tool_calls
      const llmResponse: LLMResponse = {
        content,
        tokensUsed: data.usage?.total_tokens ?? 0,
        model: data.model,
      }

      // Include tool_calls if present
      if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
        llmResponse.tool_calls = choice.message.tool_calls as ToolCall[]
      }

      return llmResponse
    }

    try {
      const result = await withRetry(executeRequest, {
        maxRetries: this.maxRetries,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      })

      const duration = Number(process.hrtime.bigint() - start) / 1e9
      llmRequestsTotal.inc({ model, status: 'success' })
      llmRequestDuration.observe({ model }, duration)

      return result
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - start) / 1e9
      llmRequestsTotal.inc({ model, status: 'error' })
      llmRequestDuration.observe({ model }, duration)
      throw error
    }
  }
}

export const openaiProvider = new OpenAIProvider()
