---
title: "ADR-003: LLM Abstraction"
description: Provider abstraction layer for LLM flexibility
---

# ADR 003: LLM Provider Abstraction

## Status

<Badge type="tip" text="Accepted" />

## Context

Folionaut uses LLM providers for:
- Chat responses (primary user interaction)
- Content summarization
- Potential future features (embeddings, classification)

Requirements:
- Support multiple LLM providers (Claude, OpenAI, Ollama)
- Easy provider switching without code changes
- Consistent error handling across providers
- Token usage tracking for cost monitoring
- PII detection and sanitization in responses

## Decision

Implement an **LLM Provider abstraction layer** with a unified interface that all providers implement.

```typescript
interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface LLMResponse {
  content: string
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  finishReason: 'stop' | 'length' | 'error'
  latencyMs: number
}

interface LLMProvider {
  readonly name: string
  readonly supportedModels: string[]

  chat(messages: LLMMessage[], options: ChatOptions): Promise<LLMResponse>
  stream(messages: LLMMessage[], options: ChatOptions): AsyncIterable<string>
  isAvailable(): Promise<boolean>
}

// Provider factory with fallback chain
class LLMProviderChain {
  constructor(private providers: LLMProvider[]) {}

  async chat(messages: LLMMessage[], options: ChatOptions): Promise<LLMResponse> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        try {
          return await provider.chat(messages, options)
        } catch (error) {
          if (this.isRetryable(error)) continue
          throw error
        }
      }
    }
    throw new LLMError('All providers unavailable')
  }
}
```

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Direct SDK usage** | Simple, full API access | Vendor lock-in, inconsistent interfaces |
| **LangChain** | Rich ecosystem, many integrations | Heavy dependency, abstraction overhead |
| **Vercel AI SDK** | Nice streaming, React integration | Vercel-focused, less control |
| **Custom abstraction** | Tailored to needs, lightweight | Development effort, maintenance |
| **LiteLLM** | Many providers, drop-in | Python-focused, less TS support |

## Consequences

### Positive

- **Provider flexibility**: Switch providers via configuration
- **Fallback resilience**: Automatic failover if primary provider fails
- **Consistent metrics**: Unified token tracking and latency measurement
- **PII protection**: Output guardrails sanitize responses before returning to users
- **Testing**: Easy to mock LLM calls in tests
- **Cost control**: Token tracking enables budget alerts

### Negative

- **Lowest common denominator**: Can't use provider-specific features easily
- **Maintenance burden**: Must update abstraction for new provider features
- **Abstraction leak**: Some provider behaviors hard to hide

### Mitigations

- **Provider-specific options**: Allow pass-through of provider-specific config
- **Feature detection**: Check provider capabilities before using advanced features
- **Minimal abstraction**: Only abstract what's actually needed

## References

- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [OpenAI SDK](https://github.com/openai/openai-node)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
