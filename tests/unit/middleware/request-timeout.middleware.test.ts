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
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    app.use(requestTimeoutMiddleware())
    app.get('/default', (_req, res) => {
      res.json({ status: 'ok' })
    })

    await request(app).get('/default')

    const timeoutCall = setTimeoutSpy.mock.calls.find((call) => call[1] === 30000)
    expect(timeoutCall).toBeDefined()

    setTimeoutSpy.mockRestore()
  })

  it('should apply custom default timeout', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    app.use(requestTimeoutMiddleware({ defaultTimeout: 100 }))
    app.get('/slow', async (_req: Request, res) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      res.json({ status: 'ok' })
    })

    const response = await request(app).get('/slow')

    expect(response.status).toBe(200)
    const timeoutCall = setTimeoutSpy.mock.calls.find((call) => call[1] === 100)
    expect(timeoutCall).toBeDefined()

    setTimeoutSpy.mockRestore()
  })

  it('should apply route-specific timeout', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

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

    await request(app).get('/special')
    const specialCall = setTimeoutSpy.mock.calls.find((call) => call[1] === 5000)
    expect(specialCall).toBeDefined()

    await request(app).get('/normal')
    const normalCall = setTimeoutSpy.mock.calls.find((call) => call[1] === 1000)
    expect(normalCall).toBeDefined()

    setTimeoutSpy.mockRestore()
  })

  it('should clean up timeout on response finish', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    app.use(requestTimeoutMiddleware({ defaultTimeout: 1000 }))
    app.get('/cleanup', (_req, res) => {
      res.json({ status: 'done' })
    })

    await request(app).get('/cleanup')

    expect(clearTimeoutSpy).toHaveBeenCalled()

    clearTimeoutSpy.mockRestore()
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
