// @iraf/core — iRAF Framework Core
// import reflect-metadata once here — 所有使用 @iraf/core 的應用程式都會自動載入
import "reflect-metadata"

// ─── 版本 ──────────────────────────────────────────────────────────────────────
export const IRAF_VERSION = "0.1.0"

// ─── 類型定義 ──────────────────────────────────────────────────────────────────
export type { IEntityOptions, IEntityMeta, IFieldOptions, IFieldMeta } from "./types/metadata"
export { IRAF_ENTITY_KEY, IRAF_FIELD_KEY } from "./types/metadata"

// ─── Decorators ───────────────────────────────────────────────────────────────
export { iField } from "./decorators/iField"
export { iEntity } from "./decorators/iEntity"

// ─── Base ─────────────────────────────────────────────────────────────────────
export { BaseObject } from "./base/BaseObject"

// ─── Registry ─────────────────────────────────────────────────────────────────
export { EntityRegistry } from "./registry/EntityRegistry"
