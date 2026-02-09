import cors from 'cors'
import { env } from '@/config/env'

export function corsMiddleware() {
  const origins = env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',').map((origin) => origin.trim()) : []

  return cors({
    origin: origins.length > 0 ? origins : false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Admin-Key',
      'Idempotency-Key',
    ],
    exposedHeaders: ['X-Request-Id', 'X-Idempotent-Replayed'],
    credentials: true,
    maxAge: 86400,
  })
}
