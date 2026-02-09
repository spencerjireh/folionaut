import { env } from '@/config/env'
import type { LLMProvider } from './types'
import { openaiProvider } from './openai.provider'

export type {
  LLMProvider,
  LLMMessage,
  LLMOptions,
  LLMResponse,
  MessageRole,
  ToolCall,
  FunctionDefinition,
} from './types'
export { OpenAIProvider, openaiProvider } from './openai.provider'

/**
 * Returns the configured LLM provider based on env.LLM_PROVIDER.
 */
export function getLLMProvider(): LLMProvider {
  switch (env.LLM_PROVIDER) {
    case 'openai':
      return openaiProvider
    default:
      return openaiProvider
  }
}
