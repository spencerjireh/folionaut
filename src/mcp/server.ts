import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { registerTools } from './tools'
import { registerResources } from './resources'
import { registerPrompts } from './prompts'

async function main() {
  // Verify database connection
  await db.run(sql`SELECT 1`)

  const server = new McpServer({
    name: 'folionaut-mcp',
    version: '1.0.0',
  })

  registerTools(server)
  registerResources(server)
  registerPrompts(server)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  console.error('MCP Server error:', error)
  process.exit(1)
})
