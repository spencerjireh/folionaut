import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerListContent } from './list-content'
import { registerGetContent } from './get-content'
import { registerSearchContent } from './search-content'
import { registerCreateContent } from './create-content'
import { registerUpdateContent } from './update-content'
import { registerDeleteContent } from './delete-content'

export function registerTools(server: McpServer) {
  // Read tools
  registerListContent(server)
  registerGetContent(server)
  registerSearchContent(server)
  // Write tools
  registerCreateContent(server)
  registerUpdateContent(server)
  registerDeleteContent(server)
}
