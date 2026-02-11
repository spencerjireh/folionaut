import { describe, it, expect } from 'vitest'
import {
  validateInput,
  detectHobbiesQuestion,
  isEmptyOrWhitespace,
} from '@/services/chat.guardrails'

describe('chat.guardrails', () => {
  describe('validateInput', () => {
    it('should pass for identity questions', () => {
      const identityQuestions = [
        'Who is Spencer?',
        'Tell me about Spencer',
        'What does Spencer do?',
        'Can you introduce Spencer?',
      ]

      for (const question of identityQuestions) {
        const result = validateInput(question)
        expect(result.passed, `Expected "${question}" to pass`).toBe(true)
      }
    })

    it('should fail for hobbies keywords', () => {
      const result = validateInput("What are Spencer's hobbies?")
      expect(result.passed).toBe(false)
      expect(result.reason).toContain('professional portfolio')
    })

    it('should fail for personal life questions', () => {
      const personalQuestions = [
        'Is Spencer married?',
        'Does Spencer have kids?',
        'What does Spencer do in his free time?',
        "What is Spencer's favorite food?",
      ]

      for (const question of personalQuestions) {
        const result = validateInput(question)
        expect(result.passed, `Expected "${question}" to fail`).toBe(false)
      }
    })

    it('should fail for empty input', () => {
      const result = validateInput('')
      expect(result.passed).toBe(false)
      expect(result.reason).toContain("didn't receive a clear message")
    })

    it('should fail for whitespace-only input', () => {
      const result = validateInput('   \n\t  ')
      expect(result.passed).toBe(false)
      expect(result.reason).toContain("didn't receive a clear message")
    })

    it('should pass for normal portfolio questions', () => {
      const normalQuestions = [
        'What projects has Spencer worked on?',
        "What are Spencer's skills?",
        'Tell me about his experience',
      ]

      for (const question of normalQuestions) {
        const result = validateInput(question)
        expect(result.passed, `Expected "${question}" to pass`).toBe(true)
      }
    })
  })

  describe('detectHobbiesQuestion', () => {
    it('should NOT match identity questions', () => {
      expect(detectHobbiesQuestion('Who is Spencer?')).toBe(false)
      expect(detectHobbiesQuestion('Tell me about Spencer')).toBe(false)
      expect(detectHobbiesQuestion('What does Spencer do?')).toBe(false)
    })

    it('should match hobbies keywords', () => {
      expect(detectHobbiesQuestion("What are Spencer's hobbies?")).toBe(true)
      expect(detectHobbiesQuestion('What does Spencer do in his free time?')).toBe(true)
      expect(detectHobbiesQuestion('Does Spencer have any pets?')).toBe(true)
      expect(detectHobbiesQuestion("What is Spencer's favorite movie?")).toBe(true)
    })

    it('should match personal life keywords', () => {
      expect(detectHobbiesQuestion('Is Spencer married?')).toBe(true)
      expect(detectHobbiesQuestion('Does Spencer have children?')).toBe(true)
      expect(detectHobbiesQuestion("Tell me about Spencer's family")).toBe(true)
    })
  })

  describe('isEmptyOrWhitespace', () => {
    it('should return true for empty string', () => {
      expect(isEmptyOrWhitespace('')).toBe(true)
    })

    it('should return true for whitespace-only string', () => {
      expect(isEmptyOrWhitespace('   ')).toBe(true)
      expect(isEmptyOrWhitespace('\t\n')).toBe(true)
    })

    it('should return false for non-empty string', () => {
      expect(isEmptyOrWhitespace('hello')).toBe(false)
      expect(isEmptyOrWhitespace(' hello ')).toBe(false)
    })
  })
})
