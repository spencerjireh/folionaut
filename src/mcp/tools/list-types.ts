import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { listTypes } from '@/tools/core'
import { ListTypesInputSchema } from '../schemas'
import { toolResultToMcpResponse } from './mcp-response'

export function registerListTypes(server: McpServer) {
  server.tool(
    'list_types',
    'List all available content types and their item counts',
    ListTypesInputSchema.shape,
    async () => toolResultToMcpResponse(await listTypes())
  )
}
