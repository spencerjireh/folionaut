import type { ChatSession, ChatMessage, SessionStatus } from '@/db/models'

export type { ChatSession } from '@/db/models'

/**
 * Captured tool call information for evaluation and debugging.
 */
export interface CapturedToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result: string
}

export interface SendMessageInput {
  visitorId: string
  ipHash: string
  message: string
  userAgent?: string
  includeToolCalls?: boolean
}

export interface ChatMessageResponse {
  id: string
  role: 'assistant'
  content: string
  createdAt: string
}

export interface ChatResponse {
  sessionId: string
  message: ChatMessageResponse
  tokensUsed: number
  toolCalls?: CapturedToolCall[]
}

export interface SessionWithMessages extends ChatSession {
  messages: ChatMessage[]
}

export interface SessionListOptions {
  status?: SessionStatus
  limit?: number
  offset?: number
}
