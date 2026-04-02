import { defineModule } from "@iraf/core"
import { AppUser } from "./entities/AppUser"
import { UserController } from "./controllers/UserController"

export const SystemModule = defineModule({
  key: "system",
  caption: "System",
  icon: "Settings",
  entities: [AppUser],
  controllers: [UserController],
  allowedRoles: ["admins"],
  i18n: {
    "zh-TW": {
      "System": "系統管理",
      "Users": "使用者",
      "Username": "帳號",
      "Password Hash": "密碼雜湊",
      "Display Name": "顯示名稱",
      "Active": "啟用",
      "Roles": "角色",
      "Reset Password": "重設密碼",
      "Toggle Active": "切換啟用狀態",
    },
  },
})
