import { remult } from "remult"
import { iController, iAction } from "@iraf/core"
import { AppUser } from "../entities/AppUser"

@iController(AppUser)
export class UserController {
  /**
   * 重設指定使用者密碼（僅 admins）。
   */
  @iAction({ caption: "重設密碼", icon: "KeyRound", allowedRoles: ["admins"] })
  static async resetPassword(id: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("密碼長度至少需要 6 個字元")
    }
    const { default: bcrypt } = await import("bcrypt")
    const repo = remult.repo(AppUser)
    const user = await repo.findId(id)
    if (!user) throw new Error("使用者不存在")
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await repo.save({ ...user, passwordHash })
  }

  /**
   * 切換指定使用者的啟用狀態（僅 admins）。
   */
  @iAction({ caption: "切換啟用狀態", icon: "Power", allowedRoles: ["admins"] })
  static async toggleActive(id: string): Promise<void> {
    const repo = remult.repo(AppUser)
    const user = await repo.findId(id)
    if (!user) throw new Error("使用者不存在")
    await repo.save({ ...user, isActive: !user.isActive })
  }
}
