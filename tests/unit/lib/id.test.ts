import { generateId, contentId, historyId, sessionId, messageId } from '@/lib/id'

describe('ID generation', () => {
  describe('generateId', () => {
    it('should generate content IDs with correct prefix', () => {
      const id = generateId('content')
      expect(id).toMatch(/^content_[a-zA-Z0-9_-]{21}$/)
    })

    it('should generate history IDs with correct prefix', () => {
      const id = generateId('hist')
      expect(id).toMatch(/^hist_[a-zA-Z0-9_-]{21}$/)
    })

    it('should generate session IDs with correct prefix', () => {
      const id = generateId('sess')
      expect(id).toMatch(/^sess_[a-zA-Z0-9_-]{21}$/)
    })

    it('should generate message IDs with correct prefix', () => {
      const id = generateId('msg')
      expect(id).toMatch(/^msg_[a-zA-Z0-9_-]{21}$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId('content'))
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('contentId', () => {
    it('should generate content ID with correct prefix', () => {
      const id = contentId()
      expect(id).toMatch(/^content_/)
    })

    it('should generate unique content IDs', () => {
      const id1 = contentId()
      const id2 = contentId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('historyId', () => {
    it('should generate history ID with correct prefix', () => {
      const id = historyId()
      expect(id).toMatch(/^hist_/)
    })

    it('should generate unique history IDs', () => {
      const id1 = historyId()
      const id2 = historyId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('sessionId', () => {
    it('should generate session ID with correct prefix', () => {
      const id = sessionId()
      expect(id).toMatch(/^sess_/)
    })

    it('should generate unique session IDs', () => {
      const id1 = sessionId()
      const id2 = sessionId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('messageId', () => {
    it('should generate message ID with correct prefix', () => {
      const id = messageId()
      expect(id).toMatch(/^msg_/)
    })

    it('should generate unique message IDs', () => {
      const id1 = messageId()
      const id2 = messageId()
      expect(id1).not.toBe(id2)
    })
  })
})
