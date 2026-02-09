import { eventEmitter } from '@/events'
import { getCache, CacheKeys } from '@/cache'
import { logger } from '@/lib/logger'
import type {
  ContentCreatedEvent,
  ContentUpdatedEvent,
  ContentDeletedEvent,
  ContentRestoredEvent,
} from '@/events/event-map'

/**
 * Invalidate cache entries related to content changes.
 */
async function invalidateContentCache(
  event: ContentCreatedEvent | ContentUpdatedEvent | ContentDeletedEvent | ContentRestoredEvent,
  reason: string
): Promise<void> {
  try {
    const cache = getCache()
    let totalDeleted = 0

    // Delete content list cache
    const listPattern = `${CacheKeys.CONTENT_LIST}:*`
    const listDeleted = await cache.delPattern(listPattern)
    totalDeleted += listDeleted

    // Delete content bundle cache
    await cache.del(CacheKeys.CONTENT_BUNDLE)
    totalDeleted++

    // Delete specific content item cache
    const itemPattern = `${CacheKeys.CONTENT_ITEM}:${event.type}:*`
    const itemDeleted = await cache.delPattern(itemPattern)
    totalDeleted += itemDeleted

    logger.debug(
      {
        pattern: `${listPattern}, ${CacheKeys.CONTENT_BUNDLE}, ${itemPattern}`,
        keysDeleted: totalDeleted,
      },
      'Cache invalidated'
    )

    eventEmitter.emit('cache:invalidated', {
      pattern: `content:*:${event.type}`,
      keysDeleted: totalDeleted,
      reason,
    })
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to invalidate cache')
  }
}

/**
 * Register cache invalidation handlers for content events.
 */
let cacheHandlersRegistered = false
export function registerCacheHandlers(): void {
  if (cacheHandlersRegistered) return
  cacheHandlersRegistered = true

  eventEmitter.on('content:created', async (data) => {
    await invalidateContentCache(data, `Content created: ${data.id}`)
  })

  eventEmitter.on('content:updated', async (data) => {
    await invalidateContentCache(data, `Content updated: ${data.id}`)
  })

  eventEmitter.on('content:deleted', async (data) => {
    await invalidateContentCache(data, `Content deleted: ${data.id}`)
  })

  eventEmitter.on('content:restored', async (data) => {
    await invalidateContentCache(data, `Content restored: ${data.id}`)
  })

  logger.info('Cache invalidation handlers registered')
}
