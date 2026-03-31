import "reflect-metadata"
import { IRAF_CONTROLLER_KEY } from "../types/metadata"
import { EntityRegistry } from "../registry/EntityRegistry"

/**
 * @iController — 將 Controller class 關聯到一個 iRAF 實體。
 *
 * 套用後 EntityRegistry.getActions(entityClass) 可取得此 controller 的所有 @iAction，
 * EntityRegistry.getAllControllers() 可取得所有 controller（用於 remultExpress controllers 陣列）。
 *
 * @param entityClass 要關聯的 BO class
 *
 * @example
 * ```ts
 * @iController(Customer)
 * export class CustomerController {
 *   @iAction({ caption: "寄送歡迎信" })
 *   static async sendWelcomeEmail(id: string): Promise<void> { ... }
 * }
 * ```
 */
export function iController(entityClass: Function) {
  return (target: Function): void => {
    // 1. 在 controller 上記錄它所屬的 entity
    Reflect.defineMetadata(IRAF_CONTROLLER_KEY, entityClass, target)

    // 2. 在 entity 上累積關聯的 controller 清單（供 getActions() 使用）
    const existing: Function[] =
      Reflect.getOwnMetadata(IRAF_CONTROLLER_KEY, entityClass) ?? []
    if (!existing.includes(target)) existing.push(target)
    Reflect.defineMetadata(IRAF_CONTROLLER_KEY, existing, entityClass)

    // 3. 直接登記到 EntityRegistry（讓 getAllControllers() 不依賴 _entities）
    EntityRegistry.registerController(target)
  }
}
