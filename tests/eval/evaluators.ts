import { createHash } from 'node:crypto'
import type { Assertion, Category, EvalScore, CapturedToolCall } from './types'
import { CATEGORY_WEIGHTS } from './types'

const OPENAI_API_URL = 'https://api.openai.com/v1'

// In-memory cache for embeddings to avoid redundant API calls
const EMBEDDING_CACHE = new Map<string, number[]>()

/**
 * Evaluates response using programmatic assertions.
 * Returns score from 0-1 based on passing assertions.
 */
export function evaluateProgrammatic(response: string, assertions: Assertion[]): number {
  if (!assertions || assertions.length === 0) {
    return 1.0 // No assertions = full score
  }

  let passed = 0
  const normalizedResponse = response.toLowerCase()

  for (const assertion of assertions) {
    const { type, value, flags, caseSensitive } = assertion

    // Handle string-based assertions
    if (type === 'contains' || type === 'notContains' || type === 'startsWith' || type === 'endsWith') {
      const strValue = typeof value === 'string' ? value : String(value ?? '')
      const normalizedValue = caseSensitive ? strValue : strValue.toLowerCase()
      const searchIn = caseSensitive ? response : normalizedResponse

      if (type === 'contains') {
        if (searchIn.includes(normalizedValue)) passed++
      } else if (type === 'notContains') {
        if (!searchIn.includes(normalizedValue)) passed++
      } else if (type === 'startsWith') {
        if (searchIn.startsWith(normalizedValue)) passed++
      } else if (type === 'endsWith') {
        if (searchIn.endsWith(normalizedValue)) passed++
      }
    }
    // Handle regex assertions
    else if (type === 'regex' || type === 'notRegex') {
      const pattern = typeof value === 'string' ? value : String(value ?? '')
      const regex = new RegExp(pattern, flags ?? '')
      const matches = regex.test(response)

      if (type === 'regex') {
        if (matches) passed++
      } else if (type === 'notRegex') {
        if (!matches) passed++
      }
    }
    // Handle length assertions
    else if (type === 'lengthMin' || type === 'lengthMax') {
      const numValue = typeof value === 'number' ? value : parseInt(String(value ?? '0'), 10)

      if (type === 'lengthMin') {
        if (response.length >= numValue) passed++
      } else if (type === 'lengthMax') {
        if (response.length <= numValue) passed++
      }
    }
  }

  return passed / assertions.length
}

/**
 * LLM-as-judge evaluation result.
 */
export interface LLMJudgeResult {
  score: number // 0-1 (normalized from 1-5)
  reasoning: string
}

/**
 * Evaluates response using LLM-as-judge approach.
 * Returns normalized score (0-1) and reasoning.
 */
export async function evaluateLlmJudge(
  apiKey: string,
  input: string,
  response: string,
  expectedBehavior: string,
  model = process.env.EVAL_JUDGE_MODEL ?? 'gpt-4o-mini'
): Promise<LLMJudgeResult> {
  const systemPrompt = `You are an expert evaluator assessing AI assistant responses.
Rate the response on a scale of 1-5 based on how well it meets the expected behavior.

Scoring guide:
5 - Excellent: Fully meets expected behavior, accurate, helpful, appropriate
4 - Good: Mostly meets expectations with minor issues
3 - Acceptable: Partially meets expectations, some notable gaps
2 - Poor: Significant issues, mostly fails expectations
1 - Fail: Completely fails to meet expected behavior

Respond in this exact JSON format:
{"score": <1-5>, "reasoning": "<brief explanation>"}`

  const userPrompt = `User Query: ${input}

Expected Behavior: ${expectedBehavior}

Assistant Response: ${response}

Evaluate the response.`

  const res = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 200,
      temperature: 0,
    }),
  })

  if (!res.ok) {
    throw new Error(`LLM Judge API error: ${res.status}`)
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>
  }

  const content = data.choices[0]?.message?.content ?? ''

  try {
    // Parse JSON response
    const parsed = JSON.parse(content) as { score: number; reasoning: string }
    const rawScore = Math.max(1, Math.min(5, parsed.score))
    // Normalize 1-5 to 0-1
    const normalizedScore = (rawScore - 1) / 4
    return { score: normalizedScore, reasoning: parsed.reasoning }
  } catch {
    // Fallback: try to extract score from text
    const match = content.match(/score[:\s]*(\d)/i)
    const score = match ? parseInt(match[1], 10) : 3
    return { score: (score - 1) / 4, reasoning: 'Failed to parse structured response' }
  }
}

/**
 * Computes cosine similarity between two embedding vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Gets embeddings from OpenAI API.
 */
