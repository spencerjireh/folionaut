import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

// Content types for portfolio sections
export const contentTypeEnum = [
  'project',
  'experience',
  'education',
  'skill',
  'about',
  'contact',
] as const
export type ContentType = (typeof contentTypeEnum)[number]

// Content status
export const contentStatusEnum = ['draft', 'published', 'archived'] as const
export type ContentStatus = (typeof contentStatusEnum)[number]

// Change types for history
export const changeTypeEnum = ['created', 'updated', 'deleted', 'restored'] as const
export type ChangeType = (typeof changeTypeEnum)[number]

// Chat session status
export const sessionStatusEnum = ['active', 'ended', 'expired'] as const
export type SessionStatus = (typeof sessionStatusEnum)[number]

// Chat message role
export const messageRoleEnum = ['user', 'assistant', 'system'] as const
export type MessageRole = (typeof messageRoleEnum)[number]

// Content table
export const content = sqliteTable(
  'content',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    slug: text('slug').notNull(),
    data: text('data').notNull(), // JSON text
    status: text('status').notNull().default('draft'),
    version: integer('version').notNull().default(1),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    deletedAt: text('deleted_at'),
  },
  (table) => [
    index('content_type_idx').on(table.type),
    uniqueIndex('content_type_slug_idx').on(table.type, table.slug),
    index('content_deleted_at_idx').on(table.deletedAt),
  ]
)

// Content history table
export const contentHistory = sqliteTable(
  'content_history',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    data: text('data').notNull(), // JSON text snapshot
    changeType: text('change_type').notNull(),
    changedBy: text('changed_by'),
    changeSummary: text('change_summary'),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex('content_history_version_idx').on(table.contentId, table.version),
    index('content_history_content_id_idx').on(table.contentId),
    index('content_history_change_type_idx').on(table.changeType),
  ]
)

// Chat sessions table
export const chatSessions = sqliteTable(
  'chat_sessions',
  {
    id: text('id').primaryKey(),
    visitorId: text('visitor_id').notNull(),
    ipHash: text('ip_hash').notNull(),
    userAgent: text('user_agent'),
    messageCount: integer('message_count').notNull().default(0),
    status: text('status').notNull().default('active'),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    lastActiveAt: text('last_active_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    expiresAt: text('expires_at').notNull(),
  },
  (table) => [
    index('chat_sessions_visitor_id_idx').on(table.visitorId),
    index('chat_sessions_ip_hash_idx').on(table.ipHash),
    index('chat_sessions_expires_at_idx').on(table.expiresAt),
  ]
)

// Chat messages table
export const chatMessages = sqliteTable(
  'chat_messages',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    tokensUsed: integer('tokens_used'),
    model: text('model'),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [index('chat_messages_session_id_idx').on(table.sessionId)]
)
