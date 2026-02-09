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
    setNextResponses([textResponse('IP1'), textResponse('IP2')])

    const res1 = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', '10.0.1.1')
      .send({ message: 'Hi', visitorId: 'ip1-visitor' })

    const res2 = await api()
      .post('/api/v1/chat')
      .set('X-Forwarded-For', '10.0.1.2')
      .send({ message: 'Hi', visitorId: 'ip2-visitor' })

    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
  })
})
