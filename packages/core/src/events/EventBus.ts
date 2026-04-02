// packages/core/src/events/EventBus.ts

export type EventHandler<T = any> = (payload: T) => void | Promise<void>

/**
 * EventBus — iRAF cross-module event bus.
 *
 * Provides loose coupling between modules without direct imports.
 *
 * ```ts
 * // Subscribe
 * const unsubscribe = EventBus.on("order:created", ({ orderId }) => {
 *   console.log("New order", orderId)
 * })
 *
 * // Emit
 * await EventBus.emit("order:created", { orderId: "123" })
 *
 * // Unsubscribe
 * unsubscribe()
 * ```
 *
 * Built-in events:
 * - entity:saving  { entityClass, item, isNew }
 * - entity:saved   { entityClass, item, isNew }
 * - entity:deleting { entityClass, id }
 * - entity:deleted  { entityClass, id }
 * - auth:login     { user }
 * - auth:logout    {}
 */
export class EventBus {
  private static _handlers = new Map<string, Set<EventHandler>>()

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  static on<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set())
    }
    this._handlers.get(event)!.add(handler as EventHandler)
    return () => this.off(event, handler as EventHandler)
  }

  /**
   * Subscribe once: auto-unsubscribes after first trigger.
   */
  static once<T = any>(event: string, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = async (payload) => {
      this.off(event, wrapper as EventHandler)
      await handler(payload)
    }
    return this.on(event, wrapper)
  }

  /**
   * Emit an event. All handlers run in parallel and are awaited.
   */
  static async emit<T = any>(event: string, payload: T): Promise<void> {
    const handlers = this._handlers.get(event)
    if (!handlers || handlers.size === 0) return
    await Promise.all([...handlers].map((h) => h(payload)))
  }

  /**
   * Unsubscribe a specific handler.
   */
  static off(event: string, handler: EventHandler): void {
    this._handlers.get(event)?.delete(handler)
  }

  /**
   * Clear all subscriptions (mainly for tests).
   */
  static clear(): void {
    this._handlers.clear()
  }
}

// ─── Built-in event types (for TypeScript reference) ─────────────────────────

export interface EntitySavingPayload {
  entityClass: Function
  item: Record<string, any>
  isNew: boolean
}

export interface EntitySavedPayload {
  entityClass: Function
  item: Record<string, any>
  isNew: boolean
}

export interface EntityDeletingPayload {
  entityClass: Function
  id: string
}

export interface EntityDeletedPayload {
  entityClass: Function
  id: string
}

export interface AuthLoginPayload {
  user: { id: string; name: string; roles: string[] }
}

/** Built-in event key constants */
export const EVENTS = {
  ENTITY_SAVING: "entity:saving",
  ENTITY_SAVED: "entity:saved",
  ENTITY_DELETING: "entity:deleting",
  ENTITY_DELETED: "entity:deleted",
  AUTH_LOGIN: "auth:login",
  AUTH_LOGOUT: "auth:logout",
} as const
