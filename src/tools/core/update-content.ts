import { contentRepository } from '@/repositories/content.repository'
import { UpdateContentInputSchema, type UpdateContentInput } from '@/validation/tool.schemas'
import { validateContentData } from '@/validation/content.schemas'
import { ValidationError } from '@/errors/app.error'
import type { ContentType } from '@/db/schema'
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

  // If data is provided, validate against type-specific schema
  let validatedData: Record<string, unknown> | undefined
  if (params.data) {
    try {
      validatedData = validateContentData(existing.type as ContentType, params.data)
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: `Validation failed: ${JSON.stringify(error.fields)}`,
        }
      }
      throw error
    }
  }

  // If slug is being changed, verify it doesn't conflict
  if (params.slug && params.slug !== existing.slug) {
    const exists = await contentRepository.slugExists(
      existing.type as ContentType,
      params.slug,
      params.id
    )
    if (exists) {
      return {
        success: false,
        error: `Slug already exists: ${existing.type}/${params.slug}`,
      }
    }
  }

  const updated = await contentRepository.updateWithHistory(params.id, {
    slug: params.slug,
    data: validatedData,
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
