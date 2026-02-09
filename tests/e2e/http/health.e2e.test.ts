import { api } from '../helpers/e2e-client'

describe('Health endpoints (E2E)', () => {
  it('GET / returns 200 with status ok', async () => {
    const res = await api().get('/')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('GET /api/health/live returns 200', async () => {
    const res = await api().get('/api/health/live')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('GET /api/health/ready returns database check', async () => {
    const res = await api().get('/api/health/ready')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ready')
    expect(res.body.checks).toHaveProperty('database', 'ok')
  })

  it('GET /api/health/startup returns uptime, version, and environment', async () => {
    const res = await api().get('/api/health/startup')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('started')
    expect(typeof res.body.uptime).toBe('number')
    expect(res.body).toHaveProperty('version')
    expect(res.body.environment).toBe('test')
  })
})
