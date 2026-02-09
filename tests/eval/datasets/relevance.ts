/**
 * Relevance evaluation test cases.
 * Tests that responses are relevant to the questions asked.
 */

import type { EvalCase } from '../types'
import { groundTruths, assertionRegex } from '@/seed'

export const relevanceCases: EvalCase[] = [
  {
    id: 'rel-001',
    category: 'relevance',
    input: `What projects has ${groundTruths.firstName} worked on?`,
    expectedBehavior: 'Response should mention portfolio projects and describe them accurately',
    assertions: [{ type: 'regex', value: assertionRegex.anyProject(), flags: 'i' }],
    groundTruth: `${groundTruths.firstName} worked on ${groundTruths.projectNames.join(', ')}.`,
  },
  {
    id: 'rel-002',
    category: 'relevance',
    input: `Tell me about ${groundTruths.firstName}'s experience`,
    expectedBehavior: 'Response should describe work experience with companies and roles',
    assertions: [{ type: 'contains', value: 'engineer' }],
    groundTruth: `${groundTruths.firstName} works as a ${groundTruths.currentRole} at ${groundTruths.currentCompanyName}.`,
  },
  {
    id: 'rel-003',
    category: 'relevance',
    input: `What does ${groundTruths.firstName} specialize in?`,
    expectedBehavior: 'Response should mention technical skills and specializations',
    assertions: [{ type: 'regex', value: 'typescript|python|ai|ml|full.?stack', flags: 'i' }],
    groundTruth: `${groundTruths.firstName} specializes in full-stack development and AI/ML systems.`,
  },
  {
    id: 'rel-004',
    category: 'relevance',
    input: `What programming languages does ${groundTruths.firstName} know?`,
    expectedBehavior: 'Response should list programming languages from skills data',
    assertions: [{ type: 'regex', value: assertionRegex.anyLanguage(), flags: 'i' }],
    groundTruth: `${groundTruths.firstName} is proficient in ${groundTruths.programmingLanguages.join(', ')}.`,
  },
  {
    id: 'rel-005',
    category: 'relevance',
    input: `What databases has ${groundTruths.firstName} worked with?`,
    expectedBehavior: 'Response should mention database technologies from skills',
    assertions: [
      // Should mention specific database names
      { type: 'regex', value: assertionRegex.anyDatabase(), flags: 'i' },
      // Should NOT say "no database" or "doesn't have"
      { type: 'notRegex', value: 'no.{0,20}database|does not have|doesn\'t have|not.{0,10}listed', flags: 'i' },
    ],
    groundTruth: `${groundTruths.firstName} has experience with ${groundTruths.databases.join(', ')} databases.`,
  },
  {
    id: 'rel-006',
    category: 'relevance',
    input: `Does ${groundTruths.firstName} have cloud experience?`,
    expectedBehavior: 'Response should mention cloud platforms and experience',
    assertions: [
      // Should mention AWS or specific cloud tech
      { type: 'regex', value: 'aws.{0,10}cdk|aws cdk|has.{0,30}cloud|experience.{0,20}(aws|cloud)', flags: 'i' },
      // Should NOT say "no cloud" or "doesn't have cloud"
      { type: 'notRegex', value: 'no.{0,20}cloud|does not have|doesn\'t have|not.{0,10}listed', flags: 'i' },
    ],
    groundTruth: `${groundTruths.firstName} has experience with AWS CDK and cloud infrastructure.`,
  },
  {
    id: 'rel-007',
    category: 'relevance',
    input: `What is ${groundTruths.firstName}'s educational background?`,
    expectedBehavior: 'Response should describe education accurately',
    assertions: [{ type: 'regex', value: assertionRegex.educationInstitution(), flags: 'i' }],
    groundTruth: groundTruths.education,
  },
  {
    id: 'rel-008',
    category: 'relevance',
    input: `Has ${groundTruths.firstName} contributed to any open source projects?`,
    expectedBehavior: 'Response should address open source work or mention GitHub portfolio',
    assertions: [
      // Should mention GitHub or specific projects
      { type: 'regex', value: 'github\\.com|has.{0,30}(project|github)|portfolio.{0,20}project', flags: 'i' },
      // Should NOT say "has not contributed" or "no open source"
      { type: 'notRegex', value: 'has not contributed|no open.?source|doesn\'t have|not.{0,10}contributed', flags: 'i' },
    ],
    groundTruth: `${groundTruths.firstName} has a GitHub portfolio with projects including ${groundTruths.projectNames.join(', ')}.`,
  },
]
