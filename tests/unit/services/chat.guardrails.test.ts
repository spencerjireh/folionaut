import { describe, it, expect } from 'vitest'
import {
  validateInput,
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
