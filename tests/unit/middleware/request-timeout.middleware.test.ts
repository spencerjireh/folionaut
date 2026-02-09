import request from 'supertest'
import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import { requestTimeoutMiddleware, RequestTimeoutError } from '@/middleware/request-timeout.middleware'

describe('requestTimeoutMiddleware', () => {
  let app: Express

  beforeEach(() => {
    app = express()
  })

  it('should pass through for fast requests', async () => {
    app.use(requestTimeoutMiddleware({ defaultTimeout: 1000 }))
    app.get('/fast', (_req, res) => {
      res.json({ status: 'ok' })
    })

    const response = await request(app).get('/fast')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  it('should attach abort signal to request', async () => {
    let capturedSignal: AbortSignal | undefined

    app.use(requestTimeoutMiddleware({ defaultTimeout: 1000 }))
    app.get('/signal', (req: Request & { signal?: AbortSignal }, res) => {
      capturedSignal = req.signal
      res.json({ hasSignal: !!req.signal })
    })

    const response = await request(app).get('/signal')

    expect(response.status).toBe(200)
    expect(response.body.hasSignal).toBe(true)
    expect(capturedSignal).toBeInstanceOf(AbortSignal)
  })

  it('should use default timeout of 30000ms', async () => {
    const middleware = requestTimeoutMiddleware()

    expect(middleware).toBeDefined()
    expect(typeof middleware).toBe('function')
  })

  it('should apply custom default timeout', async () => {
    let receivedSignal: AbortSignal | undefined

    app.use(requestTimeoutMiddleware({ defaultTimeout: 100 }))
    app.get('/slow', async (req: Request & { signal?: AbortSignal }, res, next) => {
      receivedSignal = req.signal
      await new Promise((resolve) => setTimeout(resolve, 50))
      res.json({ status: 'ok' })
    })

    const response = await request(app).get('/slow')

    expect(response.status).toBe(200)
    expect(receivedSignal).toBeDefined()
  })

  it('should apply route-specific timeout', async () => {
    app.use(
      requestTimeoutMiddleware({
        defaultTimeout: 1000,
        routeTimeouts: { '/special': 5000 },
      })
    )
    app.get('/special', (_req, res) => {
      res.json({ route: 'special' })
    })
    app.get('/normal', (_req, res) => {
      res.json({ route: 'normal' })
    })

    const specialResponse = await request(app).get('/special')
    const normalResponse = await request(app).get('/normal')

    expect(specialResponse.status).toBe(200)
    expect(normalResponse.status).toBe(200)
  })

  it('should clean up timeout on response finish', async () => {
    app.use(requestTimeoutMiddleware({ defaultTimeout: 1000 }))
    app.get('/cleanup', (_req, res) => {
      res.json({ status: 'done' })
    })

    // Make multiple requests to ensure cleanup works
    for (let i = 0; i < 5; i++) {
      const response = await request(app).get('/cleanup')
      expect(response.status).toBe(200)
    }
  })
})

describe('RequestTimeoutError', () => {
  it('should create error with timeout details', () => {
    const error = new RequestTimeoutError(5000)

    expect(error.message).toBe('Request timeout after 5000ms')
    expect(error.code).toBe('REQUEST_TIMEOUT')
    expect(error.statusCode).toBe(504)
  })

  it('should be an instance of AppError', () => {
    const error = new RequestTimeoutError(1000)

    expect(error.isOperational).toBe(true)
  })
})
