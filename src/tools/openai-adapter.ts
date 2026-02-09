import { zodToJsonSchema } from 'zod-to-json-schema'
import { ZodError } from 'zod'
import {
  ListContentInputSchema,
  GetContentInputSchema,
  SearchContentInputSchema,
} from '@/validation/tool.schemas'
import { listContent, getContent, searchContent } from './core'
import type { ToolResult } from './types'
import type { FunctionDefinition, ToolCall } from '@/llm/types'

/**
 * Tool definitions for OpenAI chat completions API.
 * These are read-only tools that allow the chat assistant to query portfolio data.
 */
export const chatToolDefinitions: FunctionDefinition[] = [
  {
    name: 'list_content',
    description:
      'List portfolio content items by type (project, experience, education, skill, about, contact). Use this to get all items of a specific type.',
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
      'Search portfolio content by query string. Searches across title, description, name, company, role, tags, and other fields. Use this when looking for content matching specific keywords.',
    parameters: zodToJsonSchema(SearchContentInputSchema, { $refStrategy: 'none' }),
  },
]

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

  return JSON.stringify(result)
}
