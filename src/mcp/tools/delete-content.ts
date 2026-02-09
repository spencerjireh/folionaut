import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { deleteContent } from '@/tools/core'
import { DeleteContentInputSchema } from '../schemas'
import { toolResultToMcpResponse } from './mcp-response'

export function registerDeleteContent(server: McpServer) {
  server.tool(
    'delete_content',
    'Soft delete content (can be restored later)',
    DeleteContentInputSchema.shape,
    async (input) =>
      toolResultToMcpResponse(await deleteContent(input as Parameters<typeof deleteContent>[0]))
  )
}
