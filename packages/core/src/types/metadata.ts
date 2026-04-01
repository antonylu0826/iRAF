// packages/core/src/types/metadata.ts

// ─── Symbol keys ─────────────────────────────────────────────────────────────
export const IRAF_FIELD_KEY = Symbol("iraf:field")
export const IRAF_ENTITY_KEY = Symbol("iraf:entity")
export const IRAF_ACTION_KEY = Symbol("iraf:action")
export const IRAF_CONTROLLER_KEY = Symbol("iraf:controller")

// ─── Field metadata ───────────────────────────────────────────────────────────

/** iRAF 欄位 UI hints（儲存於 Reflect metadata） */
export interface IFieldMeta {
  caption?: string
  group?: string
  required?: boolean
  /** 靜態 boolean 或依實體狀態動態計算的函式 */
  readOnly?: boolean | ((entity: any) => boolean)
  /** 靜態 boolean 或依實體狀態動態計算的函式 */
  hidden?: boolean | ((entity: any) => boolean)
  order?: number
  displayFormat?: string
  /** 跨欄位驗證：回傳錯誤字串表示驗證失敗，回傳 undefined 表示通過 */
  validate?: (value: any, entity: any) => string | undefined
  /** 標記為稽核欄位，在 DetailView 底部獨立顯示 */
  auditField?: boolean
  /** 指定此欄位使用的 control 插件名稱（e.g. "textarea", "password"）。未指定時由 field type 決定預設 control */
  control?: string
  /** 輸入框的佔位文字 */
  placeholder?: string
  /** iRAF 內部：紀錄 field 的基礎型別（"string" | "number" | "date" | "boolean" | "json"），供 PluginRegistry 解析預設 control */
  _type?: string
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
  defaultOrder?: Record<string, "asc" | "desc">
  allowApiCrud?: boolean | string[]
  allowedRoles?: IEntityRoles
  saving?: (entity: any, event: { isNew: boolean }) => Promise<void> | void
  /** 指定此實體的清單頁使用哪個 list-view 插件（預設 "list"） */
  defaultListView?: string
  /** 傳給 list-view / detail-view 插件的自訂選項 */
  viewOptions?: Record<string, any>
}

/** 儲存於 Reflect metadata 的實體資訊（去掉 saving hook） */
export interface IEntityMeta {
  key: string
  caption: string
  icon?: string
  defaultOrder?: Record<string, "asc" | "desc">
  allowedRoles?: IEntityRoles
  defaultListView?: string
  viewOptions?: Record<string, any>
}

// ─── Action metadata ──────────────────────────────────────────────────────────

/** @iAction 的 metadata */
export interface IActionMeta {
  methodName: string
  caption: string
  icon?: string
  allowedRoles?: string[]
  confirmMessage?: string
}
