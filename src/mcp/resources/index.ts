import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerContentResources } from './content'

export function registerResources(server: McpServer) {
  registerContentResources(server)
}
