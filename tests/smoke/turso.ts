import { createClient } from '@libsql/client'
import type { SmokeSuiteResult } from './types'
import { runTest, createSkippedResult } from './utils'

const TEST_SESSION_PREFIX = 'smoke_test_'

/**
 * Runs Turso/LibSQL smoke tests against a real database.
 */
export async function testTurso(): Promise<SmokeSuiteResult> {
  const url = process.env.TURSO_DATABASE_URL
  const token = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    return createSkippedResult('Turso', 'TURSO_DATABASE_URL not set')
  }

  const client = createClient({
    url,
    authToken: token,
  })

  const results = []
  const testSessionId = `${TEST_SESSION_PREFIX}${Date.now()}`

  try {
    // Test: Basic connection
    results.push(
      await runTest('Connection (SELECT 1)', async () => {
        const result = await client.execute('SELECT 1 as value')
        if (result.rows[0]?.value !== 1) {
          throw new Error('SELECT 1 failed')
        }
      })
    )

    // Test: Read from content table
    results.push(
      await runTest('Read content table', async () => {
        const result = await client.execute('SELECT id FROM content LIMIT 1')
        // Table exists (may or may not have rows)
        if (!Array.isArray(result.rows)) {
          throw new Error('Expected array result')
        }
      })
    )

    // Test: Write to chat_sessions
    results.push(
      await runTest('Write/verify/delete cycle', async () => {
        const now = new Date().toISOString()
        const expiresAt = new Date(Date.now() + 86400000).toISOString()

        // Insert test session
        await client.execute({
          sql: `INSERT INTO chat_sessions
                (id, visitor_id, ip_hash, user_agent, message_count, status, created_at, last_active_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            testSessionId,
            'smoke-visitor',
            'a'.repeat(16),
            'Smoke Test Agent',
            0,
            'active',
            now,
            now,
            expiresAt,
          ],
        })

        // Verify insert
        const verify = await client.execute({
          sql: 'SELECT id FROM chat_sessions WHERE id = ?',
          args: [testSessionId],
        })

        if (verify.rows.length !== 1) {
          throw new Error('Insert verification failed')
        }

        // Delete test data
        await client.execute({
          sql: 'DELETE FROM chat_sessions WHERE id = ?',
          args: [testSessionId],
        })

        // Verify delete
        const afterDelete = await client.execute({
          sql: 'SELECT id FROM chat_sessions WHERE id = ?',
          args: [testSessionId],
        })

        if (afterDelete.rows.length !== 0) {
          throw new Error('Delete verification failed')
        }
      })
    )

    // Test: Schema check
    results.push(
      await runTest('Schema tables exist', async () => {
        const result = await client.execute(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )

        const tables = result.rows.map((r) => r.name as string)
        const expectedTables = ['content', 'content_history', 'chat_sessions', 'chat_messages']

        for (const expected of expectedTables) {
          if (!tables.includes(expected)) {
            throw new Error(`Missing table: ${expected}`)
          }
        }
      })
    )
  } finally {
    // Final cleanup attempt
    try {
      await client.execute({
        sql: 'DELETE FROM chat_sessions WHERE id LIKE ?',
        args: [`${TEST_SESSION_PREFIX}%`],
      })
    } catch {
      // Ignore cleanup errors
    }
    client.close()
  }

  return {
    suite: 'Turso',
    results,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
  }
}
