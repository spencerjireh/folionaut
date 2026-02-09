import { api, describeLocal } from '../helpers/e2e-client'
import { setNextResponses, textResponse } from '../helpers/mock-llm-server'

describeLocal('Rate limiting (E2E - local)', () => {
  it('exceeding rate limit returns 429', async () => {
    // RATE_LIMIT_CAPACITY is 5 in e2e-setup
    const capacity = 5
    const totalRequests = capacity + 1

    // Queue enough responses for all requests
    const responses = Array.from({ length: totalRequests }, (_, i) =>
      textResponse(`Response ${i}`)
    )
    setNextResponses(responses)

    const results: number[] = []

    for (let i = 0; i < totalRequests; i++) {
      const res = await api()
        .post('/api/v1/chat')
        .set('X-Forwarded-For', '10.0.0.99')
        .send({ message: `Message ${i}`, visitorId: `rate-limit-visitor-${i}` })
      results.push(res.status)
    }

    // At least the last request should be 429
    expect(results).toContain(429)
    // First requests should succeed
    expect(results[0]).toBe(200)
  })

  it('different IPs have independent rate limits', async () => {
    const capacity = 5
    const ip1 = '10.0.1.10'
    const ip2 = '10.0.1.11'

    // Exhaust IP1's bucket
    const ip1Responses = Array.from({ length: capacity + 1 }, (_, i) =>
      textResponse(`IP1-${i}`)
    )
    setNextResponses(ip1Responses)

    for (let i = 0; i < capacity + 1; i++) {
      await api()
        .post('/api/v1/chat')
        .set('X-Forwarded-For', ip1)
        .send({ message: `Msg ${i}`, visitorId: `ip1-visitor-${i}` })
    }

    // Confirm IP1 is rate limited
    setNextResponses([textResponse('IP1-extra')])
    const ip1Res = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', ip1)
      .send({ message: 'One more', visitorId: 'ip1-visitor-extra' })
    expect(ip1Res.status).toBe(429)

    // IP2 should still work
    setNextResponses([textResponse('IP2')])
    const ip2Res = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', ip2)
      .send({ message: 'Hi', visitorId: 'ip2-visitor' })
    expect(ip2Res.status).toBe(200)
  })
})
