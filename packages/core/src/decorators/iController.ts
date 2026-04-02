import "reflect-metadata"
import { IRAF_CONTROLLER_KEY } from "../types/metadata"
import { EntityRegistry } from "../registry/EntityRegistry"

/**
 * @iController — associates a Controller class with an iRAF entity.
 *
 * After applying, EntityRegistry.getActions(entityClass) returns all @iAction for that controller,
 * and EntityRegistry.getAllControllers() returns all controllers (for remultExpress controllers array).
 *
 * @param entityClass BO class to associate
 *
 * @example
 * ```ts
 * @iController(Customer)
 * export class CustomerController {
 *   @iAction({ caption: "Send Welcome Email" })
 *   static async sendWelcomeEmail(id: string): Promise<void> { ... }
 * }
 * ```
 */
export function iController(entityClass: Function) {
  return (target: Function): void => {
    // 1. Record associated entity on the controller
    Reflect.defineMetadata(IRAF_CONTROLLER_KEY, entityClass, target)

    // 2. Accumulate controllers on the entity (for getActions())
    const existing: Function[] =
      Reflect.getOwnMetadata(IRAF_CONTROLLER_KEY, entityClass) ?? []
    if (!existing.includes(target)) existing.push(target)
    Reflect.defineMetadata(IRAF_CONTROLLER_KEY, existing, entityClass)

    // 3. Register directly in EntityRegistry (so getAllControllers() doesn't depend on _entities)
    EntityRegistry.registerController(target)
  }
}
