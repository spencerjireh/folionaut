import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { EvalRunResult, Category } from './types'

export interface ReportOptions {
  outputDir: string
  format: 'json' | 'console'
  timestamp?: string
}

export interface EvalReport {
  timestamp: string
  summary: {
    total: number
    passed: number
    failed: number
    passRate: number
    averageScore: number
  }
  byCategory: Record<
    Category,
    {
      total: number
      passed: number
      failed: number
      passRate: number
      score: number
    }
  >
  results: Array<{
    caseId: string
    category: Category
    input: string
    response: string
    scores: {
      programmatic: number | null
      llmJudge: number | null
      embedding: number | null
    }
    compositeScore: number
    passed: boolean
    llmReasoning?: string
    durationMs: number
    error?: string
    retryCount?: number
  }>
  metadata: {
    generatedAt: string
    totalDurationMs: number
    totalRetries: number
    errorsCount: number
  }
}

/**
 * Reporter class for generating evaluation reports in various formats.
 */
export class EvalReporter {
  /**
   * Generates a structured report from evaluation results.
   */
  generateReport(result: EvalRunResult, options: ReportOptions): EvalReport {
    const timestamp = options.timestamp ?? new Date().toISOString()

    // Calculate additional metrics
    const totalDurationMs = result.results.reduce((sum, r) => sum + r.durationMs, 0)
    const totalRetries = result.results.reduce((sum, r) => sum + (r.retryCount ?? 0), 0)
    const errorsCount = result.results.filter((r) => r.error).length

    // Transform byCategory to include more stats
    const byCategory = {} as EvalReport['byCategory']
    const categories: Category[] = [
      'relevance',
      'accuracy',
      'safety',
      'pii',
      'tone',
      'refusal',
      'edge',
    ]

    for (const category of categories) {
      const cat = result.byCategory[category]
      if (cat) {
        byCategory[category] = {
          total: cat.total,
          passed: cat.passed,
          failed: cat.total - cat.passed,
          passRate: cat.total > 0 ? cat.passed / cat.total : 0,
          score: cat.score,
        }
      } else {
        byCategory[category] = {
          total: 0,
          passed: 0,
          failed: 0,
          passRate: 0,
          score: 0,
        }
      }
    }

    return {
      timestamp,
      summary: {
        total: result.total,
        passed: result.passed,
        failed: result.failed,
        passRate: result.total > 0 ? result.passed / result.total : 0,
        averageScore: result.averageScore,
      },
      byCategory,
      results: result.results.map((r) => ({
        caseId: r.caseId,
        category: r.category,
        input: r.input,
        response: r.response,
        scores: r.scores,
        compositeScore: r.compositeScore,
        passed: r.passed,
        llmReasoning: r.llmReasoning,
        durationMs: r.durationMs,
        error: r.error,
        retryCount: r.retryCount,
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        totalDurationMs,
        totalRetries,
        errorsCount,
      },
    }
  }

  /**
   * Saves the report to a JSON file.
   */
  saveReport(report: EvalReport, options: ReportOptions): string {
    // Ensure output directory exists
    mkdirSync(options.outputDir, { recursive: true })

    // Generate filename with timestamp
    const dateStr = report.timestamp.replace(/[:.]/g, '-').slice(0, 19)
    const filename = `eval-report-${dateStr}.json`
    const filepath = join(options.outputDir, filename)

    // Write JSON report
    writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8')

    return filepath
  }

  /**
   * Generates and saves a report, returning the file path.
   */
  generateAndSave(result: EvalRunResult, options: ReportOptions): string {
    const report = this.generateReport(result, options)
    return this.saveReport(report, options)
  }
}

export const evalReporter = new EvalReporter()
