import pino from 'pino'
import pinoHttp from 'pino-http'
import { env } from '@/config/env'
import { getRequestContext } from '@/middleware/request-context.middleware'

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: {
    pid: process.pid,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    const context = getRequestContext()
    return context?.requestId ?? (req.headers['x-request-id'] as string) ?? crypto.randomUUID()
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`
  },
  customErrorMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`
  },
})
