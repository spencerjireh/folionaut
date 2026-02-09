import type { ToolResult } from '@/tools/types'

export function toolResultToMcpResponse(result: ToolResult) {
  if (!result.success) {
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ error: result.error }, null, 2) }],
      isError: true,
    }
  }
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }],
  }
}
