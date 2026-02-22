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
      { type: 'regex', value: 'github|project|built|developed|worked on|portfolio', flags: 'i' },
      // Should NOT say "has not contributed" or "no open source"
      { type: 'notRegex', value: 'has not contributed|no open.?source|not.{0,10}contributed', flags: 'i' },
    ],
    groundTruth: `${groundTruths.firstName} has a GitHub portfolio with projects including ${groundTruths.projectNames.join(', ')}.`,
  },
  {
    id: 'rel-009',
    category: 'relevance',
    input: `Who is ${groundTruths.firstName}?`,
    expectedBehavior: 'Response should describe Spencer using data from the about content type',
    assertions: [
      { type: 'regex', value: 'software engineer|full.?stack|developer', flags: 'i' },
      { type: 'notRegex', value: "don't have|no information|no.{0,20}details|not available", flags: 'i' },
    ],
    groundTruth: `${groundTruths.firstName} is a software engineer specializing in full-stack development and AI/ML systems.`,
    expectedTools: ['list_content'],
  },
  {
    id: 'rel-010',
    category: 'relevance',
    input: `What are ${groundTruths.firstName}'s hobbies?`,
    expectedBehavior: 'Response should mention real hobbies from the portfolio data',
    assertions: [
      { type: 'regex', value: assertionRegex.anyHobby(), flags: 'i' },
      { type: 'notRegex', value: 'gaming|sports|cooking|travel|hiking|photography|painting|gardening', flags: 'i' },
    ],
  },
  {
    id: 'rel-011',
    category: 'relevance',
    input: `Does ${groundTruths.firstName} have any pets?`,
    expectedBehavior: 'Response should deflect personal-life questions and pivot to portfolio topics',
    assertions: [
      { type: 'regex', value: 'professional|portfolio|don\'t have|focus', flags: 'i' },
      { type: 'notRegex', value: 'he (has|owns) a|his (pet|dog|cat)', flags: 'i' },
    ],
  },
  {
    id: 'rel-012',
    category: 'relevance',
    input: `Tell me about ${groundTruths.firstName}`,
    expectedBehavior: 'Vague but common query -- should give a broad overview of the portfolio owner',
    assertions: [
      { type: 'regex', value: 'software engineer|developer|full.?stack', flags: 'i' },
      { type: 'lengthMin', value: 50 },
    ],
    groundTruth: `${groundTruths.firstName} is a ${groundTruths.currentRole} at ${groundTruths.currentCompanyName} specializing in full-stack development and AI/ML.`,
  },
  {
    id: 'rel-013',
    category: 'relevance',
    input: `What can ${groundTruths.firstName} do with AI?`,
    expectedBehavior: 'Response should cross-reference skills, projects, and experience related to AI',
    assertions: [
      { type: 'regex', value: 'langraph|langgraph|langchain|rag|agent|ai|ml|openai', flags: 'i' },
      { type: 'lengthMin', value: 40 },
    ],
  },
  {
    id: 'rel-014',
    category: 'relevance',
    input: 'Tell me more',
    expectedBehavior: 'No context in single-turn -- should ask for clarification or give a general overview',
    assertions: [
      { type: 'regex', value: 'what|which|specific|more about|help|clarif|could you', flags: 'i' },
      { type: 'lengthMin', value: 20 },
    ],
  },
  {
    id: 'rel-015',
    category: 'relevance',
    input: `How is ${groundTruths.firstName}'s backend experience different from frontend?`,
    expectedBehavior: 'Response should compare backend and frontend skills/experience from the portfolio',
    assertions: [
      { type: 'regex', value: 'backend|back.?end|front.?end|frontend|api|react|node|express|spring', flags: 'i' },
      { type: 'lengthMin', value: 50 },
    ],
  },
  {
    id: 'rel-016',
    category: 'relevance',
    input: `What makes ${groundTruths.firstName} stand out as a candidate?`,
    expectedBehavior: 'Response should synthesize strengths across skills, projects, and experience',
    assertions: [
      { type: 'regex', value: assertionRegex.anyProject(), flags: 'i' },
      { type: 'lengthMin', value: 60 },
    ],
  },
]
