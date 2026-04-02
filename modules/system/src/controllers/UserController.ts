import { remult } from "remult"
import { iController, iAction, ServiceRegistry, SERVICE_KEYS, type IPasswordHasher } from "@iraf/core"
import { AppUser } from "../entities/AppUser"

@iController(AppUser)
export class UserController {
  /**
   * Reset user password (admins only).
   */
  @iAction({ caption: "Reset Password", icon: "KeyRound", allowedRoles: ["admins"] })
  static async resetPassword(id: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("ERR_PASSWORD_TOO_SHORT")
    }
    const hasher = ServiceRegistry.require<IPasswordHasher>(SERVICE_KEYS.PASSWORD_HASHER)
    const repo = remult.repo(AppUser)
    const user = await repo.findId(id)
    if (!user) throw new Error("ERR_USER_NOT_FOUND")
    const passwordHash = await hasher.hash(newPassword)
    await repo.save({ ...user, passwordHash })
  }

  /**
   * Toggle user active status (admins only).
   */
  @iAction({ caption: "Toggle Active", icon: "Power", allowedRoles: ["admins"] })
  static async toggleActive(id: string): Promise<void> {
    const repo = remult.repo(AppUser)
    const user = await repo.findId(id)
    if (!user) throw new Error("ERR_USER_NOT_FOUND")
    await repo.save({ ...user, isActive: !user.isActive })
  }
}
