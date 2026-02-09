import { api, describeLocal } from '../helpers/e2e-client'
import { setNextResponses, textResponse } from '../helpers/mock-llm-server'

describeLocal('Content rate limiting (E2E - local)', () => {
  it('exceeding content rate limit returns 429', async () => {
    // CONTENT_RATE_LIMIT_CAPACITY is 10 in e2e-setup
    const capacity = 10
    const totalRequests = capacity + 1

    const results: number[] = []

    for (let i = 0; i < totalRequests; i++) {
      const res = await api()
        .get('/api/v1/content')
        .set('X-Forwarded-For', '10.20.0.1')
      results.push(res.status)
    }

    // At least the last request should be 429
    expect(results).toContain(429)
    // First request should succeed
    expect(results[0]).toBe(200)
  })

  it('different IPs have independent content rate limits', async () => {
    const capacity = 10
    const ip1 = '10.20.1.10'
    const ip2 = '10.20.1.11'

    // Exhaust IP1's content rate limit
    for (let i = 0; i < capacity; i++) {
      await api()
        .get('/api/v1/content')
        .set('X-Forwarded-For', ip1)
    }

    // Confirm IP1 is rate limited
    const ip1Res = await api()
      .get('/api/v1/content')
      .set('X-Forwarded-For', ip1)
    expect(ip1Res.status).toBe(429)

    // IP2 should still work
    const ip2Res = await api()
      .get('/api/v1/content')
      .set('X-Forwarded-For', ip2)
    expect(ip2Res.status).toBe(200)
  })

  it('content and chat rate limits are independent', async () => {
    const ip = '10.20.2.1'

    // Exhaust content rate limit (capacity=10)
    for (let i = 0; i < 10; i++) {
      await api()
        .get('/api/v1/content')
        .set('X-Forwarded-For', ip)
    }

    // Content should be rate limited
    const contentRes = await api()
      .get('/api/v1/content')
      .set('X-Forwarded-For', ip)
    expect(contentRes.status).toBe(429)

    // Chat should still work (separate bucket)
    setNextResponses([textResponse('Hello')])
    const chatRes = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', ip)
      .send({ message: 'Hi', visitorId: 'visitor-rate-test' })
    expect(chatRes.status).toBe(200)
  })
})
