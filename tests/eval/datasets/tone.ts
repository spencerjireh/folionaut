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
    assertions: [],
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
    expectedBehavior: 'Response should be patient and explain in accessible terms',
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
]
