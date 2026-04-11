import { iEntity, iField, BaseObject, type IUserContext } from "@iraf/core"
import type { IPermissionEntry } from "../types.js"

/** Check if a user matches a permission list */
function matchesPermissions(user: IUserContext | undefined, permissions: IPermissionEntry[]): boolean {
  if (!user) return false
  return permissions.some(p => {
    if (p.type === "role") return (user.roles ?? []).includes(p.value)
    if (p.type === "user") return user.id === p.value
    return false
  })
}

@iEntity("dashboards", {
  caption: "Dashboard",
  icon: "LayoutDashboard",
  allowedRoles: {
    read: (user, row) => {
      if (!user) return false
      if ((user.roles ?? []).includes("admins")) return true
      if (!row) return true // list access — apiPrefilter handles filtering
      if (row.createdBy === user.name) return true
      if (row.isPublic) return true
      if (matchesPermissions(user, row.viewPermissions ?? [])) return true
      if (matchesPermissions(user, row.editPermissions ?? [])) return true
      return false
    },
    create: ["admins", "managers", "users"],
    update: (user, row) => {
      if (!user) return false
      if ((user.roles ?? []).includes("admins")) return true
      if (!row) return false
      if (row.createdBy === user.name) return true
      if (matchesPermissions(user, row.editPermissions ?? [])) return true
      return false
    },
    delete: ["admins"],
  },
  defaultOrder: { order: "asc" },
})
export class Dashboard extends BaseObject {
  // ─── Basic info ─────────────────────────────────────────
  @iField.string({ caption: "名稱", required: true, order: 1 })
  name = ""

  @iField.string({ caption: "說明", control: "textarea", order: 2 })
  description = ""

  @iField.string({ caption: "圖示", order: 3 })
  icon = "LayoutDashboard"

  @iField.number({ caption: "排序", order: 4 })
  order = 0

  // ─── Permissions ────────────────────────────────────────
  @iField.json({ caption: "可檢視權限", order: 10 })
  viewPermissions: IPermissionEntry[] = []

  @iField.json({ caption: "可編輯權限", order: 11 })
  editPermissions: IPermissionEntry[] = []

  @iField.boolean({ caption: "公開", order: 12 })
  isPublic = false

  // ─── Layout ─────────────────────────────────────────────
  @iField.number({ caption: "欄數", order: 20, hidden: true })
  columns = 12

  @iField.number({ caption: "間距", order: 21, hidden: true })
  gap = 16
}
