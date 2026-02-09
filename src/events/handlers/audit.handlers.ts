import { eventEmitter } from '@/events'
import { logger } from '@/lib/logger'

/**
 * Register audit logging handlers for application events.
 */
let auditHandlersRegistered = false
export function registerAuditHandlers(): void {
  if (auditHandlersRegistered) return
  auditHandlersRegistered = true

  // Content mutation events
  eventEmitter.on('content:created', (data) => {
    logger.info(
      {
        audit: true,
        action: 'content:created',
        contentId: data.id,
        contentType: data.type,
        slug: data.slug,
        version: data.version,
        changedBy: data.changedBy,
        timestamp: new Date().toISOString(),
      },
      `Audit: content:created - ${data.type}/${data.slug}`
    )
  })

  eventEmitter.on('content:updated', (data) => {
    logger.info(
      {
        audit: true,
        action: 'content:updated',
        contentId: data.id,
        contentType: data.type,
        version: data.version,
        previousVersion: data.previousVersion,
        changedFields: data.changedFields,
        changedBy: data.changedBy,
        timestamp: new Date().toISOString(),
      },
      `Audit: content:updated - ${data.id} v${data.previousVersion} -> v${data.version}`
    )
  })

  eventEmitter.on('content:deleted', (data) => {
    logger.info(
      {
        audit: true,
        action: 'content:deleted',
        contentId: data.id,
        contentType: data.type,
        hard: data.hard,
        changedBy: data.changedBy,
        timestamp: new Date().toISOString(),
      },
      `Audit: content:deleted - ${data.id} (hard: ${data.hard})`
    )
  })

  eventEmitter.on('content:restored', (data) => {
    logger.info(
      {
        audit: true,
        action: 'content:restored',
        contentId: data.id,
        contentType: data.type,
        fromVersion: data.fromVersion,
        toVersion: data.toVersion,
        changedBy: data.changedBy,
        timestamp: new Date().toISOString(),
      },
      `Audit: content:restored - ${data.id} v${data.fromVersion} -> v${data.toVersion}`
    )
  })

  // Admin action events
  eventEmitter.on('admin:action', (data) => {
    logger.info(
      {
        audit: true,
        action: `admin:${data.action}`,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        changes: data.changes,
        adminId: data.adminId,
        timestamp: new Date().toISOString(),
      },
      `Audit: admin:${data.action} - ${data.resourceType}/${data.resourceId}`
    )
  })

  // Rate limit events
  eventEmitter.on('chat:rate_limited', (data) => {
    logger.warn(
      {
        audit: true,
        action: 'chat:rate_limited',
        ipHash: data.ipHash,
        sessionId: data.sessionId,
        retryAfter: data.retryAfter,
        timestamp: new Date().toISOString(),
      },
      `Audit: chat:rate_limited - retryAfter: ${data.retryAfter}s`
    )
  })

  // Circuit breaker events
  eventEmitter.on('circuit:state_changed', (data) => {
    logger.warn(
      {
        audit: true,
        action: 'circuit:state_changed',
        circuitName: data.name,
        previousState: data.previousState,
        newState: data.newState,
        failureCount: data.failureCount,
        timestamp: new Date().toISOString(),
      },
      `Audit: circuit:state_changed - ${data.name}: ${data.previousState} -> ${data.newState}`
    )
  })

  // Chat session events
  eventEmitter.on('chat:session_started', (data) => {
    logger.info(
      {
        audit: true,
        action: 'chat:session_started',
        sessionId: data.sessionId,
        visitorId: data.visitorId,
        ipHash: data.ipHash,
        timestamp: new Date().toISOString(),
      },
      `Audit: chat:session_started - ${data.sessionId}`
    )
  })

  eventEmitter.on('chat:session_ended', (data) => {
    logger.info(
      {
        audit: true,
        action: 'chat:session_ended',
        sessionId: data.sessionId,
        reason: data.reason,
        messageCount: data.messageCount,
        totalTokens: data.totalTokens,
        durationMs: data.durationMs,
        timestamp: new Date().toISOString(),
      },
      `Audit: chat:session_ended - ${data.sessionId} (${data.reason})`
    )
  })

  logger.info('Audit handlers registered')
}
