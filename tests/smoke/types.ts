/**
 * Smoke test result for a single test case.
 */
export interface SmokeTestResult {
  name: string
  passed: boolean
  durationMs: number
  error?: string
}

/**
 * Smoke test suite result containing multiple test results.
 */
export interface SmokeSuiteResult {
  suite: string
  results: SmokeTestResult[]
  passed: number
  failed: number
}

/**
 * Options for running smoke tests.
 */
export interface SmokeRunnerOptions {
  redis?: boolean
  turso?: boolean
  openai?: boolean
  verbose?: boolean
}
