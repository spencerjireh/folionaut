import { contentRepository } from '@/repositories/content.repository'
import type { ToolResult, ListTypesResult } from '../types'

/**
 * Lists all distinct content types with their item counts.
 * Core function used by both chat and MCP server.
 */
export async function listTypes(): Promise<ToolResult<ListTypesResult>> {
  const types = await contentRepository.getTypes()

  return {
    success: true,
    data: { types },
  }
}
