import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client'

export const registry = new Registry()

// HTTP Metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [registry],
})

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [registry],
})

// Chat Metrics
export const chatMessagesTotal = new Counter({
  name: 'chat_messages_total',
  help: 'Total chat messages',
  labelNames: ['role'], // user, assistant
  registers: [registry],
})

export const chatTokensTotal = new Counter({
  name: 'chat_tokens_total',
  help: 'Total tokens used in chat',
  registers: [registry],
})

export const chatSessionsActive = new Gauge({
  name: 'chat_sessions_active',
  help: 'Number of active chat sessions',
  registers: [registry],
})

// LLM Metrics
export const llmRequestsTotal = new Counter({
  name: 'llm_requests_total',
  help: 'Total LLM API requests',
  labelNames: ['model', 'status'], // status: success, error
  registers: [registry],
})

export const llmRequestDuration = new Histogram({
  name: 'llm_request_duration_seconds',
  help: 'LLM request duration in seconds',
  labelNames: ['model'],
  buckets: [0.5, 1, 2, 5, 10, 30],
  registers: [registry],
})

// Circuit Breaker Metrics
export const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half_open)',
  labelNames: ['name'],
  registers: [registry],
})

// Rate Limiter Metrics
export const rateLimitHitsTotal = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total rate limit rejections',
  registers: [registry],
})

// Cache Metrics
export const cacheOperationsTotal = new Counter({
  name: 'cache_operations_total',
  help: 'Total cache operations',
  labelNames: ['operation', 'result'], // operation: get/set/del, result: hit/miss/success
  registers: [registry],
})

// Initialize default Node.js metrics
export function initializeMetrics(): void {
  collectDefaultMetrics({ register: registry })
}
