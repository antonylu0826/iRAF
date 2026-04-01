import { EntityRegistry } from "./EntityRegistry"
import type { IModuleDef, IModuleOptions, IMenuItem } from "../types/module"

/** 框架預設系統角色 */
export const SYSTEM_ROLES: readonly string[] = ["admins", "users"]

/**
 * defineModule — 宣告一個 iRAF 功能模組。
 *
 * 純函式，回傳 IModuleDef（Readonly）。
 * 實際登記由 ModuleRegistry.use() 完成。
 *
 * ```ts
 * export const SalesModule = defineModule({
 *   key: "sales",
 *   caption: "銷售",
 *   entities: [Customer],
 *   controllers: [CustomerController],
 * })
 * ```
 */
export function defineModule(options: IModuleOptions): IModuleDef {
  return Object.freeze({ ...options })
}

/**
 * ModuleRegistry — iRAF 模組登記簿。
 *
 * 取代散落式的 `EntityRegistry.register()` + `@iEntity({ module })` 寫法。
 * `use()` 會自動登記實體與控制器。
 *
 * ```ts
 * ModuleRegistry.use(SalesModule, SystemModule)
 * ```
 */
export class ModuleRegistry {
  private static _modules: IModuleDef[] = []

  /**
   * 登記一或多個模組。
   * - 同 key 重複登記拋錯
   * - 驗證 requires 依賴（已登記的模組 key 須存在）
   * - 自動呼叫 EntityRegistry.register() 登記實體
   */
  static use(...modules: IModuleDef[]): void {
    for (const mod of modules) {
      // 重複登記檢查
      if (this._modules.find((m) => m.key === mod.key)) {
        throw new Error(
          `[ModuleRegistry] 模組 "${mod.key}" 已存在。請確認沒有重複呼叫 use()。`
        )
      }

      // 依賴檢查
      if (mod.requires && mod.requires.length > 0) {
        const registeredKeys = new Set([
          ...this._modules.map((m) => m.key),
          ...modules.slice(0, modules.indexOf(mod)).map((m) => m.key),
        ])
        for (const dep of mod.requires) {
          if (!registeredKeys.has(dep)) {
            throw new Error(
              `[ModuleRegistry] 模組 "${mod.key}" 依賴 "${dep}"，但 "${dep}" 尚未登記。` +
              ` 請確認 "${dep}" 模組已在 "${mod.key}" 之前傳入 use()。`
            )
          }
        }
      }

      this._modules.push(mod)

      // 自動登記實體
      if (mod.entities && mod.entities.length > 0) {
        EntityRegistry.register(...mod.entities)
      }

      // 自動登記 controllers（補充未用 @iController 自動登記的情況）
      if (mod.controllers && mod.controllers.length > 0) {
        for (const ctrl of mod.controllers) {
          EntityRegistry.registerController(ctrl)
        }
      }
    }
  }

  /** 取得所有已登記模組（按 use 傳入順序）。 */
  static getAll(): IModuleDef[] {
    return [...this._modules]
  }

  /** 取得指定 key 的模組，找不到時回傳 undefined。 */
  static get(key: string): IModuleDef | undefined {
    return this._modules.find((m) => m.key === key)
  }

  /**
   * 取得模組的選單項目。
   * - 若有指定 `menu`，依 order 排序後回傳
   * - 若未指定，自動從 entities 依序生成 type: "entity" 項目
   */
  static getMenu(key: string): IMenuItem[] {
    const mod = this.get(key)
    if (!mod) return []

    if (mod.menu && mod.menu.length > 0) {
      return [...mod.menu].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }

    // 自動從 entities 生成
    return (mod.entities ?? []).map((entity) => ({
      type: "entity" as const,
      entity,
    }))
  }

  /**
   * 尋找某個 entity class 所屬的模組。
   * 供路由生成使用。
   */
  static findModuleByEntity(entityClass: Function): IModuleDef | undefined {
    return this._modules.find((mod) =>
      mod.entities?.includes(entityClass)
    )
  }

  /**
   * 聚合所有角色：系統預設角色 + 各模組宣告的 roles。
   * 去重後回傳。
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

  /** 清除所有登記（主要用於測試）。 */
  static clear(): void {
    this._modules = []
    EntityRegistry.clear()
  }
}
