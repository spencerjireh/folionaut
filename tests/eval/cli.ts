import { parseArgs } from 'util'
import type { Category } from './types'
import { PASS_THRESHOLD } from './types'
import { EvalRunner } from './runner'
import { allCases, getCasesByCategory, getCategories } from './datasets'
import { evalReporter } from './reporter'

/**
 * CLI entry point for LLM evaluation pipeline.
 *
 * Usage:
 *   bun tests/eval/cli.ts                    # Run all evaluations
 *   bun tests/eval/cli.ts -c relevance       # Run only relevance tests
 *   bun tests/eval/cli.ts -c pii -v          # Run PII tests with verbose output
 *   bun tests/eval/cli.ts --no-clean         # Skip cleanup (for debugging)
 */
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      category: { type: 'string', short: 'c' },
      'no-clean': { type: 'boolean' },
      verbose: { type: 'boolean', short: 'v' },
      help: { type: 'boolean', short: 'h' },
      output: { type: 'string', short: 'o' },
      format: { type: 'string', short: 'f' },
    },
    strict: false,
  })

  if (values.help) {
    printHelp()
    process.exit(0)
  }

  // Validate environment
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN
  const openaiKey = process.env.LLM_API_KEY
  const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000'

  if (!tursoUrl) {
    console.error('Error: TURSO_DATABASE_URL not set')
    process.exit(1)
  }

  if (!openaiKey) {
    console.error('Error: LLM_API_KEY not set')
    process.exit(1)
  }

  // Get cases to run
  let cases = allCases
  if (values.category) {
    const category = values.category as Category
    const validCategories = getCategories()
    if (!validCategories.includes(category)) {
      console.error(`Error: Invalid category '${category}'`)
      console.error(`Valid categories: ${validCategories.join(', ')}`)
      process.exit(1)
    }
    cases = getCasesByCategory(category)
  }

  if (cases.length === 0) {
    console.error('No test cases found')
    process.exit(1)
  }

  // Create runner
  const runner = new EvalRunner({
    tursoUrl,
    tursoToken,
    openaiKey,
    apiBaseUrl,
    verbose: values.verbose === true,
    noClean: values['no-clean'] === true,
  })

  try {
    console.log('')
    console.log('=== LLM Evaluation Pipeline ===')
    console.log(`API Base: ${apiBaseUrl}`)
    console.log(`Cases: ${cases.length}`)
    if (values.category) {
      console.log(`Category: ${values.category}`)
    }
    console.log('')

    const result = await runner.runEval(cases)

    // Generate report if output directory specified
    const outputDir = values.output as string | undefined
    const format = (values.format as string) ?? 'console'

    if (outputDir) {
      const reportPath = evalReporter.generateAndSave(result, {
        outputDir,
        format: format as 'json' | 'console',
      })
      console.log('')
      console.log(`Report saved to: ${reportPath}`)
    }

    // Print results to console
    console.log('')
    console.log('=== Results ===')
    console.log('')
    console.log('Summary:')
    console.log(`  Total:    ${result.total}`)
    console.log(`  Passed:   ${result.passed}`)
    console.log(`  Failed:   ${result.failed}`)
    console.log(`  Score:    ${(result.averageScore * 100).toFixed(1)}%`)
    console.log('')
    console.log('By Category:')

    for (const category of getCategories()) {
      const cat = result.byCategory[category]
      if (cat && cat.total > 0) {
        console.log(
          `  ${category.padEnd(12)} ${cat.passed}/${cat.total} (${(cat.score * 100).toFixed(1)}%)`
        )
      }
    }

    // Print failures in verbose mode
    if (values.verbose && result.failed > 0) {
      console.log('')
      console.log('Failed Cases:')
      for (const r of result.results) {
        if (!r.passed) {
          console.log(`  ${r.caseId}: ${r.compositeScore.toFixed(2)}`)
          console.log(`    Input: ${r.input}`)
          console.log(`    Response: ${r.response.substring(0, 100)}...`)
          if (r.llmReasoning) {
            console.log(`    Reasoning: ${r.llmReasoning}`)
          }
          if (r.error) {
            console.log(`    Error: ${r.error}`)
          }
          if (r.retryCount) {
            console.log(`    Retries: ${r.retryCount}`)
          }
        }
      }
    }

    console.log('')

    // Exit code based on pass threshold
    const passRate = result.passed / result.total
    if (passRate >= PASS_THRESHOLD) {
      console.log(`PASS: ${(passRate * 100).toFixed(1)}% >= ${PASS_THRESHOLD * 100}% threshold`)
      process.exit(0)
    } else {
      console.log(`FAIL: ${(passRate * 100).toFixed(1)}% < ${PASS_THRESHOLD * 100}% threshold`)
      process.exit(1)
    }
  } catch (error) {
    console.error('Evaluation failed:', error)
    process.exit(1)
  } finally {
    runner.close()
  }
}

function printHelp(): void {
  console.log(`
LLM Evaluation Pipeline

Usage:
  bun tests/eval/cli.ts [options]

Options:
  -c, --category <name>  Run only specified category
  -v, --verbose          Show detailed output
  --no-clean             Skip cleanup (debugging)
  -o, --output <dir>     Output directory for JSON reports
  -f, --format <type>    Report format: json (default: json)
  -h, --help             Show this help

Categories:
  relevance   Response mentions relevant content
  accuracy    Response matches ground truth
  safety      Refuses harmful requests
  pii         Does not expose personal info
  tone        Professional and friendly
  refusal     Resists prompt injection
  edge        Edge case handling (empty, long, unicode, XSS)

Environment:
  TURSO_DATABASE_URL  Database URL (required)
  TURSO_AUTH_TOKEN    Database auth token
  LLM_API_KEY         OpenAI API key (required)
  API_BASE_URL        Chat API base (default: http://localhost:3000)

Examples:
  bun tests/eval/cli.ts
  bun tests/eval/cli.ts -c pii -v
  bun tests/eval/cli.ts --category safety
  bun tests/eval/cli.ts -o ./eval-reports
  bun tests/eval/cli.ts -c edge -v -o ./reports
`)
}

main().catch((error) => {
  console.error('CLI error:', error)
  process.exit(1)
})
