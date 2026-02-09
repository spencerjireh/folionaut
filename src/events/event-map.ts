import type { ContentType } from '@/db/models'

// Content Events
export interface ContentCreatedEvent {
  id: string
  type: ContentType
  slug: string
  version: number
  changedBy: string
}

export interface ContentUpdatedEvent {
  id: string
  type: ContentType
  version: number
  previousVersion: number
  changedFields: string[]
  changedBy: string
}

export interface ContentDeletedEvent {
  id: string
  type: ContentType
  hard: boolean
  changedBy: string
}

export interface ContentRestoredEvent {
  id: string
  type: ContentType
  fromVersion: number
  toVersion: number
  changedBy: string
}

// Chat Events
export interface ChatMessageSentEvent {
  sessionId: string
  messageId: string
  role: 'user' | 'assistant' | 'system'
  tokensUsed: number
}

export interface ChatSessionStartedEvent {
  sessionId: string
  visitorId: string
  ipHash: string
}

export interface ChatSessionEndedEvent {
  sessionId: string
  reason: 'timeout' | 'user_ended' | 'error'
  messageCount: number
  totalTokens: number
  durationMs: number
}

export interface ChatRateLimitedEvent {
  ipHash: string
  sessionId?: string
  retryAfter: number
}

// Circuit Breaker Events
export type CircuitState = 'closed' | 'open' | 'half_open'

export interface CircuitStateChangedEvent {
  name: string
  previousState: CircuitState
  newState: CircuitState
  failureCount: number
}

// Cache Events
export interface CacheInvalidatedEvent {
  pattern: string
  keysDeleted: number
  reason: string
}

// Admin Events
export interface AdminActionEvent {
  action: 'create' | 'update' | 'delete' | 'restore'
  resourceType: string
  resourceId: string
  changes?: Record<string, unknown>
  adminId: string
}

// Event Map
export interface EventMap {
  'content:created': ContentCreatedEvent
  'content:updated': ContentUpdatedEvent
  'content:deleted': ContentDeletedEvent
  'content:restored': ContentRestoredEvent
  'chat:message_sent': ChatMessageSentEvent
  'chat:session_started': ChatSessionStartedEvent
  'chat:session_ended': ChatSessionEndedEvent
  'chat:rate_limited': ChatRateLimitedEvent
  'circuit:state_changed': CircuitStateChangedEvent
  'cache:invalidated': CacheInvalidatedEvent
  'admin:action': AdminActionEvent
}

export type EventName = keyof EventMap
