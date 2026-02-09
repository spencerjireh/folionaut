import express from 'express'
import type { Server } from 'http'
import { MOCK_LLM_PORT } from './constants'

interface OpenAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string | null
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: { name: string; arguments: string }
      }>
    }
    finish_reason: string
  }>
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

const DEFAULT_RESPONSE: OpenAIResponse = {
  id: 'chatcmpl-e2e-default',
  object: 'chat.completion',
  created: Math.floor(Date.now() / 1000),
  model: 'gpt-4o-mini',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: 'This is a mock LLM response for E2E testing.',
      },
      finish_reason: 'stop',
    },
  ],
  usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
}

let responseQueue: OpenAIResponse[] = []
let server: Server | null = null

/**
 * Queue responses to be returned by the mock LLM server.
 * They are consumed in FIFO order; when the queue is empty the default response is used.
 */
export function setNextResponses(responses: OpenAIResponse[]): void {
  responseQueue.push(...responses)
}

/**
 * Convenience: build a simple text response.
 */
export function textResponse(content: string, id?: string): OpenAIResponse {
  return {
    id: id ?? `chatcmpl-e2e-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4o-mini',
    choices: [
      { index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  }
}

/**
 * Convenience: build a tool-call response.
 */
export function toolCallResponse(
  toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>
): OpenAIResponse {
  return {
    id: `chatcmpl-e2e-tool-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4o-mini',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: null,
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
          })),
        },
        finish_reason: 'tool_calls',
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  }
}

export function resetMockLLM(): void {
  responseQueue = []
}

export async function startMockLLMServer(): Promise<void> {
  if (server) return

  const app = express()
  app.use(express.json())

  app.post('/v1/chat/completions', (_req, res) => {
    const response = responseQueue.length > 0 ? responseQueue.shift()! : DEFAULT_RESPONSE
    res.json(response)
  })

  return new Promise<void>((resolve) => {
    server = app.listen(MOCK_LLM_PORT, () => {
      resolve()
    })
  })
}

export async function stopMockLLMServer(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (server) {
      server.close(() => {
        server = null
        resolve()
      })
    } else {
      resolve()
    }
  })
}
