import { iEntity } from "../decorators/iEntity"
import { iField } from "../decorators/iField"
import { BaseObject } from "../base/BaseObject"

/**
 * iRAFUser — 框架內建使用者實體。
 * 帳號/密碼雜湊/角色清單，由 iRAF 安全層管理。
 * passwordHash 欄位在 UI 層隱藏，透過 auth API 管理。
 */
@iEntity("iraf-users", {
  caption: "使用者",
  icon: "User",
  allowApiCrud: ["admin"],
  allowedRoles: {
    read: ["admin"],
    create: ["admin"],
    update: ["admin"],
    delete: ["admin"],
  },
})
export class iRAFUser extends BaseObject {
  @iField.string({ caption: "帳號", required: true, order: 1 })
  username = ""

  @iField.string({ caption: "密碼雜湊", hidden: true, readOnly: true })
  passwordHash = ""

  @iField.string({ caption: "顯示名稱", order: 2 })
  displayName = ""

  @iField.json({ caption: "角色", hidden: true })
  roles: string[] = []
}
