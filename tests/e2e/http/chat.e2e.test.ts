import { api, adminHeaders, describeLocal } from '../helpers/e2e-client'
import {
  setNextResponses,
  textResponse,
  toolCallResponse,
} from '../helpers/mock-llm-server'

let ipCounter = 0
function uniqueIp(): string {
  return `10.99.${Math.floor(ipCounter / 256)}.${ipCounter++ % 256}`
}

describeLocal('Chat endpoints (E2E - local)', () => {
  it('basic message returns 200 with sessionId, message, and tokensUsed', async () => {
    setNextResponses([textResponse('Hello from the assistant!')])

    const res = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', uniqueIp())
      .send({ message: 'Hello', visitorId: 'visitor-1' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('sessionId')
    expect(res.body.sessionId).toMatch(/^sess_/)
    expect(res.body.message).toHaveProperty('content')
    expect(res.body.message.role).toBe('assistant')
    expect(typeof res.body.tokensUsed).toBe('number')
  })

  it('same visitorId returns the same sessionId', async () => {
    setNextResponses([textResponse('First'), textResponse('Second')])
    const ip = uniqueIp()

    const res1 = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', ip)
      .send({ message: 'First', visitorId: 'visitor-same' })

    const res2 = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', ip)
      .send({ message: 'Second', visitorId: 'visitor-same' })

    expect(res1.body.sessionId).toBe(res2.body.sessionId)
  })

  it('different visitorId creates new session', async () => {
    setNextResponses([textResponse('A'), textResponse('B')])

    const res1 = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', uniqueIp())
      .send({ message: 'Hi', visitorId: 'visitor-a' })

    const res2 = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', uniqueIp())
      .send({ message: 'Hi', visitorId: 'visitor-b' })

    expect(res1.body.sessionId).not.toBe(res2.body.sessionId)
  })

  describe('validation', () => {
    it('missing message returns 400', async () => {
      const res = await api()
        .post('/api/v1/chat')
        .set('X-Forwarded-For', uniqueIp())
        .send({ visitorId: 'visitor-val' })
      expect(res.status).toBe(400)
    })

    it('empty message returns 400', async () => {
      const res = await api()
        .post('/api/v1/chat')
        .set('X-Forwarded-For', uniqueIp())
        .send({ message: '', visitorId: 'visitor-val' })
      expect(res.status).toBe(400)
    })

    it('message too long returns 400', async () => {
      const res = await api()
        .post('/api/v1/chat')
        .set('X-Forwarded-For', uniqueIp())
        .send({ message: 'x'.repeat(2001), visitorId: 'visitor-val' })
      expect(res.status).toBe(400)
    })
  })

  it('mock LLM returns tool call -> chat handles tool loop and returns final response', async () => {
    // First response: tool call. Second response: final text.
    setNextResponses([
      toolCallResponse([
        {
          id: 'call_001',
          name: 'list_content',
          arguments: { type: 'project' },
        },
      ]),
      textResponse('Here are the projects from the tool results.'),
    ])

    const res = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', uniqueIp())
      .send({ message: 'What projects do you have?', visitorId: 'visitor-tool' })

    expect(res.status).toBe(200)
    expect(res.body.message.content).toContain('projects')
  })

  it('?includeToolCalls=true returns toolCalls array', async () => {
    setNextResponses([
      toolCallResponse([
        { id: 'call_002', name: 'list_content', arguments: { type: 'skill' } },
      ]),
      textResponse('Skills response.'),
    ])

    const res = await api()
      .post('/api/v1/chat?includeToolCalls=true')
      .set('X-Forwarded-For', uniqueIp())
      .send({ message: 'What skills?', visitorId: 'visitor-tc' })

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.toolCalls)).toBe(true)
    expect(res.body.toolCalls.length).toBeGreaterThan(0)
    expect(res.body.toolCalls[0]).toHaveProperty('name', 'list_content')
  })

  it('message history accumulates across multiple exchanges', async () => {
    setNextResponses([textResponse('First reply'), textResponse('Second reply')])
    const ip = uniqueIp()
    const visitorId = 'visitor-accumulate'

    const res1 = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', ip)
      .send({ message: 'First message', visitorId })
    expect(res1.status).toBe(200)
    const sessionId = res1.body.sessionId

    const res2 = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', ip)
      .send({ message: 'Second message', visitorId })
    expect(res2.status).toBe(200)
    expect(res2.body.sessionId).toBe(sessionId)

    // Verify accumulated messages via admin endpoint
    const sessionRes = await api()
      .get(`/api/v1/admin/chat/sessions/${sessionId}`)
      .set(adminHeaders())
    expect(sessionRes.status).toBe(200)
    expect(sessionRes.body.data.messages.length).toBeGreaterThanOrEqual(4)

    const roles = sessionRes.body.data.messages.map((m: { role: string }) => m.role)
    const userCount = roles.filter((r: string) => r === 'user').length
    const assistantCount = roles.filter((r: string) => r === 'assistant').length
    expect(userCount).toBeGreaterThanOrEqual(2)
    expect(assistantCount).toBeGreaterThanOrEqual(2)
  })

  describe('admin chat routes', () => {
    it('list sessions, get session with messages, delete session', async () => {
      setNextResponses([textResponse('Admin test response')])

      // Create a chat session
      const chatRes = await api()
        .post('/api/v1/chat')
        .set('X-Forwarded-For', uniqueIp())
        .send({ message: 'For admin', visitorId: 'visitor-admin-test' })

      const sessionId = chatRes.body.sessionId

      // List sessions
      const listRes = await api()
        .get('/api/v1/admin/chat/sessions')
        .set(adminHeaders())
      expect(listRes.status).toBe(200)
      expect(Array.isArray(listRes.body.data)).toBe(true)
      const sessionIds = listRes.body.data.map((s: { id: string }) => s.id)
      expect(sessionIds).toContain(sessionId)

      // Get session with messages
      const getRes = await api()
        .get(`/api/v1/admin/chat/sessions/${sessionId}`)
        .set(adminHeaders())
      expect(getRes.status).toBe(200)
      expect(getRes.body.data.id).toBe(sessionId)
      expect(Array.isArray(getRes.body.data.messages)).toBe(true)
      expect(getRes.body.data.messages.length).toBeGreaterThanOrEqual(2) // user + assistant

      // Delete (end) session
      const deleteRes = await api()
        .delete(`/api/v1/admin/chat/sessions/${sessionId}`)
        .set(adminHeaders())
      expect(deleteRes.status).toBe(200)
      expect(deleteRes.body.success).toBe(true)
    })

    it('status filter distinguishes active vs ended sessions', async () => {
      setNextResponses([textResponse('Session for filtering')])

      // Create a session
      const chatRes = await api()
        .post('/api/v1/chat')
        .set('X-Forwarded-For', uniqueIp())
        .send({ message: 'Filter test', visitorId: 'visitor-filter-status' })
      const sessionId = chatRes.body.sessionId

      // End the session
      await api()
        .delete(`/api/v1/admin/chat/sessions/${sessionId}`)
        .set(adminHeaders())

      // Ended filter should contain it
      const endedRes = await api()
        .get('/api/v1/admin/chat/sessions?status=ended')
        .set(adminHeaders())
      expect(endedRes.status).toBe(200)
      const endedIds = endedRes.body.data.map((s: { id: string }) => s.id)
      expect(endedIds).toContain(sessionId)

      // Active filter should not contain it
      const activeRes = await api()
        .get('/api/v1/admin/chat/sessions?status=active')
        .set(adminHeaders())
      expect(activeRes.status).toBe(200)
      const activeIds = activeRes.body.data.map((s: { id: string }) => s.id)
      expect(activeIds).not.toContain(sessionId)
    })
  })
})
