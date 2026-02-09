import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '@/db/schema'
import { initializeSchema } from '../../../helpers/test-db'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface McpTestContext {
  client: Client
  cleanup: () => Promise<void>
}

/**
 * Creates a fresh MCP test client with its own file-based SQLite DB.
 * The MCP server is spawned as a child process via StdioClientTransport.
 */
export async function createMcpTestClient(): Promise<McpTestContext> {
  // Create a temp file for the SQLite DB
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-e2e-'))
  const dbPath = path.join(tmpDir, 'test.db')

  // Initialize schema on the file DB
  const libsqlClient = createClient({ url: `file:${dbPath}` })
  const db = drizzle(libsqlClient, { schema })
  await initializeSchema(db)
  libsqlClient.close()

  // Spawn MCP server pointing to the file DB
  const transport = new StdioClientTransport({
    command: 'bun',
    args: ['src/mcp/server.ts'],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      TURSO_DATABASE_URL: `file:${dbPath}`,
      TURSO_AUTH_TOKEN: 'test-token',
      ADMIN_API_KEY: 'test-admin-api-key-that-is-at-least-32-chars',
      LLM_PROVIDER: 'openai',
      LLM_API_KEY: 'test-key',
      OTEL_ENABLED: 'false',
    },
  })

  const client = new Client({ name: 'e2e-test-client', version: '1.0.0' })
  await client.connect(transport)

  const cleanup = async () => {
    await client.close()
    // Clean up temp directory
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  }

  return { client, cleanup }
}
