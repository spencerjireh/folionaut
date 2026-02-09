import type { ChatSession, ChatMessage } from '@/db/models'

const { mockChatRepository, mockEventEmitter, mockRateLimiter, mockLLMProvider, mockExecuteToolCall, mockLogger } = vi.hoisted(() => {
  const mockLogger: Record<string, any> = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
  }
  mockLogger.child = vi.fn(() => mockLogger)
  return {
    mockChatRepository: {
      findActiveSession: vi.fn(),
      createSession: vi.fn(),
      findSession: vi.fn(),
      addMessage: vi.fn(),
      getMessages: vi.fn(),
      endSession: vi.fn(),
      getStats: vi.fn(),
    },
    mockEventEmitter: {
      emit: vi.fn(),
    },
    mockRateLimiter: {
      consume: vi.fn(),
      emitRateLimitEvent: vi.fn(),
    },
    mockLLMProvider: {
      sendMessage: vi.fn(),
    },
    mockExecuteToolCall: vi.fn(),
    mockLogger,
  }
})

vi.mock('@/repositories', () => ({
  chatRepository: mockChatRepository,
}))

vi.mock('@/events', () => ({
  eventEmitter: mockEventEmitter,
}))

vi.mock('@/resilience', () => ({
  rateLimiter: mockRateLimiter,
  CircuitBreaker: class MockCircuitBreaker {
    async execute(fn: () => Promise<unknown>) { return fn() }
  },
}))

vi.mock('@/llm', () => ({
  getLLMProvider: () => mockLLMProvider,
}))

vi.mock('@/tools', () => ({
  chatToolDefinitions: [],
  executeToolCall: mockExecuteToolCall,
}))

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}))

