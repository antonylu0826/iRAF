// packages/core/src/types/metadata.ts

// ─── Symbol keys ─────────────────────────────────────────────────────────────
/** iRAF 欄位 UI metadata 的 Reflect key */
export const IRAF_FIELD_KEY = Symbol("iraf:field")

/** iRAF 實體 metadata 的 Reflect key */
export const IRAF_ENTITY_KEY = Symbol("iraf:entity")

// ─── Field metadata ───────────────────────────────────────────────────────────

/** iRAF 欄位 UI hints（儲存於 Reflect metadata） */
export interface IFieldMeta {
  caption?: string
  group?: string
  required?: boolean
  readOnly?: boolean
  hidden?: boolean
  order?: number
  displayFormat?: string
}

/** @iField.string / @iField.number 等的選項 */
export interface IFieldOptions extends IFieldMeta {}

// ─── Entity metadata ──────────────────────────────────────────────────────────

/** RBAC 角色權限設定 */
export interface IEntityRoles {
  read?: string[]
  create?: string[]
  update?: string[]
  delete?: string[]
}

/** @iEntity 的選項（傳入 decorator 的參數） */
export interface IEntityOptions {
  caption: string
  icon?: string
  module?: string
  defaultOrder?: Record<string, "asc" | "desc">
  allowApiCrud?: boolean | string[]
  allowedRoles?: IEntityRoles
  saving?: (entity: any, event: { isNew: boolean }) => Promise<void> | void
}

/** 儲存於 Reflect metadata 的實體資訊（去掉 saving hook） */
export interface IEntityMeta {
  key: string
  caption: string
  icon?: string
  module?: string
  defaultOrder?: Record<string, "asc" | "desc">
  allowedRoles?: IEntityRoles
}
