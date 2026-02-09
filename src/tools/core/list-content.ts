import { contentRepository } from '@/repositories/content.repository'
import { ListContentInputSchema, type ListContentInput } from '@/validation/tool.schemas'
import type { ToolResult, ListContentResult, ContentItem } from '../types'

/**
 * Lists content items by type with optional status filter.
 * Core function used by both MCP server and OpenAI function calling.
 */
export async function listContent(input: ListContentInput): Promise<ToolResult<ListContentResult>> {
  const params = ListContentInputSchema.parse(input)

  const items = await contentRepository.findAll({
    type: params.type,
    status: params.status,
    limit: params.limit,
  })

  const results: ContentItem[] = items.map((item) => ({
    id: item.id,
    slug: item.slug,
    type: item.type,
    data: item.data as Record<string, unknown>,
    status: item.status,
    version: item.version,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))

  return {
    success: true,
    data: { items: results },
  }
}
