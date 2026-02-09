import { contentRepository } from '@/repositories/content.repository'
import { GetContentInputSchema, type GetContentInput } from '@/validation/tool.schemas'
import type { ToolResult, GetContentResult, ContentItem } from '../types'

/**
 * Gets a single content item by type and slug.
 * Core function used by both MCP server and OpenAI function calling.
 */
export async function getContent(input: GetContentInput): Promise<ToolResult<GetContentResult>> {
  const params = GetContentInputSchema.parse(input)

  const item = await contentRepository.findBySlug(params.type, params.slug)

  if (!item) {
    return {
      success: false,
      error: `Content not found: ${params.type}/${params.slug}`,
    }
  }

  const result: ContentItem = {
    id: item.id,
    slug: item.slug,
    type: item.type,
    data: item.data as Record<string, unknown>,
    status: item.status,
    version: item.version,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }

  return {
    success: true,
    data: { item: result },
  }
}