async function getEmbedding(apiKey: string, text: string): Promise<number[]> {
  const res = await fetch(`${OPENAI_API_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  if (!res.ok) {
    throw new Error(`Embedding API error: ${res.status}`)
  }

  const data = (await res.json()) as {
    data: Array<{ embedding: number[] }>
  }

  return data.data[0].embedding
}

/**
 * Gets embeddings with caching to avoid redundant API calls.
 * Uses SHA-256 hash of text as cache key.
 */
async function getCachedEmbedding(apiKey: string, text: string): Promise<number[]> {
  const cacheKey = createHash('sha256').update(text).digest('hex')

  const cached = EMBEDDING_CACHE.get(cacheKey)
  if (cached) {
    return cached
  }

  const embedding = await getEmbedding(apiKey, text)
  EMBEDDING_CACHE.set(cacheKey, embedding)
  return embedding
}

/**
 * Evaluates response using embedding similarity to ground truth.
 * Returns cosine similarity (0-1).
 */
export async function evaluateEmbedding(
  apiKey: string,
  response: string,
  groundTruth: string
): Promise<number> {
  const [responseEmb, truthEmb] = await Promise.all([
    getCachedEmbedding(apiKey, response),
    getCachedEmbedding(apiKey, groundTruth),
  ])

  const similarity = cosineSimilarity(responseEmb, truthEmb)
  // Clamp to 0-1 range (similarity can be negative for very different texts)
  return Math.max(0, similarity)
}

/**
 * Computes weighted composite score based on category weights.
 */
export function computeComposite(scores: EvalScore, category: Category): number {
  const weights = CATEGORY_WEIGHTS[category]

  let weightedSum = 0
  let totalWeight = 0

  if (scores.programmatic !== null && weights.programmatic > 0) {
    weightedSum += scores.programmatic * weights.programmatic
    totalWeight += weights.programmatic
  }

  if (scores.llmJudge !== null && weights.llmJudge > 0) {
    weightedSum += scores.llmJudge * weights.llmJudge
    totalWeight += weights.llmJudge
  }

  if (scores.embedding !== null && weights.embedding > 0) {
    weightedSum += scores.embedding * weights.embedding
    totalWeight += weights.embedding
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

/**
 * Gets a nested value from an object using dot notation.
 * E.g., getNestedValue({ a: { b: 1 } }, 'a.b') returns 1
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

/**
 * Tool call evaluation result.
 */
export interface ToolCallEvalResult {
  score: number
  missingTools: string[]
  unexpectedTools: string[]
  failedAssertions: string[]
}

/**
 * Evaluates tool calls against assertions and expected/forbidden tools.
 */
export function evaluateToolCalls(
  toolCalls: CapturedToolCall[],
  assertions: Assertion[],
  expectedTools?: string[],
  forbiddenTools?: string[]
): ToolCallEvalResult {
  const failedAssertions: string[] = []
  const actualToolNames = toolCalls.map((tc) => tc.name)
  const actualToolSet = new Set(actualToolNames)

  // Count tools called
  const toolCallCounts: Record<string, number> = {}
  for (const name of actualToolNames) {
    toolCallCounts[name] = (toolCallCounts[name] ?? 0) + 1
  }

  // Check expected tools
  const missingTools: string[] = []
  if (expectedTools) {
    for (const tool of expectedTools) {
      if (!actualToolSet.has(tool)) {
        missingTools.push(tool)
      }
    }
  }

  // Check forbidden tools
  const unexpectedTools: string[] = []
  if (forbiddenTools) {
    for (const tool of forbiddenTools) {
      if (actualToolSet.has(tool)) {
        unexpectedTools.push(tool)
      }
    }
  }

  // Evaluate tool-related assertions
  const toolAssertions = assertions.filter((a) =>
    ['toolCalled', 'toolNotCalled', 'toolCallCount', 'toolArgument'].includes(a.type)
  )

  for (const assertion of toolAssertions) {
    const { type, toolName, argumentPath, argumentValue, minCount, maxCount, caseSensitive } =
      assertion

    if (type === 'toolCalled') {
      if (toolName && !actualToolSet.has(toolName)) {
        failedAssertions.push(`Expected tool '${toolName}' to be called`)
      }
    } else if (type === 'toolNotCalled') {
      if (toolName && actualToolSet.has(toolName)) {
        failedAssertions.push(`Expected tool '${toolName}' to NOT be called`)
      }
    } else if (type === 'toolCallCount') {
      if (toolName) {
        const count = toolCallCounts[toolName] ?? 0
        if (minCount !== undefined && count < minCount) {
          failedAssertions.push(`Tool '${toolName}' called ${count} times, expected at least ${minCount}`)
        }
        if (maxCount !== undefined && count > maxCount) {
          failedAssertions.push(`Tool '${toolName}' called ${count} times, expected at most ${maxCount}`)
        }
      }
    } else if (type === 'toolArgument') {
      if (toolName && argumentPath !== undefined) {
        // Find tool calls matching the tool name
        const matchingCalls = toolCalls.filter((tc) => tc.name === toolName)
        if (matchingCalls.length === 0) {
          failedAssertions.push(`Tool '${toolName}' was not called, cannot check argument '${argumentPath}'`)
        } else {
          // Check if any call has the expected argument value
          const hasMatchingArg = matchingCalls.some((tc) => {
            const actualValue = getNestedValue(tc.arguments, argumentPath)

            // Case-insensitive string comparison when caseSensitive !== true
            if (
              caseSensitive !== true &&
              typeof actualValue === 'string' &&
              typeof argumentValue === 'string'
            ) {
              return actualValue.toLowerCase() === argumentValue.toLowerCase()
            }

            // Default: exact JSON comparison
            return JSON.stringify(actualValue) === JSON.stringify(argumentValue)
          })
          if (!hasMatchingArg) {
            failedAssertions.push(
              `Tool '${toolName}' argument '${argumentPath}' did not match expected value '${JSON.stringify(argumentValue)}'`
            )
          }
        }
      }
    }
  }

  // Calculate score
  const totalChecks =
    toolAssertions.length + (expectedTools?.length ?? 0) + (forbiddenTools?.length ?? 0)

  if (totalChecks === 0) {
    return { score: 1.0, missingTools, unexpectedTools, failedAssertions }
  }

  const failedCount = failedAssertions.length + missingTools.length + unexpectedTools.length
  const score = Math.max(0, (totalChecks - failedCount) / totalChecks)

  return { score, missingTools, unexpectedTools, failedAssertions }
}
