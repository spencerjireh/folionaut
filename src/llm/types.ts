export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

/**
 * OpenAI function calling tool call format.
 */
export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

/**
 * Function definition for OpenAI tools.
 */
export interface FunctionDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface LLMMessage {
  role: MessageRole
  content: string | null
  /** Tool calls made by the assistant (only for assistant messages) */
  tool_calls?: ToolCall[]
  /** Tool call ID this message responds to (only for tool messages) */
  tool_call_id?: string
}

export interface LLMOptions {
  maxTokens?: number
  temperature?: number
  model?: string
  /** Tool definitions for function calling */
  tools?: FunctionDefinition[]
}

export interface LLMResponse {
  content: string
  tokensUsed: number
  model: string
  /** Tool calls requested by the model */
  tool_calls?: ToolCall[]
}

export interface LLMProvider {
  sendMessage(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>
}
