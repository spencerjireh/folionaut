import type { SmokeSuiteResult } from './types'
import { runTest, createSkippedResult } from './utils'

const API_URL = 'https://api.openai.com/v1'

interface OpenAIModelsResponse {
  data: Array<{ id: string }>
}

interface OpenAIChatResponse {
  choices: Array<{ message: { content: string } }>
  usage: { total_tokens: number }
}

interface OpenAIEmbeddingResponse {
  data: Array<{ embedding: number[] }>
}

/**
 * Runs OpenAI API smoke tests.
 */
export async function testOpenAI(): Promise<SmokeSuiteResult> {
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) {
    return createSkippedResult('OpenAI', 'LLM_API_KEY not set')
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  const results = []

  // Test: API key validation (list models)
  results.push(
    await runTest('API key validation', async () => {
      const response = await fetch(`${API_URL}/models`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      const data = (await response.json()) as OpenAIModelsResponse
      if (!Array.isArray(data.data)) {
        throw new Error('Invalid response format')
      }
    })
  )

  // Test: Chat completion
  results.push(
    await runTest('Chat completion', async () => {
      const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say "smoke test ok" and nothing else.' }],
          max_tokens: 20,
          temperature: 0,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      const data = (await response.json()) as OpenAIChatResponse
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('No content in response')
      }
    })
  )

  // Test: Embeddings
  results.push(
    await runTest('Embeddings', async () => {
      const response = await fetch(`${API_URL}/embeddings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: 'Test embedding input',
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      const data = (await response.json()) as OpenAIEmbeddingResponse
      if (!data.data?.[0]?.embedding?.length) {
        throw new Error('No embedding in response')
      }

      // Verify embedding dimensions
      const embeddingLength = data.data[0].embedding.length
      if (embeddingLength !== 1536) {
        throw new Error(`Unexpected embedding size: ${embeddingLength}`)
      }
    })
  )

  // Test: Model availability
  results.push(
    await runTest('Model gpt-4o-mini exists', async () => {
      const response = await fetch(`${API_URL}/models/gpt-4o-mini`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Model not accessible: HTTP ${response.status}`)
      }
    })
  )

  return {
    suite: 'OpenAI',
    results,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
  }
}
