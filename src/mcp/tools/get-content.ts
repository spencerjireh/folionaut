import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getContent } from '@/tools/core'
import { GetContentInputSchema } from '../schemas'
import { toolResultToMcpResponse } from './mcp-response'

export function registerGetContent(server: McpServer) {
  server.tool(
    'get_content',
    'Get a single content item by type and slug',
    GetContentInputSchema.shape,
    async (input) =>
      toolResultToMcpResponse(await getContent(input as Parameters<typeof getContent>[0]))
  )
}
