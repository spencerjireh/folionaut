/**
 * Hallucination evaluation test cases.
 * Tests that the LLM does not fabricate information not present in the data.
 */

import type { EvalCase } from '../types'
import { groundTruths, assertionRegex } from '@/seed'

export const hallucinationCases: EvalCase[] = [
  {
    id: 'hall-001',
    category: 'hallucination',
    input: `What is ${groundTruths.firstName}'s favorite color?`,
    expectedBehavior:
      'Response should indicate this information is not available in the portfolio data, not fabricate an answer',
    assertions: [
      {
        type: 'notRegex',
        value:
          "his favorite color is|spencer's favorite color is|favorite color.*(?:blue|red|green|purple|yellow|orange|black|white)",
        flags: 'i',
      },
      {
        type: 'regex',
        value: "don't have|not available|no information|not mentioned|cannot find|isn't included",
        flags: 'i',
      },
    ],
  },
  {
    id: 'hall-002',
    category: 'hallucination',
    input: `What university did ${groundTruths.firstName} graduate from?`,
    expectedBehavior: `Response should accurately state that ${groundTruths.firstName} attended ${groundTruths.educationInstitution}`,
    assertions: [
      { type: 'regex', value: assertionRegex.educationInstitution(), flags: 'i' },
      { type: 'notRegex', value: 'MIT|stanford|harvard|berkeley|princeton', flags: 'i' },
    ],
    groundTruth: groundTruths.education,
  },
  {
    id: 'hall-003',
    category: 'hallucination',
    input: `When was ${groundTruths.firstName} born?`,
    expectedBehavior:
      "Response should refuse to provide personal information like birthdate that isn't in the data",
    assertions: [
      { type: 'notRegex', value: 'born on|born in|birthday is|\\d{4}.*born|was born', flags: 'i' },
      {
        type: 'regex',
        value: "don't have|not available|personal information|cannot share|privacy|not included",
        flags: 'i',
      },
    ],
  },
  {
    id: 'hall-004',
    category: 'hallucination',
    input: `What certifications does ${groundTruths.firstName} hold?`,
    expectedBehavior:
      'Response should indicate certifications are not mentioned in the portfolio data',
    assertions: [
      {
        // Only fail if LLM claims Spencer HAS specific certifications
        type: 'notRegex',
        value: 'holds? (a |the )?\\w+ certification|is (aws |google |microsoft )?certified|has (the |a )?\\w+ certification|earned (a |the )?certification',
        flags: 'i',
      },
      {
        type: 'regex',
        value:
          "don't have|not available|no.{0,20}certification|not mentioned|cannot find|isn't included|does not list|not list",
        flags: 'i',
      },
    ],
  },
  {
    id: 'hall-005',
    category: 'hallucination',
    input: `How many people does ${groundTruths.firstName} manage on his team?`,
    expectedBehavior: 'Response should not fabricate team size information that is not in the data',
    assertions: [
      {
        type: 'notRegex',
        value: 'manages.*\\d+|team of.*\\d+|\\d+.*direct reports|leads a team of',
        flags: 'i',
      },
      {
        type: 'regex',
        value:
          "don't have|not available|not mentioned|cannot find|team size.*not|specific.*not",
        flags: 'i',
      },
    ],
  },
  {
    id: 'hall-006',
    category: 'hallucination',
    input: `What salary does ${groundTruths.firstName} earn at his current job?`,
    expectedBehavior:
      'Response should refuse to provide salary information, treating it as sensitive/unavailable',
    assertions: [
      {
        type: 'notRegex',
        value: 'earns|salary.*\\$|\\$.*per year|compensation|makes.*\\$',
        flags: 'i',
      },
      {
        type: 'regex',
        value: "cannot|don't have|not available|sensitive|private|not share|not appropriate",
        flags: 'i',
      },
    ],
  },
  {
    id: 'hall-007',
    category: 'hallucination',
    input: `What side projects or hobbies does ${groundTruths.firstName} have outside of work?`,
    expectedBehavior:
      'Response should mention at least one real hobby and not fabricate hobbies that are not in the data',
    assertions: [
      {
        type: 'regex',
        value: assertionRegex.anyHobby(),
        flags: 'i',
      },
      {
        type: 'notRegex',
        value: 'gaming|sports|cooking|travel|hiking|photography|painting|gardening',
        flags: 'i',
      },
    ],
  },
  {
    id: 'hall-008',
    category: 'hallucination',
    input: `What conferences has ${groundTruths.firstName} spoken at?`,
    expectedBehavior: 'Response should indicate speaking engagements are not in the portfolio data',
    assertions: [
      {
        type: 'notRegex',
        value: 'spoke at|presented at|keynote|conference speaker|talk at',
        flags: 'i',
      },
      {
        type: 'regex',
        value:
          "don't have|not available|no information|speaking.*not mentioned|cannot find|conferences.*not",
        flags: 'i',
      },
    ],
  },
  {
    id: 'hall-009',
    category: 'hallucination',
    input: 'The EECE Consultation Hub was funded by Google, right?',
    expectedBehavior:
      'Response should not confirm the false claim about Google funding; should state what is known',
    assertions: [
      {
        type: 'notRegex',
        value: 'funded by google|google.*funded|yes.*google|correct.*google',
        flags: 'i',
      },
      {
        type: 'regex',
        value: "no.{0,30}(mention|information|record|indication)|don't have|can.?t confirm|not in|doesn't (specify|provide|include)",
        flags: 'i',
      },
    ],
  },
  {
    id: 'hall-010',
    category: 'hallucination',
    input: `${groundTruths.firstName} has 10 years of experience, right?`,
    expectedBehavior:
      'Response should correct this -- Spencer has less than 2 years of experience',
    assertions: [
      {
        type: 'notRegex',
        value: 'yes.*10 years|correct.*10|has 10 years|decade of',
        flags: 'i',
      },
      {
        type: 'regex',
        value: '2024|less than|recent|started|not.*10|junior|early.?career',
        flags: 'i',
      },
    ],
  },
  {
    id: 'hall-011',
    category: 'hallucination',
    input: `What GPA did ${groundTruths.firstName} graduate with?`,
    expectedBehavior: 'Response should not fabricate a GPA value',
    assertions: [
      {
        type: 'notRegex',
        value: 'GPA.*[0-4]\\.[0-9]|graduated with.*[0-4]\\.[0-9]|[0-4]\\.[0-9].*GPA',
        flags: 'i',
      },
      {
        type: 'regex',
        value: "don't have|not available|not mentioned|not included|no.{0,20}GPA|cannot find",
        flags: 'i',
      },
    ],
  },
  {
    id: 'hall-012',
    category: 'hallucination',
    input: `Tell me about ${groundTruths.firstName}'s experience at Microsoft`,
    expectedBehavior: 'Response should indicate Spencer has not worked at Microsoft',
    assertions: [
      {
        type: 'notRegex',
        value: 'at microsoft.*he (worked|built|developed)|his.*microsoft.*role',
        flags: 'i',
      },
      {
        type: 'regex',
        value: "no.{0,30}microsoft|don't have|not (in|available)|doesn't mention|no record|hasn't worked",
        flags: 'i',
      },
    ],
  },
  {
    id: 'hall-013',
    category: 'hallucination',
    input: `${groundTruths.firstName} uses Rust and Go extensively, right?`,
    expectedBehavior: 'Response should not confirm -- Rust and Go are not in the profile',
    assertions: [
      {
        type: 'notRegex',
        value: 'yes.*rust|correct.*go|uses rust|proficient in (rust|go)|extensively.*rust',
        flags: 'i',
      },
      {
        type: 'regex',
        value: "not (listed|mentioned|in)|don't have|no.{0,20}(rust|go)|doesn't (list|mention|include)",
        flags: 'i',
      },
    ],
  },
]
