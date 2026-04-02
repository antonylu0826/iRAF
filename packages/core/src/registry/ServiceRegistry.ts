/**
 * ServiceRegistry — iRAF non-UI service container.
 *
 * Manages swappable "services" (complements PluginRegistry for UI components).
 * Any capability abstracted between framework and app layers (auth, notifications, logging, etc.)
 * should be registered and resolved here.
 *
 * ```ts
 * // app bootstrap
 * ServiceRegistry.register("auth", new JwtAuthProvider({ secret: "..." }))
 *
 * // framework usage
 * const auth = ServiceRegistry.require<IAuthProvider>("auth")
 * ```
 */
export class ServiceRegistry {
  private static _services = new Map<string, unknown>()

  /**
   * Register a service. Throws if key already exists.
   * Use override() to explicitly replace.
   */
  static register<T>(key: string, instance: T): void {
    if (this._services.has(key)) {
      throw new Error(
        `[ServiceRegistry] Service "${key}" already exists. Use ServiceRegistry.override() to replace.`
      )
    }
    this._services.set(key, instance)
  }

  /**
   * Resolve a service. Returns undefined if not found.
   */
  static resolve<T>(key: string): T | undefined {
    return this._services.get(key) as T | undefined
  }

  /**
   * Require a service. Throws if missing (for required framework services).
   */
  static require<T>(key: string): T {
    const instance = this._services.get(key)
    if (instance === undefined) {
      throw new Error(
        `[ServiceRegistry] Service "${key}" is not registered. Call ServiceRegistry.register("${key}", ...) during app bootstrap.`
      )
    }
    return instance as T
  }

  /**
   * Override an existing service (explicit replacement).
   * Useful for tests or swapping implementations (e.g., JWT -> OAuth).
   */
  static override<T>(key: string, instance: T): void {
    this._services.set(key, instance)
  }

  /**
   * Clear all services (mainly for tests).
   */
  static clear(): void {
    this._services.clear()
  }
}
