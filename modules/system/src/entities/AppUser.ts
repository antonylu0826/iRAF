import { iEntity, iField, BaseObject } from "@iraf/core"

/**
 * AppUser — built-in user entity for the framework.
 * Username/password hash/roles are managed by the iRAF security layer.
 * The passwordHash field is hidden in the UI and managed via auth API.
 */
@iEntity("users", {
  caption: "Users",
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
  @iField.string({ caption: "Username", required: true, order: 1 })
  username = ""

  @iField.string({ caption: "Password Hash", hidden: true, readOnly: true })
  passwordHash = ""

  @iField.string({ caption: "Display Name", order: 2 })
  displayName = ""

  @iField.boolean({ caption: "Active", order: 3 })
  isActive = true

  @iField.json({
    caption: "Roles",
    control: "roles",
    order: 4,
    writeRoles: ["admins"],
  })
  roles: string[] = []
}
