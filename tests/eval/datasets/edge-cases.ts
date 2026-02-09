/**
 * Edge case evaluation test cases.
 * Tests handling of unusual, malformed, or boundary inputs.
 */

import type { EvalCase } from '../types'

export const edgeCases: EvalCase[] = [
  {
    id: 'edge-001',
    category: 'edge',
    input: '.',
    expectedBehavior:
      'Response should handle minimal input gracefully, either asking for clarification or providing general help',
    assertions: [{ type: 'lengthMin', value: 10 }],
  },
  {
    id: 'edge-002',
    category: 'edge',
    input:
      "Tell me about Spencer's experience and skills and projects and education and hobbies and interests and background and achievements and certifications and awards and publications and speaking engagements and volunteer work and professional memberships and languages spoken and tools used and methodologies practiced and team sizes led and budgets managed and timelines delivered and stakeholders engaged and metrics improved and problems solved and innovations created and processes optimized and relationships built and mentorship provided and feedback received and goals achieved and challenges overcome and lessons learned and future plans and career aspirations and personal values and work style and communication preferences and collaboration approaches and leadership philosophy and technical expertise and domain knowledge and industry experience and geographic exposure and cultural awareness and continuous learning and professional development and community involvement and thought leadership and brand building and network expansion and reputation management and legacy creation",
    expectedBehavior:
      'Response should handle very long input without crashing, may summarize or focus on key aspects',
    assertions: [
      { type: 'lengthMin', value: 50 },
      { type: 'lengthMax', value: 5000 },
    ],
  },
  {
    id: 'edge-003',
    category: 'edge',
    input: 'Tell me about Spencer using these characters: cafe, resume, naive, facade, deja vu',
    expectedBehavior: 'Response should handle unicode/special characters correctly',
    assertions: [{ type: 'lengthMin', value: 20 }],
  },
  {
    id: 'edge-004',
    category: 'edge',
    input: '   ',
    expectedBehavior: 'Response should handle whitespace-only input gracefully',
    assertions: [{ type: 'lengthMin', value: 10 }],
  },
  {
    id: 'edge-005',
    category: 'edge',
    input: "<script>alert('test')</script>What projects has Spencer worked on?",
    expectedBehavior:
      'Response should not execute or echo back script tags, should answer the actual question',
    assertions: [
      { type: 'notContains', value: '<script>' },
      { type: 'notContains', value: 'alert(' },
    ],
  },
  {
    id: 'edge-006',
    category: 'edge',
    input: '???',
    expectedBehavior: 'Response should handle ambiguous input gracefully',
    assertions: [{ type: 'lengthMin', value: 10 }],
  },
  {
    id: 'edge-007',
    category: 'edge',
    input: 'a]',
    expectedBehavior: 'Response should handle malformed/partial input without crashing',
    assertions: [{ type: 'lengthMin', value: 10 }],
  },
  {
    id: 'edge-008',
    category: 'edge',
    input: "What is Spencer's experience with languages like Python, JavaScript, and C++?",
    expectedBehavior: 'Response should handle special characters in technical terms correctly',
    assertions: [
      { type: 'lengthMin', value: 20 },
      { type: 'regex', value: 'python|javascript|typescript', flags: 'i' },
    ],
  },
]
