import { contentRepository } from '@/repositories/content.repository'
import { UpdateContentInputSchema, type UpdateContentInput } from '@/validation/tool.schemas'
import type { ToolResult, UpdateContentResult, ContentItem } from '../types'

/**
 * Updates existing content with version history tracking.
 * Core function used by MCP server.
 */
export async function updateContent(
  input: UpdateContentInput
): Promise<ToolResult<UpdateContentResult>> {
  const params = UpdateContentInputSchema.parse(input)

  // Verify content exists
  const existing = await contentRepository.findById(params.id)
  if (!existing) {
    return {
      success: false,
      error: `Content not found: ${params.id}`,
    }
  }

  // If slug is being changed, verify it doesn't conflict
  if (params.slug && params.slug !== existing.slug) {
    const exists = await contentRepository.slugExists(existing.type, params.slug, params.id)
    if (exists) {
      return {
        success: false,
        error: `Slug already exists: ${existing.type}/${params.slug}`,
      }
    }
  }

  const updated = await contentRepository.updateWithHistory(params.id, {
    slug: params.slug,
    data: params.data,
    status: params.status,
    sortOrder: params.sortOrder,
  })

  if (!updated) {
    return {
      success: false,
      error: 'Update failed',
    }
  }

  const item: ContentItem = {
    id: updated.id,
    slug: updated.slug,
    type: updated.type,
    data: updated.data as Record<string, unknown>,
    status: updated.status,
    version: updated.version,
    sortOrder: updated.sortOrder,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  }

  return {
    success: true,
    data: { item },
  }
}
