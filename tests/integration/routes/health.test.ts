import request from 'supertest'
import express, { type Express } from 'express'

const { mockExecute } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
}))
vi.mock('@/db/client', () => ({
  client: {
    execute: mockExecute,
  },
}))

// Mock env
vi.mock('@/config/env', () => ({
  env: {
    NODE_ENV: 'test',
  },
}))

describe('Health Routes', () => {
  let app: Express

  beforeEach(async () => {
    vi.clearAllMocks()
    mockExecute.mockResolvedValue({ rows: [{ '1': 1 }] })

    // Dynamic import to apply mocks
    const { healthRouter } = await import('@/routes/health.routes')

    app = express()
    app.use('/health', healthRouter)
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('GET /health/live', () => {
    it('should return ok status', async () => {
      const response = await request(app).get('/health/live')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ status: 'ok' })
    })

    it('should have correct content-type', async () => {
      const response = await request(app).get('/health/live')

      expect(response.headers['content-type']).toMatch(/application\/json/)
    })
  })

  describe('GET /health/ready', () => {
    it('should return ready when database is healthy', async () => {
      mockExecute.mockResolvedValue({ rows: [{ '1': 1 }] })

      const response = await request(app).get('/health/ready')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        status: 'ready',
        checks: {
          database: 'ok',
        },
      })
    })

    it('should return degraded when database check fails', async () => {
      mockExecute.mockRejectedValue(new Error('Database connection failed'))

      const response = await request(app).get('/health/ready')

      expect(response.status).toBe(503)
      expect(response.body).toEqual({
        status: 'degraded',
        checks: {
          database: 'error',
        },
      })
    })

    it('should execute SELECT 1 to check database', async () => {
      await request(app).get('/health/ready')

      expect(mockExecute).toHaveBeenCalledWith('SELECT 1')
    })
  })

  describe('GET /health/startup', () => {
    it('should return startup information', async () => {
      const response = await request(app).get('/health/startup')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'started')
      expect(response.body).toHaveProperty('uptime')
      expect(response.body).toHaveProperty('version')
      expect(response.body).toHaveProperty('environment', 'test')
    })

    it('should return uptime as a number', async () => {
      const response = await request(app).get('/health/startup')

      expect(typeof response.body.uptime).toBe('number')
      expect(response.body.uptime).toBeGreaterThanOrEqual(0)
    })

    it('should return environment from env config', async () => {
      const response = await request(app).get('/health/startup')

      expect(response.body.environment).toBe('test')
    })
  })
})
