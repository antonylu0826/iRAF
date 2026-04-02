/**
 * ServiceRegistry — iRAF 非 UI 服務容器。
 *
 * 管理可替換的「服務」（與 PluginRegistry 管 UI 元件互補）。
 * 任何需要在框架層與應用層之間抽象的能力（認證、通知、日誌等），
 * 都透過此容器登記與取用。
 *
 * ```ts
 * // app bootstrap
 * ServiceRegistry.register("auth", new JwtAuthProvider({ secret: "..." }))
 *
 * // 框架內部消費
 * const auth = ServiceRegistry.require<IAuthProvider>("auth")
 * ```
 */
export class ServiceRegistry {
  private static _services = new Map<string, unknown>()

  /**
   * 登記服務。同 key 重複登記時報錯。
   * 若要明確覆蓋，請使用 override()。
   */
  static register<T>(key: string, instance: T): void {
    if (this._services.has(key)) {
      throw new Error(
        `[ServiceRegistry] 服務 "${key}" 已存在。若要覆蓋，請使用 ServiceRegistry.override()。`
      )
    }
    this._services.set(key, instance)
  }

  /**
   * 取得服務。找不到時回傳 undefined。
   */
  static resolve<T>(key: string): T | undefined {
    return this._services.get(key) as T | undefined
  }

  /**
   * 取得服務。找不到時拋錯（用於框架必要服務）。
   */
  static require<T>(key: string): T {
    const instance = this._services.get(key)
    if (instance === undefined) {
      throw new Error(
        `[ServiceRegistry] 服務 "${key}" 尚未登記。請在 app bootstrap 時呼叫 ServiceRegistry.register("${key}", ...)。`
      )
    }
    return instance as T
  }

  /**
   * 覆蓋已有服務（明確意圖，不報錯）。
   * 用於測試或切換實作（例如從 JWT 換成 OAuth）。
   */
  static override<T>(key: string, instance: T): void {
    this._services.set(key, instance)
  }

  /**
   * 清除所有服務（主要用於測試）。
   */
  static clear(): void {
    this._services.clear()
  }
}
