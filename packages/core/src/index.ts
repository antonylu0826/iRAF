// @iraf/core — iRAF Framework Core
// Import reflect-metadata here so all @iraf/core apps load it automatically.
import "reflect-metadata"

// ─── Version ─────────────────────────────────────────────────────────────────
export const IRAF_VERSION = "0.1.0"

// ─── Type Definitions ────────────────────────────────────────────────────────
export type { IEntityOptions, IEntityMeta, IFieldOptions, IFieldMeta, IActionMeta, IEntityRoles, IUserContext, RoleCheck, ICollectionMeta } from "./types/metadata"
export { IRAF_ENTITY_KEY, IRAF_FIELD_KEY, IRAF_ACTION_KEY, IRAF_CONTROLLER_KEY } from "./types/metadata"

// ─── Decorators ──────────────────────────────────────────────────────────────
export { iField } from "./decorators/iField"
export { iEntity } from "./decorators/iEntity"
export { iAction } from "./decorators/iAction"
export { iController } from "./decorators/iController"

// ─── Base ───────────────────────────────────────────────────────────────────
export { BaseObject } from "./base/BaseObject"

// ─── Registry ───────────────────────────────────────────────────────────────
export { EntityRegistry } from "./registry/EntityRegistry"
export { ModuleRegistry, defineModule, SYSTEM_ROLES } from "./registry/ModuleRegistry"
export { ServiceRegistry } from "./registry/ServiceRegistry"

// ─── Module Types ────────────────────────────────────────────────────────────
export type { IModuleDef, IModuleOptions, IMenuItem, IModulePlugin } from "./types/module"

// ─── Service Types ───────────────────────────────────────────────────────────
export type { IAuthProvider, IAuthUser, INotifier, IPasswordHasher } from "./types/services"
export { SERVICE_KEYS } from "./types/services"

// ─── Events ─────────────────────────────────────────────────────────────────
export { EventBus, EVENTS } from "./events/EventBus"
export type {
  EventHandler,
  EntitySavingPayload,
  EntitySavedPayload,
  EntityDeletingPayload,
  EntityDeletedPayload,
  AuthLoginPayload,
} from "./events/EventBus"

// ─── AI Types ──────────────────────────────────────────────────────────────
export type {
  IAiContext,
  IAiChatRequest,
  IAiConfirmRequest,
  IAiToolCallInfo,
  IAiPendingAction,
  IAiUsage,
  IAiMessageDTO,
  IAiSSEEvent,
  IAiStatus,
} from "./types/ai"

// ─── Utils ──────────────────────────────────────────────────────────────────
export { passwordRules } from "./utils/password"
export type { PasswordRulesOptions } from "./utils/password"
export { evalRoleCheck, hasRole } from "./utils/roleCheck"

