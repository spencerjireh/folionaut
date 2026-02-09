import { eq, and, lt, desc, sql } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { createTestDb, initializeSchema, cleanupTestDb, closeTestDb, type TestDb } from '../../helpers/test-db'
import * as schema from '@/db/schema'
import { chatSessions, chatMessages } from '@/db/schema'
import type { ChatSession, ChatMessage, SessionStatus, ChatStats } from '@/db/models'

const SESSION_EXPIRY_HOURS = 24

// Test repository that accepts a db instance
class TestChatRepository {
  constructor(private db: LibSQLDatabase<typeof schema>) {}

  async createSession(dto: { visitorId: string; ipHash: string; userAgent?: string }): Promise<ChatSession> {
    const id = `sess_test_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000)

    const newSession: ChatSession = {
      id,
      visitorId: dto.visitorId,
      ipHash: dto.ipHash,
      userAgent: dto.userAgent ?? null,
      messageCount: 0,
      status: 'active',
      createdAt: now.toISOString(),
      lastActiveAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }

    await this.db.insert(chatSessions).values(newSession)
    return newSession
  }

  async findSession(id: string): Promise<ChatSession | null> {
    const result = await this.db.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1)
    return result.length > 0 ? result[0] : null
  }

  async findActiveSession(visitorId: string): Promise<ChatSession | null> {
    const now = new Date().toISOString()

    const result = await this.db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.visitorId, visitorId),
          eq(chatSessions.status, 'active'),
          sql`${chatSessions.expiresAt} > ${now}`
        )
      )
      .orderBy(desc(chatSessions.lastActiveAt))
      .limit(1)

    return result.length > 0 ? result[0] : null
  }

  async updateActivity(id: string): Promise<boolean> {
    const now = new Date().toISOString()

    const result = await this.db
      .update(chatSessions)
      .set({ lastActiveAt: now })
      .where(eq(chatSessions.id, id))

    return result.rowsAffected > 0
  }

  async endSession(id: string, status: SessionStatus = 'ended'): Promise<boolean> {
    const now = new Date().toISOString()

    const result = await this.db
      .update(chatSessions)
      .set({ status, lastActiveAt: now })
      .where(eq(chatSessions.id, id))

    return result.rowsAffected > 0
  }

  async addMessage(
    sessionId: string,
    dto: { role: 'user' | 'assistant' | 'system'; content: string; tokensUsed?: number; model?: string }
  ): Promise<ChatMessage> {
    const id = `msg_test_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const now = new Date().toISOString()

    const newMessage: ChatMessage = {
      id,
      sessionId,
      role: dto.role,
      content: dto.content,
      tokensUsed: dto.tokensUsed ?? null,
      model: dto.model ?? null,
      createdAt: now,
    }

    await this.db.batch([
      this.db.insert(chatMessages).values(newMessage),
      this.db
        .update(chatSessions)
        .set({
          messageCount: sql`${chatSessions.messageCount} + 1`,
          lastActiveAt: now,
        })
        .where(eq(chatSessions.id, sessionId)),
    ])

    return newMessage
  }

  async getMessages(sessionId: string, limit = 100, offset = 0): Promise<ChatMessage[]> {
    return this.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt)
      .limit(limit)
      .offset(offset)
  }

  async findExpired(olderThan: Date): Promise<ChatSession[]> {
    return this.db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.status, 'active'), lt(chatSessions.expiresAt, olderThan.toISOString())))
  }

  async deleteExpired(): Promise<number> {
    const now = new Date().toISOString()
    const result = await this.db
      .update(chatSessions)
      .set({ status: 'expired' as SessionStatus })
      .where(
        and(eq(chatSessions.status, 'active'), lt(chatSessions.expiresAt, now))
      )
    return result.rowsAffected
  }

  async getStats(sessionId: string): Promise<ChatStats | null> {
    const session = await this.findSession(sessionId)
    if (!session) return null

    const tokensResult = await this.db
      .select({
        totalTokens: sql<number>`COALESCE(SUM(${chatMessages.tokensUsed}), 0)`,
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))

    const totalTokens = tokensResult[0]?.totalTokens ?? 0

    const startTime = new Date(session.createdAt).getTime()
    const lastActiveTime = new Date(session.lastActiveAt).getTime()
    const durationMs = lastActiveTime - startTime

    return {
      sessionId,
      messageCount: session.messageCount,
      totalTokens,
      durationMs,
      startedAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
    }
  }
}

