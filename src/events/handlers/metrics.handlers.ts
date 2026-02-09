import { eventEmitter } from '@/events'
import {
  chatMessagesTotal,
  chatTokensTotal,
  chatSessionsActive,
  circuitBreakerState,
  rateLimitHitsTotal,
} from '@/observability'
import { logger } from '@/lib/logger'

const CIRCUIT_STATE_VALUES: Record<string, number> = {
  closed: 0,
  open: 1,
  half_open: 2,
}

let metricsHandlersRegistered = false
export function registerMetricsHandlers(): void {
  if (metricsHandlersRegistered) return
  metricsHandlersRegistered = true

  // Chat message sent
  eventEmitter.on('chat:message_sent', (data) => {
    chatMessagesTotal.inc({ role: data.role })
    if (data.tokensUsed > 0) {
      chatTokensTotal.inc(data.tokensUsed)
    }
  })

  // Chat session started
  eventEmitter.on('chat:session_started', () => {
    chatSessionsActive.inc()
  })

  // Chat session ended
  eventEmitter.on('chat:session_ended', () => {
    chatSessionsActive.dec()
  })

  // Rate limited
  eventEmitter.on('chat:rate_limited', () => {
    rateLimitHitsTotal.inc()
  })

  // Circuit breaker state change
  eventEmitter.on('circuit:state_changed', (data) => {
    const stateValue = CIRCUIT_STATE_VALUES[data.newState] ?? 0
    circuitBreakerState.set({ name: data.name }, stateValue)
  })

  logger.info('Metrics handlers registered')
}
