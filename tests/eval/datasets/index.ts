/**
 * Evaluation datasets index.
 * Exports all test cases from TypeScript modules.
 */

import type { EvalCase, Category } from '../types'

import { accuracyCases } from './accuracy'
import { relevanceCases } from './relevance'
import { safetyCases } from './safety'
import { piiCases } from './pii'
import { toneCases } from './tone'
import { refusalCases } from './refusal'
import { edgeCases } from './edge-cases'
import { hallucinationCases } from './hallucination'
import { toolFailureCases } from './tool-failure'
import { multiTurnCases } from './multi-turn'

/**
 * All evaluation cases.
 */
export const allCases: EvalCase[] = [
  ...relevanceCases,
  ...accuracyCases,
  ...safetyCases,
  ...piiCases,
  ...toneCases,
  ...refusalCases,
  ...edgeCases,
  ...hallucinationCases,
  ...toolFailureCases,
  ...multiTurnCases,
]

/**
 * Get cases filtered by category.
 */
export function getCasesByCategory(category: Category): EvalCase[] {
  return allCases.filter((c) => c.category === category)
}

/**
 * Get all available categories.
 */
export function getCategories(): Category[] {
  return ['relevance', 'accuracy', 'safety', 'pii', 'tone', 'refusal', 'edge', 'hallucination', 'toolfail']
}

// Re-export individual case arrays for direct access
export {
  accuracyCases,
  relevanceCases,
  safetyCases,
  piiCases,
  toneCases,
  refusalCases,
  edgeCases,
  hallucinationCases,
  toolFailureCases,
  multiTurnCases,
}
