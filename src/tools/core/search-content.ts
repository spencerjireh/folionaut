import { contentRepository } from '@/repositories/content.repository'
import { SearchContentInputSchema, type SearchContentInput } from '@/validation/tool.schemas'
import type { ToolResult, SearchContentResult, ContentItem } from '../types'

/**
 * Searches content by query across title, description, and name fields.
 * Core function used by both MCP server and OpenAI function calling.
 */
export async function searchContent(
  input: SearchContentInput
): Promise<ToolResult<SearchContentResult>> {
  const params = SearchContentInputSchema.parse(input)

  // Fetch published content (optionally filtered by type)
  const items = await contentRepository.findPublished(params.type)

  const query = params.query.toLowerCase()

  // Filter by query matching common fields in data JSON
  const filtered = items.filter((item) => {
    const data = item.data as Record<string, unknown>

    // Check common searchable fields
    const searchableFields = ['title', 'description', 'name', 'content', 'company', 'role']
    for (const field of searchableFields) {
      if (typeof data[field] === 'string' && data[field].toLowerCase().includes(query)) {
        return true
      }
    }

    // Check tags array if present
    if (Array.isArray(data.tags)) {
      if (
        data.tags.some(
          (tag: unknown) => typeof tag === 'string' && tag.toLowerCase().includes(query)
        )
      ) {
        return true
      }
    }

    // Check items array for list-type content (skills, experience, education)
    if (Array.isArray(data.items)) {
      for (const subItem of data.items) {
        if (typeof subItem === 'object' && subItem !== null) {
          for (const field of searchableFields) {
            if (typeof (subItem as Record<string, unknown>)[field] === 'string') {
              if (
                ((subItem as Record<string, unknown>)[field] as string)
                  .toLowerCase()
                  .includes(query)
              ) {
                return true
              }
            }
          }
        }
      }
    }

    return false
  })

  // Apply limit
  const limited = filtered.slice(0, params.limit)

  const results: ContentItem[] = limited.map((item) => ({
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
