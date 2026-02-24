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
      'Folionaut is built with TypeScript/Bun, Express, Turso/Drizzle ORM, Redis, and OpenTelemetry/Prometheus.',
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
    expectedBehavior: `Response should indicate employment started in ${groundTruths.experienceDuration}`,
    assertions: [{ type: 'regex', value: '2024|july|jul', flags: 'i' }],
    groundTruth: `${groundTruths.firstName} has been working at ${groundTruths.currentCompanyName} since July 2024.`,
  },
  {
    id: 'acc-004',
    category: 'accuracy',
    input: `What was ${groundTruths.firstName}'s previous role before becoming a ${groundTruths.currentRole}?`,
    expectedBehavior: 'Response should mention Java Intern role',
    assertions: [{ type: 'regex', value: 'java.*intern|intern', flags: 'i' }],
    groundTruth: `Before becoming a ${groundTruths.currentRole}, ${groundTruths.firstName} worked as a Java Intern at ${groundTruths.currentCompanyName} from February to July 2024.`,
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
      { type: 'regex', value: 'react|next|node|fastapi|spring|nest|express', flags: 'i' },
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
    groundTruth: `As an intern, ${groundTruths.firstName} worked with ${groundTruths.internTech.join(', ')} for backend development and DevOps.`,
  },
  {
    id: 'acc-008',
    category: 'accuracy',
    input: `Where did ${groundTruths.firstName} study?`,
    expectedBehavior: `Response should mention ${groundTruths.educationInstitution}`,
    assertions: [{ type: 'regex', value: assertionRegex.educationInstitution(), flags: 'i' }],
    groundTruth: groundTruths.education,
  },
  {
    id: 'acc-009',
    category: 'accuracy',
    input: 'What is the EECE Consultation Hub about?',
    expectedBehavior: 'Response should accurately describe the EECE Consultation Hub project',
    assertions: [
      { type: 'regex', value: 'consultation|scheduling|appointment|900', flags: 'i' },
      { type: 'notRegex', value: "don't have|no information|not available", flags: 'i' },
    ],
    groundTruth: PROFILE_DATA.projects.find((p) => p.slug === 'eece-consultation-hub')?.descriptions[0] ?? '',
  },
  {
    id: 'acc-010',
    category: 'accuracy',
    input: `What tech does ${groundTruths.firstName} use in his current role?`,
    expectedBehavior: 'Response should list tech from the current role entry',
    assertions: [
      { type: 'regex', value: assertionRegex.currentRoleSkill(), flags: 'i' },
      { type: 'notRegex', value: "don't have|no information|not available", flags: 'i' },
    ],
    groundTruth: `In his current role, ${groundTruths.firstName} uses ${groundTruths.currentRoleTech.join(', ')}.`,
  },
  {
    id: 'acc-011',
    category: 'accuracy',
    input: `Where can I find ${groundTruths.firstName} online?`,
    expectedBehavior: 'Response should include LinkedIn and/or GitHub links',
    assertions: [
      { type: 'regex', value: 'linkedin|github', flags: 'i' },
      { type: 'notRegex', value: "don't have|no information|not available", flags: 'i' },
    ],
    groundTruth: `${groundTruths.firstName} can be found on LinkedIn (${groundTruths.socialLinks.linkedin}) and GitHub (${groundTruths.socialLinks.github}).`,
  },
  {
    id: 'acc-012',
    category: 'accuracy',
    input: `What is ${groundTruths.firstName}'s education?`,
    expectedBehavior: `Response should mention ${groundTruths.educationDegree} at ${groundTruths.educationInstitution}`,
    assertions: [
      { type: 'regex', value: '2025|computer\\s*science|bs', flags: 'i' },
      { type: 'regex', value: assertionRegex.educationInstitution(), flags: 'i' },
    ],
    groundTruth: `${groundTruths.firstName} earned a ${groundTruths.educationDegree} from ${groundTruths.educationInstitution} (${groundTruths.educationYear}).`,
  },
  {
    id: 'acc-013',
    category: 'accuracy',
    input: 'Describe the Arxivian project',
    expectedBehavior: 'Response should accurately describe the Arxivian project',
    assertions: [
      { type: 'regex', value: 'arxiv|rag|langraph|langgraph|agent|paper', flags: 'i' },
      { type: 'notRegex', value: "don't have|no information|not available", flags: 'i' },
    ],
    groundTruth: PROFILE_DATA.projects.find((p) => p.slug === 'arxivian')?.descriptions[0] ?? '',
  },
]
