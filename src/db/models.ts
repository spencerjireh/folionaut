import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  content,
  contentHistory,
  chatSessions,
  chatMessages,
  ContentType,
  ContentStatus,
  ChangeType,
  SessionStatus,
  MessageRole,
} from './schema'

// Re-export enums
export type { ContentType, ContentStatus, ChangeType, SessionStatus, MessageRole }

// Inferred types from schema
export type Content = InferSelectModel<typeof content>
export type NewContent = InferInsertModel<typeof content>

export type ContentHistory = InferSelectModel<typeof contentHistory>
export type NewContentHistory = InferInsertModel<typeof contentHistory>

export type ChatSession = InferSelectModel<typeof chatSessions>
export type NewChatSession = InferInsertModel<typeof chatSessions>

export type ChatMessage = InferSelectModel<typeof chatMessages>
export type NewChatMessage = InferInsertModel<typeof chatMessages>

// DTOs for content operations
export interface CreateContentDto {
  type: ContentType
  slug: string
  data: Record<string, unknown>
  status?: ContentStatus
  sortOrder?: number
}

export interface UpdateContentDto {
  slug?: string
  data?: Record<string, unknown>
  status?: ContentStatus
  sortOrder?: number
}

// Content with parsed JSON data
export interface ContentWithData<T = Record<string, unknown>> extends Omit<Content, 'data'> {
  data: T
}

// Content bundle for grouped response
export interface ContentBundle {
  projects: ContentWithData[]
  experiences: ContentWithData[]
  education: ContentWithData[]
  skills: ContentWithData[]
  about: ContentWithData | null
  contact: ContentWithData | null
}

// DTOs for chat operations
export interface CreateChatSessionDto {
  visitorId: string
  ipHash: string
  userAgent?: string
}

export interface CreateChatMessageDto {
  role: MessageRole
  content: string
  tokensUsed?: number
  model?: string
}

// Chat statistics
export interface ChatStats {
  sessionId: string
  messageCount: number
  totalTokens: number
  durationMs: number
  startedAt: string
  lastActiveAt: string
}
