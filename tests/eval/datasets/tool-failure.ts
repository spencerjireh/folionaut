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
          "don't have|not available|no.{0,30}certification|does not list|not list|information.*not found|not mentioned",
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
]