describe('ChatService', () => {
  let chatService: typeof import('@/services/chat.service').chatService

  beforeEach(async () => {
    vi.clearAllMocks()

    // Default mock implementations
    mockRateLimiter.consume.mockResolvedValue({ allowed: true, remaining: 5 })
    mockLLMProvider.sendMessage.mockResolvedValue({
      content: 'Hello! How can I help you?',
      tokensUsed: 50,
      model: 'gpt-4',
    })

    // Dynamic import to apply mocks
    const module = await import('@/services/chat.service')
    chatService = module.chatService
  })

  afterEach(() => {
    vi.resetModules()
  })

  // Test data factories
  const createSession = (overrides: Partial<ChatSession> = {}): ChatSession => ({
    id: 'sess_123',
    visitorId: 'visitor-123',
    ipHash: 'hash-123',
    userAgent: 'Mozilla/5.0',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    lastActiveAt: '2024-01-01T00:00:00Z',
    endedAt: null,
    ...overrides,
  })

  const createMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
    id: 'msg_123',
    sessionId: 'sess_123',
    role: 'user',
    content: 'Hello',
    tokensUsed: null,
    model: null,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  })

  describe('validateSendMessageRequest', () => {
    it('should accept valid request', () => {
      const result = chatService.validateSendMessageRequest({
        message: 'Hello',
        visitorId: 'visitor-123',
      })

      expect(result).toEqual({
        message: 'Hello',
        visitorId: 'visitor-123',
      })
    })

    it('should throw ValidationError for empty message', () => {
      expect(() =>
        chatService.validateSendMessageRequest({
          message: '',
          visitorId: 'visitor-123',
        })
      ).toThrow()
    })

    it('should throw ValidationError for missing visitorId', () => {
      expect(() =>
        chatService.validateSendMessageRequest({
          message: 'Hello',
        })
      ).toThrow()
    })

    it('should throw ValidationError for message over 2000 chars', () => {
      expect(() =>
        chatService.validateSendMessageRequest({
          message: 'a'.repeat(2001),
          visitorId: 'visitor-123',
        })
      ).toThrow()
    })
  })

  describe('validateSessionIdParam', () => {
    it('should accept valid session ID', () => {
      const result = chatService.validateSessionIdParam({ id: 'sess_abc123' })

      expect(result.id).toBe('sess_abc123')
    })

    it('should throw ValidationError for invalid session ID format', () => {
      expect(() => chatService.validateSessionIdParam({ id: 'invalid' })).toThrow()
    })
  })

  describe('validateSessionListQuery', () => {
    it('should provide defaults for empty query', () => {
      const result = chatService.validateSessionListQuery({})

      expect(result.limit).toBe(50)
      expect(result.offset).toBe(0)
    })

    it('should accept valid status filter', () => {
      const result = chatService.validateSessionListQuery({ status: 'active' })

      expect(result.status).toBe('active')
    })

    it('should throw ValidationError for invalid status', () => {
      expect(() => chatService.validateSessionListQuery({ status: 'invalid' })).toThrow()
    })
  })

  describe('sendMessage', () => {
    it('should process message and return response', async () => {
      const session = createSession()
      const assistantMessage = createMessage({
        id: 'msg_456',
        role: 'assistant',
        content: 'Hello! How can I help you?',
        tokensUsed: 50,
      })

      mockChatRepository.findActiveSession.mockResolvedValue(session)
      mockChatRepository.addMessage
        .mockResolvedValueOnce(createMessage({ content: 'Hello' }))
        .mockResolvedValueOnce(assistantMessage)
      mockChatRepository.getMessages.mockResolvedValue([])

      const result = await chatService.sendMessage({
        visitorId: 'visitor-123',
        ipHash: 'hash-123',
        message: 'Hello',
      })

      expect(result.sessionId).toBe(session.id)
      expect(result.message.role).toBe('assistant')
      expect(result.message.content).toBe('Hello! How can I help you?')
      expect(result.tokensUsed).toBe(50)
    })

    it('should create new session if none exists', async () => {
      const newSession = createSession()
      const assistantMessage = createMessage({ role: 'assistant' })

      mockChatRepository.findActiveSession.mockResolvedValue(null)
      mockChatRepository.createSession.mockResolvedValue(newSession)
      mockChatRepository.addMessage.mockResolvedValue(assistantMessage)
      mockChatRepository.getMessages.mockResolvedValue([])

      await chatService.sendMessage({
        visitorId: 'visitor-123',
        ipHash: 'hash-123',
        message: 'Hello',
        userAgent: 'Mozilla/5.0',
      })

      expect(mockChatRepository.createSession).toHaveBeenCalledWith({
        visitorId: 'visitor-123',
        ipHash: 'hash-123',
        userAgent: 'Mozilla/5.0',
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('chat:session_started', expect.any(Object))
    })

    it('should throw RateLimitError when rate limited', async () => {
      mockRateLimiter.consume.mockResolvedValue({
        allowed: false,
        remaining: 0,
        retryAfter: 60,
      })

      await expect(
        chatService.sendMessage({
          visitorId: 'visitor-123',
          ipHash: 'hash-123',
          message: 'Hello',
        })
      ).rejects.toThrow()

      expect(mockRateLimiter.emitRateLimitEvent).toHaveBeenCalled()
    })

    it('should emit chat:message_sent event', async () => {
      const session = createSession()
      const assistantMessage = createMessage({ id: 'msg_456', role: 'assistant', tokensUsed: 50 })

      mockChatRepository.findActiveSession.mockResolvedValue(session)
      mockChatRepository.addMessage.mockResolvedValue(assistantMessage)
      mockChatRepository.getMessages.mockResolvedValue([])

      await chatService.sendMessage({
        visitorId: 'visitor-123',
        ipHash: 'hash-123',
        message: 'Hello',
      })

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('chat:message_sent', {
        sessionId: session.id,
        messageId: assistantMessage.id,
        role: 'assistant',
        tokensUsed: 50,
      })
    })
  })

  // Note: listSessions tests are skipped because the method uses dynamic imports
  // for db and schema which are difficult to mock with vi.mock.
  // This would be better tested as an integration test.

  describe('getSession', () => {
    it('should return session with messages', async () => {
      const session = createSession()
      const messages = [
        createMessage({ role: 'user', content: 'Hello' }),
        createMessage({ id: 'msg_456', role: 'assistant', content: 'Hi there!' }),
      ]

      mockChatRepository.findSession.mockResolvedValue(session)
      mockChatRepository.getMessages.mockResolvedValue(messages)

      const result = await chatService.getSession('sess_123')

      expect(result).toEqual({
        ...session,
        messages,
      })
    })

    it('should throw NotFoundError when session not found', async () => {
      mockChatRepository.findSession.mockResolvedValue(null)

      await expect(chatService.getSession('sess_404')).rejects.toThrow()
    })
  })

  describe('endSession', () => {
    it('should end session and emit event', async () => {
      const session = createSession()
      mockChatRepository.findSession.mockResolvedValue(session)
      mockChatRepository.endSession.mockResolvedValue(true)
      mockChatRepository.getStats.mockResolvedValue({
        messageCount: 10,
        totalTokens: 500,
        durationMs: 60000,
      })

      const result = await chatService.endSession('sess_123')

      expect(result.success).toBe(true)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('chat:session_ended', {
        sessionId: 'sess_123',
        reason: 'user_ended',
        messageCount: 10,
        totalTokens: 500,
        durationMs: 60000,
      })
    })

    it('should throw NotFoundError when session not found', async () => {
      mockChatRepository.findSession.mockResolvedValue(null)

      await expect(chatService.endSession('sess_404')).rejects.toThrow()
    })

    it('should not emit event if endSession returns false', async () => {
      const session = createSession()
      mockChatRepository.findSession.mockResolvedValue(session)
      mockChatRepository.endSession.mockResolvedValue(false)

      const result = await chatService.endSession('sess_123')

      expect(result.success).toBe(false)
      expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(
        'chat:session_ended',
        expect.any(Object)
      )
    })

    it('should handle null stats', async () => {
      const session = createSession()
      mockChatRepository.findSession.mockResolvedValue(session)
      mockChatRepository.endSession.mockResolvedValue(true)
      mockChatRepository.getStats.mockResolvedValue(null)

      await chatService.endSession('sess_123')

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('chat:session_ended', {
        sessionId: 'sess_123',
        reason: 'user_ended',
        messageCount: 0,
        totalTokens: 0,
        durationMs: 0,
      })
    })
  })

  describe('tool execution error handling', () => {
    it('should continue conversation when tool throws unexpected error', async () => {
      const session = createSession()
      const assistantMessage = createMessage({
        id: 'msg_456',
        role: 'assistant',
        content: 'I encountered an error but can still help you.',
        tokensUsed: 60,
      })

      mockChatRepository.findActiveSession.mockResolvedValue(session)
      mockChatRepository.addMessage
        .mockResolvedValueOnce(createMessage({ content: 'Hello' }))
        .mockResolvedValueOnce(assistantMessage)
      mockChatRepository.getMessages.mockResolvedValue([])

      // First LLM call returns a tool call
      mockLLMProvider.sendMessage
        .mockResolvedValueOnce({
          content: '',
          tokensUsed: 30,
          model: 'gpt-4',
          tool_calls: [
            {
              id: 'call_123',
              type: 'function',
              function: {
                name: 'list_content',
                arguments: JSON.stringify({ type: 'project' }),
              },
            },
          ],
        })
        // Second LLM call after tool error returns final response
        .mockResolvedValueOnce({
          content: 'I encountered an error but can still help you.',
          tokensUsed: 30,
          model: 'gpt-4',
        })

      // Tool throws unexpected error
      mockExecuteToolCall.mockRejectedValue(new Error('Unexpected internal error'))

      const result = await chatService.sendMessage({
        visitorId: 'visitor-123',
        ipHash: 'hash-123',
        message: 'Hello',
      })

      // Verify chat continues without crashing
      expect(result.sessionId).toBe(session.id)
      expect(result.message.content).toBe('I encountered an error but can still help you.')
      expect(result.tokensUsed).toBe(60)

      // Verify error was logged
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
          toolName: 'list_content',
          toolId: 'call_123',
        }),
        'Unexpected error in tool execution'
      )
    })
  })
})
