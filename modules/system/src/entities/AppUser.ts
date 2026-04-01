import { iEntity, iField, BaseObject } from "@iraf/core"

/**
 * AppUser — 框架內建使用者實體。
 * 帳號/密碼雜湊/角色清單，由 iRAF 安全層管理。
 * passwordHash 欄位在 UI 層隱藏，透過 auth API 管理。
 */
@iEntity("users", {
  caption: "使用者",
  icon: "User",
  allowApiCrud: ["admins"],
  allowedRoles: {
    read:   ["admins", "users"],
    create: ["admins"],
    update: (user, row) => user?.roles?.includes("admins") || user?.id === row?.id,
    delete: ["admins"],
  },
})
export class AppUser extends BaseObject {
  @iField.string({ caption: "帳號", required: true, order: 1 })
  username = ""

  @iField.string({ caption: "密碼雜湊", hidden: true, readOnly: true })
  passwordHash = ""

  @iField.string({ caption: "顯示名稱", order: 2 })
  displayName = ""

  @iField.boolean({ caption: "啟用", order: 3 })
  isActive = true

  @iField.json({
    caption: "角色",
    control: "roles",
    order: 4,
    writeRoles: ["admins"],
  })
  roles: string[] = []
}
