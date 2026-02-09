import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { updateContent } from '@/tools/core'
import { UpdateContentInputSchema } from '../schemas'
import { toolResultToMcpResponse } from './mcp-response'

export function registerUpdateContent(server: McpServer) {
  server.tool(
    'update_content',
    'Update existing content with version history tracking',
    UpdateContentInputSchema.shape,
    async (input) =>
      toolResultToMcpResponse(await updateContent(input as Parameters<typeof updateContent>[0]))
  )
}
