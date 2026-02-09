import type { SmokeTestResult, SmokeSuiteResult } from './types'

/**
 * Wraps a test function with timing and error handling.
 */
export async function runTest(
  name: string,
  fn: () => Promise<void>
): Promise<SmokeTestResult> {
  const start = performance.now()

  try {
    await fn()
    const durationMs = Math.round(performance.now() - start)
    return { name, passed: true, durationMs }
  } catch (error) {
    const durationMs = Math.round(performance.now() - start)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { name, passed: false, durationMs, error: errorMessage }
  }
}

/**
 * Formats a test result for console output.
 */
export function formatResult(result: SmokeTestResult): string {
  if (result.passed) {
    return `  [PASS] ${result.name} (${result.durationMs}ms)`
  }
  return `  [FAIL] ${result.name}: ${result.error}`
}

/**
 * Prints a suite header to console.
 */
export function printHeader(name: string): void {
  console.log(`\n${name}`)
  console.log('-'.repeat(name.length))
}

/**
 * Prints suite results and returns summary.
 */
export function printSuiteResults(suiteResult: SmokeSuiteResult): void {
  printHeader(suiteResult.suite)
  for (const result of suiteResult.results) {
    console.log(formatResult(result))
  }
}

/**
 * Creates a skipped suite result when env vars are missing.
 */
export function createSkippedResult(suite: string, reason: string): SmokeSuiteResult {
  return {
    suite,
    results: [{ name: `skip: ${reason}`, passed: true, durationMs: 0 }],
    passed: 1,
    failed: 0,
  }
}
