import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createContent } from '@/tools/core'
import { CreateContentInputSchema } from '../schemas'
import { toolResultToMcpResponse } from './mcp-response'

export function registerCreateContent(server: McpServer) {
  server.tool(
    'create_content',
    'Create new content with type-specific data validation',
    CreateContentInputSchema.shape,
    async (input) =>
      toolResultToMcpResponse(await createContent(input as Parameters<typeof createContent>[0]))
  )
}
