// packages/core/src/types/metadata.ts

// ─── Symbol keys ─────────────────────────────────────────────────────────────
export const IRAF_FIELD_KEY = Symbol("iraf:field")
export const IRAF_ENTITY_KEY = Symbol("iraf:entity")
export const IRAF_ACTION_KEY = Symbol("iraf:action")
export const IRAF_CONTROLLER_KEY = Symbol("iraf:controller")

// ─── User context (minimal, for RBAC predicates) ──────────────────────────────

/** Minimal framework-level user context for RBAC predicates (no packages/react dependency). */
export interface IUserContext {
  id?: string
  name?: string
  roles?: string[]
}

// ─── RBAC role check ─────────────────────────────────────────────────────────

/**
 * Role check type: string[] (role names) or predicate function (row-level support).
 *
 * ```ts
 * // Role list
 * update: ["admins", "users"]
 *
 * // Row-level predicate
 * update: (user, row) => user?.roles?.includes("admins") || user?.id === row?.id
 * ```
 */
export type RoleCheck = string[] | ((user: IUserContext | undefined, row?: any) => boolean)

// ─── Field metadata ───────────────────────────────────────────────────────────

/** iRAF field UI hints (stored in Reflect metadata). */
export interface IFieldMeta {
  caption?: string
  group?: string
  required?: boolean
  /** Static boolean or function computed from entity state. */
  readOnly?: boolean | ((entity: any) => boolean)
  /** Static boolean or function computed from entity state. */
  hidden?: boolean | ((entity: any) => boolean)
  order?: number
  displayFormat?: string
  /**
   * Cross-field validation for this field.
   *
   * IMPORTANT:
   * - Return `undefined` to PASS.
   * - Return a `string` (error message) to FAIL.
   * - DO NOT return `true` or other truthy non-string values; they will be treated as errors by the UI.
   *
   * Example: `validate: (v) => v.length < 3 ? "Too short" : undefined`
   */
  validate?: (value: any, entity: any) => string | undefined;
  /** Mark as audit field; shown in DetailView footer. */
  auditField?: boolean
  /** Control plugin name for this field (e.g. "textarea", "password"). Defaults by field type. */
  control?: string
  /** Input placeholder text */
  placeholder?: string
  /** Progress bar fill color (for "progress" control) */
  progressColor?: string
  /** Only users with these roles can write this field; otherwise readOnly. */
  writeRoles?: string[]
  /** iRAF internal: base field type ("string" | "number" | "date" | "boolean" | "json") for default control resolution. */
  _type?: string
  /** Options for Enum/Choice. Supports string[] or {id, caption}[]. */
  options?: (string | { id: any; caption: string })[]
  /** Reference/Lookup target entity key (e.g. "users"). */
  ref?: string
  /** ref label field name (auto-detects first visible string field if omitted). */
  refLabel?: string
  /** ref threshold: select vs modal (default 25; <= uses <select>, > uses modal). */
  refThreshold?: number
  /** Collection metadata for Master-Detail (SubGrid). */
  collection?: ICollectionMeta
}

/**
 * Master-Detail collection metadata.
 * Produced by @iField.collection for SubGrid control.
 */
export interface ICollectionMeta {
  /** Child entity class (lazy function to avoid circular deps). */
  entity: () => Function
  /** Foreign key field on child entity pointing to parent ID. */
  foreignKey: string
}

/** Options for @iField.string / @iField.number, etc. */
export interface IFieldOptions extends IFieldMeta {}

// ─── Entity metadata ──────────────────────────────────────────────────────────

/** RBAC role permissions (string[] or row-level predicate). */
export interface IEntityRoles {
  read?:   RoleCheck
  create?: RoleCheck
  update?: RoleCheck
  delete?: RoleCheck
}

/** Options for @iEntity (decorator params). */
export interface IEntityOptions {
  caption: string
  icon?: string
  defaultOrder?: Record<string, "asc" | "desc">
  allowApiCrud?: boolean | string[]
  allowedRoles?: IEntityRoles
  saving?: (entity: any, event: { isNew: boolean }) => Promise<void> | void
  /** List-view plugin for this entity (default "list"). */
  defaultListView?: string
  /** Custom options passed to list-view / detail-view plugins. */
  viewOptions?: Record<string, any>
}

/** Entity metadata stored in Reflect (without saving hook). */
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

/** @iAction metadata */
export interface IActionMeta {
  methodName: string
  caption: string
  icon?: string
  allowedRoles?: string[]
  confirmMessage?: string
  /**
   * How to display the action's return value.
   * - undefined / omitted: refresh the record (default)
   * - "drawer": open a side drawer showing the returned data
   */
  resultView?: "drawer"
}
