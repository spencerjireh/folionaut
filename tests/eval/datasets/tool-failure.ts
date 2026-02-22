/**
 * Tool failure evaluation test cases.
 * Tests graceful handling when tools return no results or errors.
 */

import type { EvalCase } from '../types'

export const toolFailureCases: EvalCase[] = [
  {
    id: 'toolfail-001',
    category: 'toolfail',
    input: "Tell me about Spencer's certifications",
    expectedBehavior:
      'Response should gracefully indicate certification info is not available',
    expectedTools: ['list_content', 'search_content'],
    assertions: [
      {
        type: 'regex',
        value:
          "don't have|not available|no.{0,30}certification|does not (list|include)|not list|information.*not found|not mentioned|doesn't (include|have|list|mention)",
        flags: 'i',
      },
      { type: 'lengthMin', value: 30 },
    ],
  },
  {
    id: 'toolfail-002',
    category: 'toolfail',
    input: "Can you show me the details of the 'quantum-computing-simulator' project?",
    expectedBehavior:
      "Response should gracefully handle nonexistent project and explain it wasn't found",
    expectedTools: ['get_content'],
    assertions: [
      { type: 'toolCalled', toolName: 'get_content' },
      {
        type: 'toolArgument',
        toolName: 'get_content',
        argumentPath: 'slug',
        argumentValue: 'quantum-computing-simulator',
      },
      {
        type: 'regex',
        value: "couldn't find|not found|doesn't exist|no project|unable to find|not available",
        flags: 'i',
      },
      { type: 'lengthMin', value: 20 },
    ],
  },
  {
    id: 'toolfail-003',
    category: 'toolfail',
    input: "Search for Spencer's experience with blockchain technology",
    expectedBehavior:
      'Response should gracefully indicate no blockchain-related content was found',
    expectedTools: ['search_content'],
    assertions: [
      { type: 'toolCalled', toolName: 'search_content' },
      { type: 'toolArgument', toolName: 'search_content', argumentPath: 'query', argumentValue: 'blockchain' },
      {
        type: 'regex',
        value: "no results|not found|couldn't find|doesn't have|no mention|no information",
        flags: 'i',
      },
      { type: 'lengthMin', value: 20 },
    ],
  },
  {
    id: 'toolfail-004',
    category: 'toolfail',
    input: "What is Spencer's phone number and email address?",
    expectedBehavior:
      'Response should provide the public email but indicate phone number is not available',
    expectedTools: ['list_content', 'get_content'],
    assertions: [
      // Should provide email since it's public contact info
      { type: 'regex', value: '@gmail\\.com|@.*\\.com', flags: 'i' },
      // Should NOT provide phone number
      { type: 'notRegex', value: '\\d{3}[-.\\s]?\\d{3}[-.\\s]?\\d{4}', flags: 'i' },
      { type: 'lengthMin', value: 20 },
    ],
  },
  {
    id: 'toolfail-005',
    category: 'toolfail',
    input: 'Does Spencer have any machine learning or AI experience?',
    expectedBehavior:
      'Response should search and report on ML/AI experience based on available data',
    expectedTools: ['search_content'],
    assertions: [
      { type: 'toolCalled', toolName: 'search_content' },
      { type: 'lengthMin', value: 30 },
    ],
  },
  {
    id: 'toolfail-006',
    category: 'toolfail',
    input: "Show me details about 'eece-consultation-hub' and 'blockchain-defi-platform'",
    expectedBehavior:
      'Response should return real data for the existing slug and gracefully handle the fake slug',
    expectedTools: ['get_content'],
    assertions: [
      { type: 'toolCalled', toolName: 'get_content' },
      { type: 'regex', value: 'eece|consultation', flags: 'i' },
      {
        type: 'regex',
        value: "couldn't find|not found|doesn't exist|no.{0,20}blockchain|unable to find|not available",
        flags: 'i',
      },
      { type: 'lengthMin', value: 40 },
    ],
  },
  {
    id: 'toolfail-007',
    category: 'toolfail',
    input: "List all Spencer's blog posts",
    expectedBehavior:
      'Response should indicate blog posts are not available as a content type',
    expectedTools: ['list_content'],
    assertions: [
      {
        type: 'regex',
        value: "don't have|no.{0,20}blog|not available|no blog|doesn't have|not found",
        flags: 'i',
      },
      { type: 'lengthMin', value: 20 },
    ],
  },
  {
    id: 'toolfail-008',
    category: 'toolfail',
    input: 'What awards has Spencer won?',
    expectedBehavior:
      'Response should indicate award information is not available without fabricating any',
    expectedTools: ['search_content', 'list_content'],
    assertions: [
      {
        type: 'regex',
        value: "don't have|not available|no.{0,20}award|not mentioned|cannot find|not listed|doesn't (include|have|list|mention)",
        flags: 'i',
      },
      {
        type: 'notRegex',
        value: 'won the|received the|awarded|recipient of',
        flags: 'i',
      },
      { type: 'lengthMin', value: 20 },
    ],
  },
  {
    id: 'toolfail-009',
    category: 'toolfail',
    input: 'Compare Folionaut with his work at Google',
    expectedBehavior:
      'Response should discuss Folionaut from real data but not fabricate Google experience',
    assertions: [
      { type: 'regex', value: 'folionaut', flags: 'i' },
      {
        type: 'regex',
        value: "no.{0,20}google|don't have|not available|doesn't mention|no information|no record",
        flags: 'i',
      },
      { type: 'lengthMin', value: 30 },
    ],
  },
  {
    id: 'toolfail-010',
    category: 'toolfail',
    input: "Search for Spencer's publications",
    expectedBehavior:
      'Response should gracefully indicate no publications were found',
    expectedTools: ['search_content'],
    assertions: [
      { type: 'toolCalled', toolName: 'search_content' },
      {
        type: 'regex',
        value: "no results|not found|couldn't find|doesn't have|no.{0,20}publication|not available|no information",
        flags: 'i',
      },
      { type: 'lengthMin', value: 20 },
    ],
  },
]
