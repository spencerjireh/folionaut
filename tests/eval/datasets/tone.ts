/**
 * Tone evaluation test cases.
 * Tests that the LLM maintains appropriate professional tone.
 */

import type { EvalCase } from '../types'

export const toneCases: EvalCase[] = [
  {
    id: 'tone-001',
    category: 'tone',
    input: 'Hi, can you tell me about Spencer?',
    expectedBehavior: 'Response should be professional, friendly, and helpful in tone',
    assertions: [
      { type: 'notRegex', value: "don't have|no information|not available", flags: 'i' },
    ],
  },
  {
    id: 'tone-002',
    category: 'tone',
    input: "This portfolio seems boring, doesn't it?",
    expectedBehavior: 'Response should remain professional and not be defensive or rude',
    assertions: [
      { type: 'notContains', value: 'boring' },
      { type: 'notContains', value: 'rude' },
    ],
  },
  {
    id: 'tone-003',
    category: 'tone',
    input: 'WHY ARE YOU SO SLOW? ANSWER MY QUESTION NOW!',
    expectedBehavior: 'Response should remain calm and professional despite aggressive input',
    assertions: [
      { type: 'notContains', value: 'calm down' },
      { type: 'notContains', value: 'rude' },
      { type: 'notRegex', value: "don't.+yell|stop.+shouting", flags: 'i' },
    ],
  },
  {
    id: 'tone-004',
    category: 'tone',
    input: 'yo whats up tell me bout this dude spencer lol',
    expectedBehavior:
      'Response should be helpful while maintaining professionalism, not mimicking informal tone',
    assertions: [
      { type: 'notContains', value: 'yo' },
      { type: 'notContains', value: 'lol' },
      { type: 'notContains', value: 'dude' },
    ],
  },
  {
    id: 'tone-005',
    category: 'tone',
    input: "Spencer's projects are terrible. Why would anyone hire him?",
    expectedBehavior: 'Response should professionally highlight positives without being defensive',
    assertions: [
      { type: 'notContains', value: 'terrible' },
      { type: 'notContains', value: 'wrong' },
      { type: 'notRegex', value: "how dare|that's not true|you're wrong", flags: 'i' },
    ],
  },
  {
    id: 'tone-006',
    category: 'tone',
    input: "Thank you so much! You've been incredibly helpful!",
    expectedBehavior:
      'Response should acknowledge gratitude graciously without being overly effusive',
    assertions: [{ type: 'lengthMin', value: 20 }],
  },
  {
    id: 'tone-007',
    category: 'tone',
    input: "I don't understand any of this technical stuff. Can you explain simply?",
    expectedBehavior:
      'Response should be patient and explain portfolio content in accessible terms, or ask what the user wants explained',
    conversation: [
      { role: 'user', content: 'What projects has Spencer worked on?' },
      {
        role: 'user',
        content: "I don't understand any of this technical stuff. Can you explain simply?",
        assertions: [
          { type: 'notRegex', value: 'obviously|clearly|as everyone knows', flags: 'i' },
          { type: 'notRegex', value: "don't have|no information", flags: 'i' },
        ],
      },
    ],
    assertions: [
      { type: 'notRegex', value: 'obviously|clearly|as everyone knows', flags: 'i' },
    ],
  },
  {
    id: 'tone-008',
    category: 'tone',
    input: 'Spencer seems overqualified. Is he really that good or just exaggerating?',
    expectedBehavior:
      'Response should be factual and professional without being defensive or boastful',
    assertions: [
      { type: 'notContains', value: 'exaggerating' },
      { type: 'notRegex', value: 'the best|number one|unmatched', flags: 'i' },
    ],
  },
  {
    id: 'tone-009',
    category: 'tone',
    input: 'Give me a one-sentence summary of Spencer',
    expectedBehavior: 'Response should be concise and comply with the brevity request',
    assertions: [
      { type: 'lengthMin', value: 20 },
      { type: 'lengthMax', value: 400 },
    ],
  },
  {
    id: 'tone-010',
    category: 'tone',
    input: 'Explain everything about Spencer in extreme detail',
    expectedBehavior:
      'Response should be thorough but structured, not a raw data dump',
    assertions: [
      { type: 'lengthMin', value: 100 },
      { type: 'notRegex', value: '\\{.*"slug".*\\}|\\[.*".*".*\\]', flags: 's' },
    ],
  },
  {
    id: 'tone-011',
    category: 'tone',
    input: "You couldn't help me find certifications. Pretty disappointing honestly.",
    expectedBehavior:
      'Response should handle user disappointment gracefully without being dismissive',
    assertions: [
      { type: 'notRegex', value: "that's your problem|deal with it|too bad", flags: 'i' },
      { type: 'lengthMin', value: 20 },
    ],
  },
  {
    id: 'tone-012',
    category: 'tone',
    input: '   ',
    expectedBehavior:
      'Response should handle whitespace input with a friendly clarification prompt',
    assertions: [
      { type: 'lengthMin', value: 10 },
    ],
  },
  {
    id: 'tone-013',
    category: 'tone',
    input: "Respond in bullet points. What are Spencer's skills?",
    expectedBehavior: 'Response should respect user formatting preference and use bullet points',
    assertions: [
      { type: 'regex', value: '[-*]\\s+\\w', flags: 'm' },
      { type: 'lengthMin', value: 30 },
    ],
  },
]
