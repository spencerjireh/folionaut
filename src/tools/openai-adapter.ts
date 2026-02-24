import { zodToJsonSchema } from 'zod-to-json-schema'
import { ZodError } from 'zod'
import {
  ListContentInputSchema,
  GetContentInputSchema,
  SearchContentInputSchema,
  ListTypesInputSchema,
} from '@/validation/tool.schemas'
import { listContent, getContent, searchContent, listTypes } from './core'
import type { ToolResult, ContentItem } from './types'
import type { FunctionDefinition, ToolCall } from '@/llm/types'

const METADATA_KEYS = new Set<string>(['id', 'version', 'sortOrder', 'createdAt', 'updatedAt'])

function stripContentItemMetadata(item: ContentItem) {
  return Object.fromEntries(Object.entries(item).filter(([k]) => !METADATA_KEYS.has(k)))
}

function filterToolResult(result: ToolResult): ToolResult {
  if (!result.success || !result.data) return result

  const data = result.data as Record<string, unknown>

  if (Array.isArray(data.items)) {
    return {
      ...result,
      data: { ...data, items: (data.items as ContentItem[]).map(stripContentItemMetadata) },
    }
  }

  if (data.item && typeof data.item === 'object') {
    return {
      ...result,
      data: { ...data, item: stripContentItemMetadata(data.item as ContentItem) },
    }
  }

  return result
}

/**
 * Build tool definitions for OpenAI chat completions API.
 * When `availableTypes` is provided, the list_content description embeds them
 * so the LLM knows exactly which type strings to use.
 */
export function buildChatToolDefinitions(availableTypes?: string[]): FunctionDefinition[] {
  const typeHint = availableTypes?.length
    ? `Available types: ${availableTypes.join(', ')}.`
    : 'Use list_types to discover available types.'

  return [
    {
      name: 'list_content',
      description:
        `List portfolio content items by type. ${typeHint} Always call this before saying information is unavailable. Use this for broad questions, identity questions like "Who is Spencer?" with type "bio", or education questions with type "education".`,
      parameters: zodToJsonSchema(ListContentInputSchema, { $refStrategy: 'none' }),
    },
    {
      name: 'get_content',
      description:
        'Get a specific content item by type and slug. Use this when you need detailed information about a specific project, experience, or other content.',
      parameters: zodToJsonSchema(GetContentInputSchema, { $refStrategy: 'none' }),
    },
    {
      name: 'search_content',
      description:
        'Search portfolio content by query string. Searches across title, description, name, company, role, tags, and other fields. Use this when looking for content matching specific keywords. If the search returns no results, tell the visitor explicitly rather than guessing.',
      parameters: zodToJsonSchema(SearchContentInputSchema, { $refStrategy: 'none' }),
    },
    {
      name: 'list_types',
      description:
        'List all available content types and their item counts. Use this to discover what types of content exist in the portfolio.',
      parameters: zodToJsonSchema(ListTypesInputSchema, { $refStrategy: 'none' }),
    },
  ]
}

/**
 * Backward-compatible default export. Without types, tells the LLM to discover via list_types.
 */
export const chatToolDefinitions: FunctionDefinition[] = buildChatToolDefinitions()

/**
 * Execute a tool call and return the result as a JSON string.
 * @param toolCall - The tool call from OpenAI response
 * @returns JSON string result for the tool message
 */
export async function executeToolCall(toolCall: ToolCall): Promise<string> {
  const { name, arguments: argsString } = toolCall.function

  let args: unknown
  try {
    args = JSON.parse(argsString)
  } catch {
    return JSON.stringify({ success: false, error: 'Invalid JSON arguments' })
  }

  let result: ToolResult

  try {
    switch (name) {
      case 'list_content':
        result = await listContent(args as Parameters<typeof listContent>[0])
        break
      case 'get_content':
        result = await getContent(args as Parameters<typeof getContent>[0])
        break
      case 'search_content':
        result = await searchContent(args as Parameters<typeof searchContent>[0])
        break
      case 'list_types':
        result = await listTypes()
        break
      default:
        result = { success: false, error: `Unknown tool: ${name}` }
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
      result = { success: false, error: `Invalid tool arguments: ${issues}` }
    } else {
      const message = error instanceof Error ? error.message : 'Unknown error'
      result = { success: false, error: `Tool execution failed: ${message}` }
    }
  }

  return JSON.stringify(filterToolResult(result))
}
