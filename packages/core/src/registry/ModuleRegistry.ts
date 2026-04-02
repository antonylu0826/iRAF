import { EntityRegistry } from "./EntityRegistry"
import type { IModuleDef, IModuleOptions, IMenuItem } from "../types/module"

/** Default system roles */
export const SYSTEM_ROLES: readonly string[] = ["admins", "users"]

/**
 * defineModule — declare an iRAF module.
 *
 * Pure function returning IModuleDef (readonly).
 * Actual registration is done via ModuleRegistry.use().
 *
 * ```ts
 * export const SalesModule = defineModule({
 *   key: "sales",
 *   caption: "Sales",
 *   entities: [Customer],
 *   controllers: [CustomerController],
 * })
 * ```
 */
export function defineModule(options: IModuleOptions): IModuleDef {
  return Object.freeze({ ...options })
}

/**
 * ModuleRegistry — iRAF module registry.
 *
 * Replaces scattered `EntityRegistry.register()` + `@iEntity({ module })` usage.
 * `use()` auto-registers entities and controllers.
 *
 * ```ts
 * ModuleRegistry.use(SalesModule, SystemModule)
 * ```
 */
export class ModuleRegistry {
  private static _modules: IModuleDef[] = []

  /**
   * Register one or more modules.
   * - Throws on duplicate keys
   * - Validates requires dependencies (registered keys must exist)
   * - Auto-calls EntityRegistry.register() for entities
   */
  static use(...modules: IModuleDef[]): void {
    for (const mod of modules) {
      // Duplicate registration check
      if (this._modules.find((m) => m.key === mod.key)) {
        throw new Error(
          `[ModuleRegistry] Module "${mod.key}" already exists. Ensure use() isn't called twice.`
        )
      }

      // Dependency check
      if (mod.requires && mod.requires.length > 0) {
        const registeredKeys = new Set([
          ...this._modules.map((m) => m.key),
          ...modules.slice(0, modules.indexOf(mod)).map((m) => m.key),
        ])
        for (const dep of mod.requires) {
          if (!registeredKeys.has(dep)) {
            throw new Error(
              `[ModuleRegistry] Module "${mod.key}" requires "${dep}", but "${dep}" is not registered.` +
              ` Ensure "${dep}" is passed to use() before "${mod.key}".`
            )
          }
        }
      }

      this._modules.push(mod)

      // Auto-register entities
      if (mod.entities && mod.entities.length > 0) {
        EntityRegistry.register(...mod.entities)
      }

      // Auto-register controllers (in case @iController wasn't used)
      if (mod.controllers && mod.controllers.length > 0) {
        for (const ctrl of mod.controllers) {
          EntityRegistry.registerController(ctrl)
        }
      }
    }
  }

  /** Get all registered modules (in use() order). */
  static getAll(): IModuleDef[] {
    return [...this._modules]
  }

  /** Get a module by key; returns undefined if not found. */
  static get(key: string): IModuleDef | undefined {
    return this._modules.find((m) => m.key === key)
  }

  /**
   * Get menu items for a module.
   * - If `menu` is provided, sort by order and return
   * - Otherwise, auto-generate from entities as type: "entity"
   */
  static getMenu(key: string): IMenuItem[] {
    const mod = this.get(key)
    if (!mod) return []

    if (mod.menu && mod.menu.length > 0) {
      return [...mod.menu].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }

    // Auto-generate from entities
    return (mod.entities ?? []).map((entity) => ({
      type: "entity" as const,
      entity,
    }))
  }

  /**
   * Find the module that owns a given entity class.
   * Used for route generation.
   */
  static findModuleByEntity(entityClass: Function): IModuleDef | undefined {
    return this._modules.find((mod) =>
      mod.entities?.includes(entityClass)
    )
  }

  /**
   * Aggregate roles: system defaults + module-declared roles.
   */
  static getAllRoles(): string[] {
    const all = new Set<string>(SYSTEM_ROLES)
    for (const mod of this._modules) {
      if (mod.roles) {
        for (const r of mod.roles) all.add(r)
      }
    }
    return [...all]
  }

  /**
   * Run client-side init hooks (onInit) for all modules.
   * Executes in use() order; supports async.
   * Should run before initPlugins() and React render.
   */
  static async initAll(): Promise<void> {
    for (const mod of this._modules) {
      if (mod.onInit) await mod.onInit()
    }
  }

  /**
   * Run server-side init hooks (onServerInit) for all modules.
   * Should run after remultExpress starts.
   */
  static async serverInitAll(): Promise<void> {
    for (const mod of this._modules) {
      if (mod.onServerInit) await mod.onServerInit()
    }
  }

  /**
   * Run destroy hooks (onDestroy) for all modules.
   * Mainly for tests or module hot-reload.
   */
  static destroyAll(): void {
    for (const mod of this._modules) {
      if (mod.onDestroy) mod.onDestroy()
    }
  }

  /** Clear all registrations (mainly for tests). */
  static clear(): void {
    this.destroyAll()
    this._modules = []
    EntityRegistry.clear()
  }
}
