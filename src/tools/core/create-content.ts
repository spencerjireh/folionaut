import { contentRepository } from '@/repositories/content.repository'
import { CreateContentInputSchema, type CreateContentInput } from '@/validation/tool.schemas'
import { validateContentData } from '@/validation/content.schemas'
import { ValidationError } from '@/errors/app.error'
import { slugify } from '@/lib/slugify'
import type { ContentType } from '@/db/schema'
import type { ToolResult, CreateContentResult, ContentItem } from '../types'

/**
 * Creates new content with type-specific data validation.
 * Core function used by MCP server.
 */
export async function createContent(
  input: CreateContentInput
): Promise<ToolResult<CreateContentResult>> {
  const params = CreateContentInputSchema.parse(input)

  // Validate data against type-specific schema
  let validationResult: Record<string, unknown>
  try {
    validationResult = validateContentData(params.type as ContentType, params.data)
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: `Validation failed: ${JSON.stringify(error.fields)}`,
      }
    }
    throw error
  }

  // Generate slug if not provided
  const text = String(params.data.title ?? params.data.name ?? '')
  const slug = params.slug || (text ? slugify(text) : '')
  if (!slug) {
    return {
      success: false,
      error: 'Slug is required (provide slug or include title/name in data)',
    }
  }

  // Check if slug already exists
  const exists = await contentRepository.slugExists(params.type as ContentType, slug)
  if (exists) {
    return {
      success: false,
      error: `Slug already exists: ${params.type}/${slug}`,
    }
  }

  const created = await contentRepository.create({
    type: params.type as ContentType,
    slug,
    data: validationResult,
    status: params.status,
    sortOrder: params.sortOrder,
  })

  const item: ContentItem = {
    id: created.id,
    slug: created.slug,
    type: created.type,
    data: created.data as Record<string, unknown>,
    status: created.status,
    version: created.version,
    sortOrder: created.sortOrder,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  }

  return {
    success: true,
    data: { item },
  }
}
