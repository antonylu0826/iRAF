// packages/core/src/types/metadata.ts

// ─── Symbol keys ─────────────────────────────────────────────────────────────
export const IRAF_FIELD_KEY = Symbol("iraf:field")
export const IRAF_ENTITY_KEY = Symbol("iraf:entity")
export const IRAF_ACTION_KEY = Symbol("iraf:action")
export const IRAF_CONTROLLER_KEY = Symbol("iraf:controller")

// ─── User context (minimal, for RBAC predicates) ──────────────────────────────

/** 框架層最小 User context，供 RBAC predicate 使用（不依賴 packages/react） */
export interface IUserContext {
  id?: string
  name?: string
  roles?: string[]
}

// ─── RBAC role check ─────────────────────────────────────────────────────────

/**
 * 角色判斷型別：string 陣列（role 名稱）或 predicate function（支援 row-level）。
 *
 * ```ts
 * // 角色陣列
 * update: ["admins", "users"]
 *
 * // Row-level predicate
 * update: (user, row) => user?.roles?.includes("admins") || user?.id === row?.id
 * ```
 */
export type RoleCheck = string[] | ((user: IUserContext | undefined, row?: any) => boolean)

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
  /** 只有具備指定角色的使用者才能寫入此欄位；不符合角色時自動 readOnly */
  writeRoles?: string[]
  /** iRAF 內部：紀錄 field 的基礎型別（"string" | "number" | "date" | "boolean" | "json"），供 PluginRegistry 解析預設 control */
  _type?: string
  /** 供 Enum (Choice) 使用的可選清單。支援字串陣列或物件陣列（id/caption） */
  options?: (string | { id: any; caption: string })[]
  /** 供 Reference (Lookup) 使用，指向關聯實體的 key（例如 "users"） */
  ref?: string
  /** ref 欄位：顯示用的欄位名稱（未指定時自動偵測第一個可見 string 欄位） */
  refLabel?: string
  /** ref 欄位：select / modal 切換閾值（預設 25，筆數 ≤ 此值用 <select>，超過用 Modal） */
  refThreshold?: number
  /** 供 Master-Detail (SubGrid) 使用的子集合設定 */
  collection?: ICollectionMeta
}

/**
 * Master-Detail 子集合 metadata。
 * 由 @iField.collection 裝飾器產生，供 SubGrid control 使用。
 */
export interface ICollectionMeta {
  /** 子實體 class（lazy function 避免循環依賴） */
  entity: () => Function
  /** 子實體上指向父實體 ID 的外鍵欄位名稱 */
  foreignKey: string
}

/** @iField.string / @iField.number 等的選項 */
export interface IFieldOptions extends IFieldMeta {}

// ─── Entity metadata ──────────────────────────────────────────────────────────

/** RBAC 角色權限設定（支援 string[] 或 row-level predicate） */
export interface IEntityRoles {
  read?:   RoleCheck
  create?: RoleCheck
  update?: RoleCheck
  delete?: RoleCheck
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