describe('ChatRepository Integration', () => {
  let testDb: TestDb
  let repository: TestChatRepository

  beforeAll(async () => {
    testDb = createTestDb()
    await initializeSchema(testDb.db)
    repository = new TestChatRepository(testDb.db)
  })

  beforeEach(async () => {
    await cleanupTestDb(testDb.db)
  })

  afterAll(() => {
    closeTestDb(testDb)
  })

  describe('createSession', () => {
    it('should create a new session', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-123',
        ipHash: 'abc123hash',
        userAgent: 'Mozilla/5.0',
      })

      expect(session.id).toMatch(/^sess_/)
      expect(session.visitorId).toBe('visitor-123')
      expect(session.ipHash).toBe('abc123hash')
      expect(session.userAgent).toBe('Mozilla/5.0')
      expect(session.messageCount).toBe(0)
      expect(session.status).toBe('active')
    })

    it('should set expiry to 24 hours from creation', async () => {
      const before = Date.now()
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })
      const after = Date.now()

      const expiresAt = new Date(session.expiresAt).getTime()
      const expectedMin = before + 24 * 60 * 60 * 1000
      const expectedMax = after + 24 * 60 * 60 * 1000

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin)
      expect(expiresAt).toBeLessThanOrEqual(expectedMax)
    })

    it('should allow null userAgent', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      expect(session.userAgent).toBeNull()
    })
  })

  describe('findSession', () => {
    it('should find session by id', async () => {
      const created = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      const found = await repository.findSession(created.id)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(created.id)
      expect(found!.visitorId).toBe('visitor-1')
    })

    it('should return null for non-existent session', async () => {
      const found = await repository.findSession('sess_nonexistent')
      expect(found).toBeNull()
    })
  })

  describe('findActiveSession', () => {
    it('should find active session for visitor', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      const found = await repository.findActiveSession('visitor-1')

      expect(found).not.toBeNull()
      expect(found!.id).toBe(session.id)
    })

    it('should return null for ended session', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })
      await repository.endSession(session.id)

      const found = await repository.findActiveSession('visitor-1')
      expect(found).toBeNull()
    })

    it('should return null for non-existent visitor', async () => {
      const found = await repository.findActiveSession('nonexistent')
      expect(found).toBeNull()
    })

    it('should return most recent active session', async () => {
      const session1 = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })
      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10))
      const session2 = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      const found = await repository.findActiveSession('visitor-1')

      expect(found!.id).toBe(session2.id)
    })
  })

  describe('updateActivity', () => {
    it('should update lastActiveAt timestamp', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      const originalLastActive = session.lastActiveAt

      // Small delay
      await new Promise((r) => setTimeout(r, 10))

      const result = await repository.updateActivity(session.id)

      expect(result).toBe(true)

      const updated = await repository.findSession(session.id)
      expect(updated!.lastActiveAt).not.toBe(originalLastActive)
    })

    it('should return false for non-existent session', async () => {
      const result = await repository.updateActivity('sess_fake')
      expect(result).toBe(false)
    })
  })

  describe('endSession', () => {
    it('should end session with default status', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      const result = await repository.endSession(session.id)

      expect(result).toBe(true)

      const ended = await repository.findSession(session.id)
      expect(ended!.status).toBe('ended')
    })

    it('should end session with custom status', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      await repository.endSession(session.id, 'expired')

      const ended = await repository.findSession(session.id)
      expect(ended!.status).toBe('expired')
    })

    it('should return false for non-existent session', async () => {
      const result = await repository.endSession('sess_fake')
      expect(result).toBe(false)
    })
  })

  describe('addMessage', () => {
    it('should add message to session', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      const message = await repository.addMessage(session.id, {
        role: 'user',
        content: 'Hello!',
      })

      expect(message.id).toMatch(/^msg_/)
      expect(message.sessionId).toBe(session.id)
      expect(message.role).toBe('user')
      expect(message.content).toBe('Hello!')
    })

    it('should increment message count atomically', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      await repository.addMessage(session.id, { role: 'user', content: 'Msg 1' })
      await repository.addMessage(session.id, { role: 'assistant', content: 'Msg 2' })
      await repository.addMessage(session.id, { role: 'user', content: 'Msg 3' })

      const updated = await repository.findSession(session.id)
      expect(updated!.messageCount).toBe(3)
    })

    it('should store tokens and model for assistant messages', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      const message = await repository.addMessage(session.id, {
        role: 'assistant',
        content: 'Response',
        tokensUsed: 50,
        model: 'gpt-4o-mini',
      })

      expect(message.tokensUsed).toBe(50)
      expect(message.model).toBe('gpt-4o-mini')
    })

    it('should update lastActiveAt on session', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })
      const originalLastActive = session.lastActiveAt

      await new Promise((r) => setTimeout(r, 10))
      await repository.addMessage(session.id, { role: 'user', content: 'Test' })

      const updated = await repository.findSession(session.id)
      expect(updated!.lastActiveAt).not.toBe(originalLastActive)
    })
  })

  describe('getMessages', () => {
    it('should return messages in chronological order', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      await repository.addMessage(session.id, { role: 'user', content: 'First' })
      await new Promise((r) => setTimeout(r, 5))
      await repository.addMessage(session.id, { role: 'assistant', content: 'Second' })
      await new Promise((r) => setTimeout(r, 5))
      await repository.addMessage(session.id, { role: 'user', content: 'Third' })

      const messages = await repository.getMessages(session.id)

      expect(messages).toHaveLength(3)
      expect(messages[0].content).toBe('First')
      expect(messages[1].content).toBe('Second')
      expect(messages[2].content).toBe('Third')
    })

    it('should paginate messages', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      for (let i = 0; i < 5; i++) {
        await repository.addMessage(session.id, { role: 'user', content: `Msg ${i}` })
      }

      const page = await repository.getMessages(session.id, 2, 1)

      expect(page).toHaveLength(2)
    })

    it('should return empty array for session with no messages', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      const messages = await repository.getMessages(session.id)
      expect(messages).toHaveLength(0)
    })
  })

  describe('findExpired', () => {
    it('should find expired active sessions', async () => {
      // Create a session that we'll manually mark as expired
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      // Update expiry to past
      const pastDate = new Date(Date.now() - 1000).toISOString()
      await testDb.db
        .update(chatSessions)
        .set({ expiresAt: pastDate })
        .where(eq(chatSessions.id, session.id))

      const expired = await repository.findExpired(new Date())

      expect(expired).toHaveLength(1)
      expect(expired[0].id).toBe(session.id)
    })

    it('should not include ended sessions', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      // Mark as expired and ended
      const pastDate = new Date(Date.now() - 1000).toISOString()
      await testDb.db
        .update(chatSessions)
        .set({ expiresAt: pastDate, status: 'ended' })
        .where(eq(chatSessions.id, session.id))

      const expired = await repository.findExpired(new Date())
      expect(expired).toHaveLength(0)
    })
  })

  describe('deleteExpired', () => {
    it('should mark expired active sessions as expired', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      // Update expiry to past
      const pastDate = new Date(Date.now() - 1000).toISOString()
      await testDb.db
        .update(chatSessions)
        .set({ expiresAt: pastDate })
        .where(eq(chatSessions.id, session.id))

      const count = await repository.deleteExpired()

      expect(count).toBe(1)

      const updated = await repository.findSession(session.id)
      expect(updated!.status).toBe('expired')
    })

    it('should not affect non-expired sessions', async () => {
      await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      const count = await repository.deleteExpired()
      expect(count).toBe(0)
    })

    it('should not affect already ended sessions', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      const pastDate = new Date(Date.now() - 1000).toISOString()
      await testDb.db
        .update(chatSessions)
        .set({ expiresAt: pastDate, status: 'ended' })
        .where(eq(chatSessions.id, session.id))

      const count = await repository.deleteExpired()
      expect(count).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should return session statistics', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })

      await repository.addMessage(session.id, { role: 'user', content: 'Hi' })
      await repository.addMessage(session.id, {
        role: 'assistant',
        content: 'Hello',
        tokensUsed: 30,
      })
      await repository.addMessage(session.id, { role: 'user', content: 'Bye' })
      await repository.addMessage(session.id, {
        role: 'assistant',
        content: 'Goodbye',
        tokensUsed: 20,
      })

      const stats = await repository.getStats(session.id)

      expect(stats).not.toBeNull()
      expect(stats!.sessionId).toBe(session.id)
      expect(stats!.messageCount).toBe(4)
      expect(stats!.totalTokens).toBe(50)
      expect(stats!.durationMs).toBeGreaterThanOrEqual(0)
    })

    it('should return null for non-existent session', async () => {
      const stats = await repository.getStats('sess_fake')
      expect(stats).toBeNull()
    })

    it('should return 0 tokens when no assistant messages', async () => {
      const session = await repository.createSession({
        visitorId: 'visitor-1',
        ipHash: 'hash1',
      })
      await repository.addMessage(session.id, { role: 'user', content: 'Hi' })

      const stats = await repository.getStats(session.id)

      expect(stats!.totalTokens).toBe(0)
    })
  })
})
