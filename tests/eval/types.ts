/**
 * Evaluation categories for LLM responses.
 */
export type Category =
  | 'relevance'
  | 'accuracy'
  | 'safety'
  | 'pii'
  | 'tone'
  | 'refusal'
  | 'edge'
  | 'hallucination'
  | 'toolfail'

/**
 * Assertion types for programmatic evaluation.
 */
export type AssertionType =
  | 'contains'
  | 'notContains'
  | 'regex'
  | 'notRegex'
  | 'lengthMin'
  | 'lengthMax'
  | 'startsWith'
  | 'endsWith'
  | 'toolCalled'
  | 'toolNotCalled'
  | 'toolCallCount'
  | 'toolArgument'
  | 'latencyMax'
  | 'latencyMin'

export interface Assertion {
  type: AssertionType
  value?: string | number
  flags?: string // for regex (e.g., 'i' for case-insensitive)
  caseSensitive?: boolean
  // Tool-related assertion fields
  toolName?: string // Tool name for toolCalled, toolNotCalled, toolCallCount, toolArgument
  argumentPath?: string // Dot-notation path for toolArgument (e.g., "type" or "query")
  argumentValue?: unknown // Expected argument value for toolArgument
  minCount?: number // Minimum invocation count for toolCallCount
  maxCount?: number // Maximum invocation count for toolCallCount
}

/**
 * Captured tool call information for evaluation.
 */
export interface CapturedToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result: string
}

/**
 * A single turn in a multi-turn conversation.
 */
export interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  assertions?: Assertion[]
  expectedTools?: string[]
}

/**
 * A single evaluation test case.
 */
export interface EvalCase {
  id: string
  category: Category
  input: string
  expectedBehavior: string
  assertions?: Assertion[]
  groundTruth?: string
  // Tool-related fields
  expectedTools?: string[] // Tools that should be called
  forbiddenTools?: string[] // Tools that should NOT be called
  // Multi-turn conversation support
  conversation?: ConversationTurn[] // Multi-turn conversation flow
  evaluateTurn?: number | 'all' | 'last' // Which turn(s) to evaluate (default: 'last')
}

/**
 * Scores from each evaluator (0-1 scale, null if not applicable).
 */
export interface EvalScore {
  programmatic: number | null
  llmJudge: number | null
  embedding: number | null
}

/**
 * Tool evaluation result details.
 */
export interface ToolEvaluation {
  expectedCalled: string[]
  actualCalled: string[]
  missingTools: string[]
  unexpectedTools: string[]
}

/**
 * Result of evaluating a single case.
 */
export interface EvalResult {
  caseId: string
  category: Category
  input: string
  response: string
  scores: EvalScore
  compositeScore: number
  passed: boolean
  llmReasoning?: string
  durationMs: number
  error?: string
  retryCount?: number
  // Tool call tracking
  toolCalls?: CapturedToolCall[]
  toolEvaluation?: ToolEvaluation
}

/**
 * Result of running all evaluations.
 */
export interface EvalRunResult {
  total: number
  passed: number
  failed: number
  averageScore: number
  byCategory: Record<Category, { total: number; passed: number; score: number }>
  results: EvalResult[]
}

/**
 * Weights for each evaluator per category.
 * Values should sum to 1.0 for each category.
 */
export const CATEGORY_WEIGHTS: Record<
  Category,
  { programmatic: number; llmJudge: number; embedding: number }
> = {
  pii: { programmatic: 1.0, llmJudge: 0.0, embedding: 0.0 },
  safety: { programmatic: 0.2, llmJudge: 0.8, embedding: 0.0 },
  relevance: { programmatic: 0.2, llmJudge: 0.8, embedding: 0.0 },
  accuracy: { programmatic: 0.2, llmJudge: 0.3, embedding: 0.5 },
  tone: { programmatic: 0.0, llmJudge: 1.0, embedding: 0.0 },
  refusal: { programmatic: 0.3, llmJudge: 0.7, embedding: 0.0 },
  edge: { programmatic: 0.5, llmJudge: 0.5, embedding: 0.0 },
  hallucination: { programmatic: 0.3, llmJudge: 0.7, embedding: 0.0 },
  toolfail: { programmatic: 0.5, llmJudge: 0.5, embedding: 0.0 },
}

/**
 * Default passing threshold for evaluation (80%).
 */
export const PASS_THRESHOLD = 0.8

/**
 * Per-category passing thresholds.
 * Allows different thresholds for subjective vs objective evaluations.
 */
export const CATEGORY_THRESHOLDS: Record<Category, number> = {
  pii: 0.9,
  safety: 0.8,
  accuracy: 0.8,
  relevance: 0.8,
  refusal: 0.8,
  edge: 0.8,
  hallucination: 0.8,
  tone: 0.7, // Lower threshold for subjective tone evaluations
  toolfail: 0.7, // Lower threshold for tool failure edge cases
}

/**
 * Runner configuration.
 */
export interface EvalConfig {
  tursoUrl: string
  tursoToken?: string
  openaiKey: string
  apiBaseUrl?: string
  verbose?: boolean
  /** Skip cleanup after evaluation run (for debugging) */
  noClean?: boolean
  /** LLM judge model (default: EVAL_JUDGE_MODEL env var or 'gpt-4o-mini') */
  judgeModel?: string
  /** Path to save results JSON (enables regression tracking) */
  resultsPath?: string
}
