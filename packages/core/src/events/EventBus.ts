// packages/core/src/events/EventBus.ts

export type EventHandler<T = any> = (payload: T) => void | Promise<void>

/**
 * EventBus — iRAF 跨模組事件匯流排。
 *
 * 提供模組間鬆耦合通訊，不需要直接 import 彼此。
 *
 * ```ts
 * // 訂閱
 * const unsubscribe = EventBus.on("order:created", ({ orderId }) => {
 *   console.log("新訂單", orderId)
 * })
 *
 * // 發射
 * await EventBus.emit("order:created", { orderId: "123" })
 *
 * // 取消訂閱
 * unsubscribe()
 * ```
 *
 * 內建事件：
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
   * 訂閱事件。回傳取消訂閱函式。
   */
  static on<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set())
    }
    this._handlers.get(event)!.add(handler as EventHandler)
    return () => this.off(event, handler as EventHandler)
  }

  /**
   * 一次性訂閱：觸發一次後自動取消。
   */
  static once<T = any>(event: string, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = async (payload) => {
      this.off(event, wrapper as EventHandler)
      await handler(payload)
    }
    return this.on(event, wrapper)
  }

  /**
   * 發射事件。所有 handler 平行執行，等待全部完成。
   */
  static async emit<T = any>(event: string, payload: T): Promise<void> {
    const handlers = this._handlers.get(event)
    if (!handlers || handlers.size === 0) return
    await Promise.all([...handlers].map((h) => h(payload)))
  }

  /**
   * 取消訂閱指定 handler。
   */
  static off(event: string, handler: EventHandler): void {
    this._handlers.get(event)?.delete(handler)
  }

  /**
   * 清除所有訂閱（主要用於測試）。
   */
  static clear(): void {
    this._handlers.clear()
  }
}

// ─── 內建事件型別（供 TypeScript 使用者參考） ──────────────────────────────────

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

/** 內建事件 key 常數 */
export const EVENTS = {
  ENTITY_SAVING: "entity:saving",
  ENTITY_SAVED: "entity:saved",
  ENTITY_DELETING: "entity:deleting",
  ENTITY_DELETED: "entity:deleted",
  AUTH_LOGIN: "auth:login",
  AUTH_LOGOUT: "auth:logout",
} as const
