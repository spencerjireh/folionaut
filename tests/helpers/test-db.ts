/**
 * Test database helper for integration tests.
 * Uses in-memory SQLite with Drizzle schema.
 */
import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'
import * as schema from '@/db/schema'

export interface TestDb {
  client: Client
  db: LibSQLDatabase<typeof schema>
}

/**
 * Creates an in-memory SQLite database for testing.
 */
export function createTestDb(): TestDb {
  const client = createClient({
    url: 'file::memory:?cache=shared',
  })

  const db = drizzle(client, { schema })

  return { client, db }
}

/**
 * Initializes the database schema (creates tables).
 */
export async function initializeSchema(db: LibSQLDatabase<typeof schema>): Promise<void> {
  // Create content table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      slug TEXT NOT NULL,
      data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      version INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )
  `)

  // Create content indices
  await db.run(sql`CREATE INDEX IF NOT EXISTS content_type_idx ON content(type)`)
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS content_type_slug_idx ON content(type, slug)`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS content_deleted_at_idx ON content(deleted_at)`)

  // Create content_history table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS content_history (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      data TEXT NOT NULL,
      change_type TEXT NOT NULL,
      changed_by TEXT,
      change_summary TEXT,
      created_at TEXT NOT NULL
    )
  `)

  // Create content_history indices
  // Note: We use a regular index instead of unique because multiple history entries can have the same version
  // (e.g., when 'updated' and 'deleted' both reference the same version)
  await db.run(sql`CREATE INDEX IF NOT EXISTS content_history_version_idx ON content_history(content_id, version)`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS content_history_content_id_idx ON content_history(content_id)`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS content_history_change_type_idx ON content_history(change_type)`)

  // Create chat_sessions table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      user_agent TEXT,
      message_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )
  `)

  // Create chat_sessions indices
  await db.run(sql`CREATE INDEX IF NOT EXISTS chat_sessions_visitor_id_idx ON chat_sessions(visitor_id)`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS chat_sessions_ip_hash_idx ON chat_sessions(ip_hash)`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS chat_sessions_expires_at_idx ON chat_sessions(expires_at)`)

  // Create chat_messages table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tokens_used INTEGER,
      model TEXT,
      created_at TEXT NOT NULL
    )
  `)

  // Create chat_messages indices
  await db.run(sql`CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id)`)
}

/**
 * Truncates all tables between tests.
 */
export async function cleanupTestDb(db: LibSQLDatabase<typeof schema>): Promise<void> {
  // Delete in order respecting foreign key constraints
  await db.run(sql`DELETE FROM chat_messages`)
  await db.run(sql`DELETE FROM chat_sessions`)
  await db.run(sql`DELETE FROM content_history`)
  await db.run(sql`DELETE FROM content`)
}

/**
 * Closes the database connection.
 */
export function closeTestDb(testDb: TestDb): void {
  testDb.client.close()
}
