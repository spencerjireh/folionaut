import { contentRepository } from '@/repositories/content.repository'
import { DeleteContentInputSchema, type DeleteContentInput } from '@/validation/tool.schemas'
import type { ToolResult, DeleteContentResult } from '../types'

/**
 * Soft deletes content (can be restored later).
 * Core function used by MCP server.
 */
export async function deleteContent(
  input: DeleteContentInput
): Promise<ToolResult<DeleteContentResult>> {
  const params = DeleteContentInputSchema.parse(input)

  // Verify content exists before attempting delete
  const existing = await contentRepository.findById(params.id)
  if (!existing) {
    return {
      success: false,
      error: `Content not found: ${params.id}`,
    }
  }

  const success = await contentRepository.delete(params.id)

  if (!success) {
    return {
      success: false,
      error: 'Delete failed',
    }
  }

  return {
    success: true,
    data: {
      id: params.id,
      type: existing.type,
      slug: existing.slug,
    },
  }
}
