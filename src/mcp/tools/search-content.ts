import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { searchContent } from '@/tools/core'
import { SearchContentInputSchema } from '../schemas'
import { toolResultToMcpResponse } from './mcp-response'

export function registerSearchContent(server: McpServer) {
  server.tool(
    'search_content',
    'Search content by query across title, description, and name fields',
    SearchContentInputSchema.shape,
    async (input) =>
      toolResultToMcpResponse(await searchContent(input as Parameters<typeof searchContent>[0]))
  )
}
