import "reflect-metadata"
import { BackendMethod } from "remult"
import { IRAF_ACTION_KEY, type IActionMeta } from "../types/metadata"

/**
 * @iAction — iRAF 業務動作 decorator。
 *
 * 包裹 Remult 的 @BackendMethod，並將 action metadata 儲存至 Reflect metadata。
 * 必須套用在 @iController 裝飾的 class 的 static method 上。
 *
 * @example
 * ```ts
 * @iController(Customer)
 * export class CustomerController {
 *   @iAction({ caption: "寄送歡迎信", icon: "Mail", allowedRoles: ["admin", "sales"] })
 *   static async sendWelcomeEmail(id: string): Promise<void> {
 *     // business logic...
 *   }
 * }
 * ```
 */
export function iAction(options: Omit<IActionMeta, "methodName">) {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor | void => {
    // 1. 套用 Remult BackendMethod，讓此 static method 成為 API endpoint
    BackendMethod({
      allowed: (options.allowedRoles ?? true) as any,
    })(target, propertyKey, descriptor)

    // 2. 儲存 action metadata 到 class（constructor）
    const existing: IActionMeta[] =
      Reflect.getOwnMetadata(IRAF_ACTION_KEY, target) ?? []
    existing.push({ methodName: propertyKey, ...options })
    Reflect.defineMetadata(IRAF_ACTION_KEY, existing, target)
  }
}
