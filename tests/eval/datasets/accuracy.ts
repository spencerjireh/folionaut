/**
 * Accuracy evaluation test cases.
 * Tests that responses accurately reflect the profile data.
 */

import type { EvalCase } from '../types'
import { groundTruths, assertionRegex, PROFILE_DATA } from '@/seed'

export const accuracyCases: EvalCase[] = [
  {
    id: 'acc-001',
    category: 'accuracy',
    input: 'What technologies is Folionaut built with?',
    expectedBehavior: 'Response should accurately list technologies from the project data',
    assertions: [
      { type: 'contains', value: 'typescript' },
      { type: 'contains', value: 'express' },
      // Should NOT say "don't have information" or similar
      { type: 'notRegex', value: "don't have|no.{0,20}information|not available", flags: 'i' },
    ],
    groundTruth:
      'Folionaut is built with TypeScript, Express.js, Redis caching, and Turso/SQLite database.',
  },
  {
    id: 'acc-002',
    category: 'accuracy',
    input: `Where does ${groundTruths.firstName} currently work?`,
    expectedBehavior: 'Response should state current employer accurately',
    assertions: [{ type: 'regex', value: assertionRegex.currentCompany(), flags: 'i' }],
    groundTruth: groundTruths.currentEmployer,
  },
  {
    id: 'acc-003',
    category: 'accuracy',
    input: `When did ${groundTruths.firstName} start at ${groundTruths.currentCompanyName}?`,
    expectedBehavior: `Response should indicate employment started in ${groundTruths.experienceStartDate}`,
    assertions: [{ type: 'regex', value: '2024|september|sept', flags: 'i' }],
    groundTruth: `${groundTruths.firstName} has been working at ${groundTruths.currentCompanyName} since September 2024.`,
  },
  {
    id: 'acc-004',
    category: 'accuracy',
    input: `What was ${groundTruths.firstName}'s previous role before becoming a ${groundTruths.currentRole}?`,
    expectedBehavior: 'Response should mention Java Intern role',
    assertions: [{ type: 'regex', value: 'java.*intern|intern', flags: 'i' }],
    groundTruth: `Before becoming a ${groundTruths.currentRole}, ${groundTruths.firstName} worked as a Java Intern at ${groundTruths.currentCompanyName} from June to September 2024.`,
  },
  {
    id: 'acc-005',
    category: 'accuracy',
    input: `What programming languages does ${groundTruths.firstName} know?`,
    expectedBehavior: `Response should list programming languages: ${groundTruths.programmingLanguages.join(', ')}`,
    assertions: [{ type: 'regex', value: assertionRegex.anyLanguage(), flags: 'i' }],
    groundTruth: `${groundTruths.firstName} is proficient in ${groundTruths.programmingLanguages.join(', ')}.`,
  },
  {
    id: 'acc-006',
    category: 'accuracy',
    input: `What frameworks does ${groundTruths.firstName} use?`,
    expectedBehavior: 'Response should list frameworks from skills data',
    assertions: [
      { type: 'regex', value: 'react|next|node|fastapi|spring|nest', flags: 'i' },
    ],
    groundTruth: `${groundTruths.firstName} uses ${groundTruths.frameworks.join(', ')} frameworks.`,
  },
  {
    id: 'acc-007',
    category: 'accuracy',
    input: `What technologies did ${groundTruths.firstName} work with as an intern?`,
    expectedBehavior:
      'Response should mention Java, Spring Boot, Node.js, PostgreSQL from intern experience',
    assertions: [{ type: 'regex', value: 'java|spring|node|postgres', flags: 'i' }],
    groundTruth: `As an intern, ${groundTruths.firstName} worked with Java, Spring Boot, Node.js, and PostgreSQL for payment microservices.`,
  },
  {
    id: 'acc-008',
    category: 'accuracy',
    input: `Where did ${groundTruths.firstName} study?`,
    expectedBehavior: `Response should mention ${groundTruths.educationInstitution}`,
    assertions: [{ type: 'regex', value: assertionRegex.educationInstitution(), flags: 'i' }],
    groundTruth: groundTruths.education,
  },
]
