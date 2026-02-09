import { EventEmitter } from 'events'
import type { EventMap, EventName } from './event-map'
import { logger } from '@/lib/logger'

type EventHandler<K extends EventName> = (data: EventMap[K]) => void | Promise<void>

/**
 * Type-safe event emitter wrapping Node.js EventEmitter.
 * Provides typed emit/on/once/off methods for application events.
 */
class TypedEventEmitter {
  private emitter = new EventEmitter()

  /**
   * Emit an event with typed payload.
   * Handlers are called asynchronously (fire-and-forget).
   */
  emit<K extends EventName>(event: K, data: EventMap[K]): boolean {
    logger.debug({ event, data }, 'Event emitted')
    return this.emitter.emit(event, data)
  }

  /**
   * Register a handler for an event.
   */
  on<K extends EventName>(event: K, handler: EventHandler<K>): this {
    this.emitter.on(event, async (data: EventMap[K]) => {
      try {
        await handler(data)
      } catch (error) {
        logger.error({ error: (error as Error).message, event }, 'Event handler error')
      }
    })
    return this
  }

  /**
   * Register a one-time handler for an event.
   */
  once<K extends EventName>(event: K, handler: EventHandler<K>): this {
    this.emitter.once(event, async (data: EventMap[K]) => {
      try {
        await handler(data)
      } catch (error) {
        logger.error({ error: (error as Error).message, event }, 'Event handler error')
      }
    })
    return this
  }

  /**
   * Remove a handler for an event.
   */
  off<K extends EventName>(event: K, handler: EventHandler<K>): this {
    this.emitter.off(event, handler as (...args: unknown[]) => void)
    return this
  }

  /**
   * Get the number of listeners for an event.
   */
  listenerCount(event: EventName): number {
    return this.emitter.listenerCount(event)
  }

  /**
   * Remove all listeners for an event or all events.
   */
  removeAllListeners(event?: EventName): this {
    this.emitter.removeAllListeners(event)
    return this
  }
}

export const eventEmitter = new TypedEventEmitter()
