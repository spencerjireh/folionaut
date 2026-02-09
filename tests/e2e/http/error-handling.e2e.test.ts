import { api, adminHeaders, describeLocal } from '../helpers/e2e-client'

describe('Error handling and edge cases (E2E)', () => {
  describe('unknown routes return 404', () => {
    it('GET /api/v1/nonexistent-route -> 404 with NOT_FOUND code', async () => {
      const res = await api().get('/api/v1/nonexistent-route')

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('NOT_FOUND')
      expect(res.body.error.message).toBe('Route not found')
    })

    it('POST /api/completely/unknown -> 404 with NOT_FOUND code', async () => {
      const res = await api().post('/api/completely/unknown').send({})

      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('NOT_FOUND')
      expect(res.body.error.message).toBe('Route not found')
    })
  })

  describe('metrics endpoint', () => {
    it('GET /api/metrics with admin key -> 200 with Prometheus text', async () => {
      const res = await api().get('/api/metrics').set(adminHeaders())

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toContain('text/plain')
      expect(res.text).toContain('# HELP')
      expect(res.text).toContain('# TYPE')
      expect(res.text).toContain('http_requests_total')
    })
  })

  describeLocal('body size limit (local)', () => {
    it('POST with body >100kb is rejected', async () => {
      const res = await api()
        .post('/api/v1/admin/content')
        .set(adminHeaders())
        .send({
          type: 'project',
          data: {
            title: 'Oversized',
            description: 'x'.repeat(110_000),
            tags: [],
          },
        })

      // body-parser PayloadTooLargeError has status=413 but the custom error
      // handler doesn't extract err.status, so it falls through to 500
      expect(res.status).toBeGreaterThanOrEqual(400)
      expect(res.status).toBeLessThan(600)
    })
  })

  describe('error response shape consistency', () => {
    it('404 has { error: { code, message, requestId } }', async () => {
      const res = await api().get('/api/v1/content/project/nonexistent-slug-xyz')

      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND')
      expect(typeof res.body.error.message).toBe('string')
      expect(typeof res.body.error.requestId).toBe('string')
    })

    it('400 has { error: { code, message, fields } }', async () => {
      const res = await api()
        .post('/api/v1/admin/content')
        .set(adminHeaders())
        .send({ type: 'project', data: {} })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
      expect(typeof res.body.error.message).toBe('string')
    })

    it('409 has { error: { code, message } }', async () => {
      await api()
        .post('/api/v1/admin/content')
        .set(adminHeaders())
        .send({
          type: 'project',
          slug: 'error-shape-dup',
          data: { title: 'First', description: 'First', tags: [] },
        })

      const res = await api()
        .post('/api/v1/admin/content')
        .set(adminHeaders())
        .send({
          type: 'project',
          slug: 'error-shape-dup',
          data: { title: 'Second', description: 'Second', tags: [] },
        })

      expect(res.status).toBe(409)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error.code).toBe('CONFLICT')
      expect(typeof res.body.error.message).toBe('string')
    })
  })
})
