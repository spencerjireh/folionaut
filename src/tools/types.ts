/**
 * Shared tool types for both MCP server and OpenAI function calling.
 */

export interface ToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface ContentItem {
  id: string
  slug: string
  type: string
  data: Record<string, unknown>
  status: string
  version: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ListContentResult {
  items: ContentItem[]
}

export interface GetContentResult {
  item: ContentItem
}

export interface SearchContentResult {
  items: ContentItem[]
}

export interface CreateContentResult {
  item: ContentItem
}

export interface UpdateContentResult {
  item: ContentItem
}

export interface DeleteContentResult {
  id: string
  type: string
  slug: string
}
