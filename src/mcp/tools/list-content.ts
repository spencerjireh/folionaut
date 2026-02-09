import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { listContent } from '@/tools/core'
import { ListContentInputSchema } from '../schemas'
import { toolResultToMcpResponse } from './mcp-response'

export function registerListContent(server: McpServer) {
  server.tool(
    'list_content',
    'List content items by type with optional status filter',
    ListContentInputSchema.shape,
    async (input) =>
      toolResultToMcpResponse(await listContent(input as Parameters<typeof listContent>[0]))
  )
}
