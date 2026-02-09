import { parseArgs } from 'util'
import type { SmokeRunnerOptions, SmokeSuiteResult } from './types'
import { printSuiteResults } from './utils'
import { testRedis } from './redis'
import { testTurso } from './turso'
import { testOpenAI } from './openai'

/**
 * CLI entry point for smoke tests.
 *
 * Usage:
 *   bun tests/smoke/index.ts          # Run all tests
 *   bun tests/smoke/index.ts --redis  # Run only Redis tests
 *   bun tests/smoke/index.ts --turso  # Run only Turso tests
 *   bun tests/smoke/index.ts --openai # Run only OpenAI tests
 *   bun tests/smoke/index.ts -v       # Verbose output
 */
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      redis: { type: 'boolean' },
      turso: { type: 'boolean' },
      openai: { type: 'boolean' },
      verbose: { type: 'boolean', short: 'v' },
    },
    strict: false,
  })

  const options: SmokeRunnerOptions = {
    redis: values.redis === true,
    turso: values.turso === true,
    openai: values.openai === true,
    verbose: values.verbose === true,
  }

  // If no specific flags, run all
  const runAll = !options.redis && !options.turso && !options.openai

  console.log('External Services Smoke Tests')
  console.log('=============================')

  const allResults: SmokeSuiteResult[] = []

  // Run Redis tests
  if (runAll || options.redis) {
    const result = await testRedis()
    printSuiteResults(result)
    allResults.push(result)
  }

  // Run Turso tests
  if (runAll || options.turso) {
    const result = await testTurso()
    printSuiteResults(result)
    allResults.push(result)
  }

  // Run OpenAI tests
  if (runAll || options.openai) {
    const result = await testOpenAI()
    printSuiteResults(result)
    allResults.push(result)
  }

  // Summary
  const totalPassed = allResults.reduce((sum, r) => sum + r.passed, 0)
  const totalFailed = allResults.reduce((sum, r) => sum + r.failed, 0)
  const total = totalPassed + totalFailed

  console.log('\n=============================')
  console.log(`Results: ${totalPassed}/${total} passed`)

  if (totalFailed > 0) {
    console.log(`\nFailed tests:`)
    for (const suite of allResults) {
      for (const result of suite.results) {
        if (!result.passed) {
          console.log(`  - ${suite.suite}: ${result.name}`)
        }
      }
    }
    process.exit(1)
  }

  process.exit(0)
}

main().catch((error) => {
  console.error('Smoke test runner failed:', error)
  process.exit(1)
})
