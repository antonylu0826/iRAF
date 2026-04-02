// packages/core/src/utils/roleCheck.ts
import type { RoleCheck, IUserContext } from "../types/metadata"

/**
 * evalRoleCheck — 統一評估 RoleCheck（string[] 或 row-level predicate）。
 *
 * ```ts
 * evalRoleCheck(meta?.allowedRoles?.update, user, row)
 * ```
 */
export function evalRoleCheck(
  check: RoleCheck | undefined,
  user: IUserContext | null | undefined,
  row?: any
): boolean {
  if (!check) return true
  if (typeof check === "function") return check(user ?? undefined, row)
  return check.some((r) => (user?.roles ?? []).includes(r))
}

/**
 * hasRole — 檢查使用者是否具備指定角色之一。
 *
 * ```ts
 * hasRole(user?.roles ?? [], am.allowedRoles)
 * ```
 */
export function hasRole(
  userRoles: string[],
  required?: string[]
): boolean {
  if (!required || required.length === 0) return true
  return required.some((r) => userRoles.includes(r))
}
