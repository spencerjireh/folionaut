import { eq, and, lt, desc, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { chatSessions, chatMessages } from '@/db/schema'
import { sessionId, messageId } from '@/lib/id'
import type {
  ChatSession,
  ChatMessage,
  CreateChatSessionDto,
  CreateChatMessageDto,
  ChatStats,
  SessionStatus,
} from '@/db/models'

const SESSION_EXPIRY_HOURS = 24

export class ChatRepository {
  async createSession(dto: CreateChatSessionDto): Promise<ChatSession> {
    const id = sessionId()
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

    await db.insert(chatSessions).values(newSession)
    return newSession
  }

  async findSession(id: string): Promise<ChatSession | null> {
    const result = await db.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1)

    return result.length > 0 ? result[0] : null
  }

  async findActiveSession(visitorId: string): Promise<ChatSession | null> {
    const now = new Date().toISOString()

    const result = await db
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

    const result = await db
      .update(chatSessions)
      .set({ lastActiveAt: now })
      .where(eq(chatSessions.id, id))

    return result.rowsAffected > 0
  }

  async endSession(id: string, status: SessionStatus = 'ended'): Promise<boolean> {
    const now = new Date().toISOString()

    const result = await db
      .update(chatSessions)
      .set({ status, lastActiveAt: now })
      .where(eq(chatSessions.id, id))

    return result.rowsAffected > 0
  }

  async addMessage(sessionId: string, dto: CreateChatMessageDto): Promise<ChatMessage> {
    const id = messageId()
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

    // Insert message and increment count atomically using batch
    await db.batch([
      db.insert(chatMessages).values(newMessage),
      db
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
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt)
      .limit(limit)
      .offset(offset)
  }

  async findExpired(olderThan: Date): Promise<ChatSession[]> {
    return db
      .select()
      .from(chatSessions)
      .where(
        and(eq(chatSessions.status, 'active'), lt(chatSessions.expiresAt, olderThan.toISOString()))
      )
  }

  async deleteExpired(): Promise<number> {
    const now = new Date().toISOString()
    const result = await db
      .update(chatSessions)
      .set({ status: 'expired' as SessionStatus })
      .where(
        and(eq(chatSessions.status, 'active'), lt(chatSessions.expiresAt, now))
      )
    return result.rowsAffected
  }

  async listSessions(options?: {
    status?: SessionStatus
    limit?: number
    offset?: number
  }): Promise<ChatSession[]> {
    const conditions: ReturnType<typeof eq>[] = []

    if (options?.status) {
      conditions.push(eq(chatSessions.status, options.status))
    }

    const query = db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.lastActiveAt))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0)

    return conditions.length > 0 ? await query.where(and(...conditions)) : await query
  }

  async getStats(sessionId: string): Promise<ChatStats | null> {
    const session = await this.findSession(sessionId)
    if (!session) return null

    // Get total tokens used
    const tokensResult = await db
      .select({
        totalTokens: sql<number>`COALESCE(SUM(${chatMessages.tokensUsed}), 0)`,
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))

    const totalTokens = tokensResult[0]?.totalTokens ?? 0

    // Calculate duration
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

export const chatRepository = new ChatRepository()
