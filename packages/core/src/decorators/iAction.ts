import "reflect-metadata"
import { BackendMethod } from "remult"
import { IRAF_ACTION_KEY, type IActionMeta } from "../types/metadata"

/**
 * @iAction — iRAF business action decorator.
 *
 * Wraps Remult @BackendMethod and stores action metadata in Reflect metadata.
 * Must be applied on static methods of classes decorated with @iController.
 *
 * @example
 * ```ts
 * @iController(Customer)
 * export class CustomerController {
 *   @iAction({ caption: "Send Welcome Email", icon: "Mail", allowedRoles: ["admin", "sales"] })
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
    // 1. Apply Remult BackendMethod so this static method becomes an API endpoint
    //    apiPrefix = class name so routes are /api/{ClassName}/{methodName}
    //    paramTypes explicitly set because esbuild doesn't emit design:paramtypes
    BackendMethod({
      allowed: (options.allowedRoles ?? true) as any,
      apiPrefix: (target as any).name,
      paramTypes: () => [String],
    })(target, propertyKey, descriptor)

    // 2. Store action metadata on the class (constructor)
    const existing: IActionMeta[] =
      Reflect.getOwnMetadata(IRAF_ACTION_KEY, target) ?? []
    existing.push({ methodName: propertyKey, ...options })
    Reflect.defineMetadata(IRAF_ACTION_KEY, existing, target)
  }
}
