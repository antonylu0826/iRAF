import "reflect-metadata"
import { Entity, remult } from "remult"
import { IRAF_ENTITY_KEY, type IEntityMeta, type IEntityOptions } from "../types/metadata"

/**
 * @iEntity — iRAF entity decorator.
 *
 * Wraps Remult's @Entity and:
 * 1. Injects a saving hook to fill BaseObject audit fields
 * 2. Stores iRAF metadata (caption, icon, etc.) in Reflect metadata
 *
 * **Note:** The decorated class **must** extend `BaseObject` (or otherwise
 * declare the audit fields `createdAt`, `updatedAt`, `createdBy`, and
 * `updatedBy`). The injected `saving` hook unconditionally writes to these
 * properties on every save. If the fields are absent on the class, the hook
 * will silently write to non-existent properties and auditing will **not**
 * function correctly — no error will be thrown at runtime.
 *
 * @param key    Remult entity key (table name or API route)
 * @param options iRAF entity options
 *
 * @requires BaseObject — decorated class must expose `createdAt`, `updatedAt`,
 *   `createdBy`, and `updatedBy` fields for the audit hook to have any effect.
 */
export function iEntity(key: string, options: IEntityOptions) {
  return (target: Function): void => {
    const {
      caption,
      icon,
      defaultOrder,
      allowApiCrud = true,
      allowedRoles,
      saving: userSaving,
      defaultListView,
      viewOptions,
    } = options

    // 1. Store iRAF metadata (excluding saving hook)
    const irafMeta: IEntityMeta = { key, caption, icon, defaultOrder, allowedRoles, defaultListView, viewOptions }
    Reflect.defineMetadata(IRAF_ENTITY_KEY, irafMeta, target)

    // 2. Apply Remult @Entity with saving hook for audit fields
    Entity(key, {
      allowApiCrud,
      saving: async (entity: any, e: { isNew: boolean }) => {
        if (e.isNew) {
          entity.createdAt = new Date()
          entity.createdBy = remult.user?.name ?? ""
        }
        entity.updatedAt = new Date()
        entity.updatedBy = remult.user?.name ?? ""
        await userSaving?.(entity, e)
      },
    })(target)
  }
}
