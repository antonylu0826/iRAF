import "reflect-metadata"
import { Entity, remult } from "remult"
import { IRAF_ENTITY_KEY, type IEntityMeta, type IEntityOptions } from "../types/metadata"

/**
 * @iEntity — iRAF 實體 decorator。
 *
 * 包裹 Remult 的 @Entity，並：
 * 1. 注入 saving hook，自動填寫 BaseObject 的稽核欄位
 * 2. 將 iRAF metadata（caption、icon、module 等）儲存至 Reflect metadata
 *
 * **Note:** The decorated class **must** extend `BaseObject` (or otherwise
 * declare the audit fields `createdAt`, `updatedAt`, `createdBy`, and
 * `updatedBy`). The injected `saving` hook unconditionally writes to these
 * properties on every save. If the fields are absent on the class, the hook
 * will silently write to non-existent properties and auditing will **not**
 * function correctly — no error will be thrown at runtime.
 *
 * @param key    Remult 實體 key（對應資料庫表名或 API 路徑）
 * @param options iRAF 實體選項
 *
 * @requires BaseObject — decorated class must expose `createdAt`, `updatedAt`,
 *   `createdBy`, and `updatedBy` fields for the audit hook to have any effect.
 */
export function iEntity(key: string, options: IEntityOptions) {
  return (target: Function): void => {
    const {
      caption,
      icon,
      module: mod,
      defaultOrder,
      allowApiCrud = true,
      allowedRoles,
      saving: userSaving,
      defaultListView,
      viewOptions,
    } = options

    // 1. 儲存 iRAF metadata（不含 saving hook）
    const irafMeta: IEntityMeta = { key, caption, icon, module: mod, defaultOrder, allowedRoles, defaultListView, viewOptions }
    Reflect.defineMetadata(IRAF_ENTITY_KEY, irafMeta, target)

    // 2. 套用 Remult 的 @Entity，注入 saving hook 自動填寫稽核欄位
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
